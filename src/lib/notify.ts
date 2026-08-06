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
