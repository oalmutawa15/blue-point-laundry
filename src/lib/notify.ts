import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsApp, whatsappConfigured } from "@/lib/whatsapp";

// Records an outbound message and sends it via WhatsApp when a gateway is configured.
// Never throws — a failed send is logged and recorded, but won't break the order flow.
type SupabaseAdmin = ReturnType<typeof createAdminClient>;

async function record(
  admin: SupabaseAdmin,
  args: {
    orderId: string;
    recipientId: string | null;
    recipientPhone: string | null;
    template: string;
    message: string;
  },
) {
  let status = "queued";
  try {
    if (whatsappConfigured() && args.recipientPhone) {
      const res = await sendWhatsApp(args.recipientPhone, args.message);
      status = res.ok ? "sent" : "failed";
      if (!res.ok) console.warn(`[WhatsApp] send failed → ${args.recipientPhone}: ${res.error}`);
    } else {
      console.log(`[WhatsApp mock] → ${args.recipientPhone}: ${args.message}`);
    }
    await admin.from("notifications").insert({
      order_id: args.orderId,
      recipient_id: args.recipientId,
      recipient_phone: args.recipientPhone,
      template: args.template,
      message: args.message,
      channel: "whatsapp",
      status,
    });
  } catch (e) {
    console.warn(`[notify] error: ${(e as Error).message}`);
  }
}

// Customer-facing message for each order stage (Arabic, brand "بلو بوينت").
const CUSTOMER_STAGE_MESSAGES: Record<string, (orderNo: string) => string> = {
  pickup_requested: (o) =>
    `📍 تم تعيين مندوب لاستلام طلبك ${o}. سيصلك قريباً لأخذ الملابس.`,
  picked_up: (o) => `🚗 استلم المندوب طلبك ${o} وهو في طريقه إلى المصبغة.`,
  counting: (o) => `🧾 وصل طلبك ${o} إلى المصبغة ويتم الآن جرد القطع وتسعيرها.`,
  awaiting_payment: (o) => `💳 طلبك ${o} جاهز للدفع. سيتم خصم قيمته من رصيدك.`,
  washing: (o) => `🧼 تم تأكيد الدفع، وجارٍ غسل وكي طلبك ${o} الآن.`,
  ready: (o) => `📦 طلبك ${o} جاهز! سيتم توصيله إليك قريباً.`,
  delivering: (o) => `🚚 طلبك ${o} في الطريق إليك الآن.`,
  delivered: (o) => `✅ تم توصيل طلبك ${o} بنجاح. شكراً لاختيارك بلو بوينت.`,
};

// Notify the customer of an order stage change. No-op for stages without a
// customer message (or when there's no customer, e.g. some walk-ins).
export async function notifyCustomerStage(
  orderId: string,
  orderNo: string,
  customerId: string | null,
  status: string,
) {
  const build = CUSTOMER_STAGE_MESSAGES[status];
  if (!build || !customerId) return;
  const admin = createAdminClient();
  const { data: c } = await admin
    .from("profiles")
    .select("phone")
    .eq("id", customerId)
    .single();
  await record(admin, {
    orderId,
    recipientId: customerId,
    recipientPhone: c?.phone ?? null,
    template: `customer_${status}`,
    message: build(orderNo),
  });
}

// Order cancelled → tell the customer, including the refund amount if any.
export async function notifyCustomerCancelled(
  orderId: string,
  orderNo: string,
  customerId: string | null,
  refundFils: number,
) {
  if (!customerId) return;
  const admin = createAdminClient();
  const { data: c } = await admin
    .from("profiles")
    .select("phone")
    .eq("id", customerId)
    .single();
  const kwd = (refundFils / 1000).toFixed(3);
  const message =
    refundFils > 0
      ? `❌ تم إلغاء طلبك ${orderNo} واسترجاع ${kwd} د.ك. لأي استفسار تواصل معنا.`
      : `❌ تم إلغاء طلبك ${orderNo}. لأي استفسار تواصل معنا.`;
  await record(admin, {
    orderId,
    recipientId: customerId,
    recipientPhone: c?.phone ?? null,
    template: "customer_cancelled",
    message,
  });
}

// Receipt published → send the customer a WhatsApp with the receipt link.
export async function notifyReceipt(
  orderId: string,
  orderNo: string,
  customerId: string | null,
  url: string,
) {
  if (!customerId) return { ok: false as const, error: "no_customer" };
  const admin = createAdminClient();
  const { data: c } = await admin
    .from("profiles")
    .select("phone")
    .eq("id", customerId)
    .single();
  const message = `🧾 تم إصدار إيصال طلبك ${orderNo} من بلو بوينت.\nيمكنك عرض الإيصال وتحميله من هنا:\n${url}`;
  await record(admin, {
    orderId,
    recipientId: customerId,
    recipientPhone: c?.phone ?? null,
    template: "receipt",
    message,
  });
  return { ok: true as const, phone: c?.phone ?? null };
}

// New order placed → alert all shop staff.
export async function notifyNewOrder(orderId: string, orderNo: string) {
  const admin = createAdminClient();
  const { data: staff } = await admin
    .from("profiles")
    .select("id, phone")
    .in("role", ["shop", "admin"]);
  const message = `🧺 طلب جديد ${orderNo} في بلو بوينت. افتح الموقع لمراجعة الطلب وتعيين مندوب.`;
  for (const s of staff ?? []) {
    await record(admin, {
      orderId,
      recipientId: s.id,
      recipientPhone: s.phone,
      template: "new_order",
      message,
    });
  }
}

// Pickup assigned → alert the driver.
export async function notifyPickupAssigned(
  orderId: string,
  orderNo: string,
  driverId: string,
) {
  const admin = createAdminClient();
  const { data: d } = await admin
    .from("profiles")
    .select("phone")
    .eq("id", driverId)
    .single();
  await record(admin, {
    orderId,
    recipientId: driverId,
    recipientPhone: d?.phone ?? null,
    template: "pickup_assigned",
    message: `🚗 لديك طلب استلام ${orderNo}. افتح الموقع لعرض موقع الاستلام.`,
  });
}

// Order ready → alert the delivery driver.
export async function notifyReadyForDelivery(
  orderId: string,
  orderNo: string,
  driverId: string,
) {
  const admin = createAdminClient();
  const { data: d } = await admin
    .from("profiles")
    .select("phone")
    .eq("id", driverId)
    .single();
  await record(admin, {
    orderId,
    recipientId: driverId,
    recipientPhone: d?.phone ?? null,
    template: "ready_for_delivery",
    message: `📦 الطلب ${orderNo} جاهز للتوصيل. افتح الموقع لعرض موقع التسليم.`,
  });
}

// Delivered → notify the customer.
export async function notifyDelivered(
  orderId: string,
  orderNo: string,
  customerId: string,
) {
  const admin = createAdminClient();
  const { data: c } = await admin
    .from("profiles")
    .select("phone")
    .eq("id", customerId)
    .single();
  await record(admin, {
    orderId,
    recipientId: customerId,
    recipientPhone: c?.phone ?? null,
    template: "delivered",
    message: `✅ تم توصيل طلبك ${orderNo} بنجاح. شكراً لاختيارك بلو بوينت.`,
  });
}
