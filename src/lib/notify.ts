import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsApp, sendWhatsAppImage, whatsappConfigured } from "@/lib/whatsapp";
import { filsToKwd } from "@/lib/money";

// Records an outbound message and sends it via WhatsApp when a gateway is configured.
// Never throws — a failed send is logged and recorded, but won't break the order flow.
type SupabaseAdmin = ReturnType<typeof createAdminClient>;

async function record(
  admin: SupabaseAdmin,
  args: {
    orderId: string | null;
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

// Customer messages — intentionally only the "picked up" stage here. The other
// two customer touchpoints are the receipt link (notifyReceipt) and delivery
// (notifyDelivered). No messages for the intermediate shop steps.
const CUSTOMER_STAGE_MESSAGES: Record<string, (orderNo: string) => string> = {
  picked_up: (o) =>
    `🚗 استلم المندوب طلبك ${o} وهو في طريقه إلى مصبغة بلو بوينت.` +
    `\n\n🚗 Your order ${o} has been picked up and is on its way to Blue Point Laundry.`,
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

// Records an outbound WhatsApp IMAGE (photo by public URL) and sends it when a
// gateway is configured. Same logging behaviour as record(). Never throws.
async function recordImage(
  admin: SupabaseAdmin,
  args: {
    orderId: string;
    recipientId: string | null;
    recipientPhone: string | null;
    template: string;
    caption: string;
    imageUrl: string;
  },
) {
  let status = "queued";
  try {
    if (whatsappConfigured() && args.recipientPhone) {
      const res = await sendWhatsAppImage(args.recipientPhone, args.imageUrl, args.caption);
      status = res.ok ? "sent" : "failed";
      if (!res.ok) console.warn(`[WhatsApp img] send failed → ${args.recipientPhone}: ${res.error}`);
    } else {
      console.log(`[WhatsApp img mock] → ${args.recipientPhone}: ${args.imageUrl}`);
    }
    await admin.from("notifications").insert({
      order_id: args.orderId,
      recipient_id: args.recipientId,
      recipient_phone: args.recipientPhone,
      template: args.template,
      message: args.caption,
      channel: "whatsapp",
      status,
    });
  } catch (e) {
    console.warn(`[notify img] error: ${(e as Error).message}`);
  }
}

// Delivered with a proof photo → send the PHOTO to the customer and to shop staff.
export async function notifyDeliveryPhoto(
  orderId: string,
  orderNo: string,
  customerId: string | null,
  photoUrl: string,
) {
  const admin = createAdminClient();

  // Customer gets the photo as their "delivered" message.
  if (customerId) {
    const { data: c } = await admin
      .from("profiles")
      .select("phone")
      .eq("id", customerId)
      .single();
    await recordImage(admin, {
      orderId,
      recipientId: customerId,
      recipientPhone: c?.phone ?? null,
      template: "delivered_photo",
      caption:
        `✅ تم توصيل طلبك ${orderNo} بنجاح. هذه صورة التسليم. شكراً لاختيارك بلو بوينت.` +
        `\n\n✅ Your order ${orderNo} has been delivered. Here is the delivery photo. Thank you for choosing Blue Point Laundry.`,
      imageUrl: photoUrl,
    });
  }

  // Shop/admin staff also receive the delivery photo.
  const { data: staff } = await admin
    .from("profiles")
    .select("id, phone")
    .in("role", ["shop", "admin"]);
  for (const s of staff ?? []) {
    await recordImage(admin, {
      orderId,
      recipientId: s.id,
      recipientPhone: s.phone,
      template: "delivered_photo_shop",
      caption:
        `📷 تم تسليم الطلب ${orderNo}. صورة التسليم مرفقة.` +
        `\n\n📷 Order ${orderNo} delivered. Delivery photo attached.`,
      imageUrl: photoUrl,
    });
  }
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
    .select("phone, preferences, credit_fils")
    .eq("id", customerId)
    .single();
  // Match the language the customer uses on the website (saved on their profile).
  const prefs = c?.preferences;
  const lang =
    prefs && typeof prefs === "object" && !Array.isArray(prefs) &&
    (prefs as Record<string, unknown>).lang === "en"
      ? "en"
      : "ar";
  const link = `${url}${url.includes("?") ? "&" : "?"}lang=${lang}`;
  const balanceFils = c?.credit_fils ?? 0;
  const balance = filsToKwd(balanceFils);
  const message =
    lang === "en"
      ? `🧼 We've started washing your order ${orderNo} at Blue Point Laundry.\nView or download your receipt here:\n${link}\n\n💰 Wallet balance: ${balance} KWD`
      : `🧼 بدأنا غسيل طلبك ${orderNo} في بلو بوينت.\nهذه فاتورة طلبك — يمكنك عرضها وتحميلها من هنا:\n${link}\n\n💰 رصيد محفظتك: ${balance} د.ك`;
  await record(admin, {
    orderId,
    recipientId: customerId,
    recipientPhone: c?.phone ?? null,
    template: "receipt",
    message,
  });

  // Low balance (< 5 KWD) → a follow-up nudge with a link to top up the wallet.
  if (balanceFils < 5000) {
    const origin = (() => {
      try {
        return new URL(url).origin;
      } catch {
        return "";
      }
    })();
    const creditLink = `${origin}/credit`;
    const lowMsg =
      lang === "en"
        ? `⚠️ Your Blue Point wallet balance is low (${balance} KWD). Top up here to keep ordering:\n${creditLink}`
        : `⚠️ رصيد محفظتك في بلو بوينت منخفض (${balance} د.ك). اشحن رصيدك من هنا لمواصلة الطلب:\n${creditLink}`;
    await record(admin, {
      orderId,
      recipientId: customerId,
      recipientPhone: c?.phone ?? null,
      template: "low_balance",
      message: lowMsg,
    });
  }

  return { ok: true as const, phone: c?.phone ?? null };
}

// Walk-in paid by "link" → send the customer a secure link to pay THIS order
// online. `payUrl` is the tamper-proof per-order payment page (the amount is
// fixed server-side); we append the customer's language.
export async function notifyPaymentLink(
  orderId: string,
  orderNo: string,
  customerId: string | null,
  payUrl: string,
  amountFils: number,
) {
  if (!customerId) return;
  const admin = createAdminClient();
  const { data: c } = await admin
    .from("profiles")
    .select("phone, preferences")
    .eq("id", customerId)
    .single();
  const prefs = c?.preferences;
  const lang =
    prefs && typeof prefs === "object" && !Array.isArray(prefs) &&
    (prefs as Record<string, unknown>).lang === "en"
      ? "en"
      : "ar";
  const link = `${payUrl}${payUrl.includes("?") ? "&" : "?"}lang=${lang}`;
  const amount = filsToKwd(amountFils);
  const message =
    lang === "en"
      ? `💳 Your order ${orderNo} at Blue Point Laundry is ${amount} KWD.\nPay securely online here:\n${link}`
      : `💳 قيمة طلبك ${orderNo} في مصبغة بلو بوينت هي ${amount} د.ك.\nيمكنك الدفع بأمان أونلاين من هنا:\n${link}`;
  await record(admin, {
    orderId,
    recipientId: customerId,
    recipientPhone: c?.phone ?? null,
    template: "payment_link",
    message,
  });
}

// Order paid online via its payment link → confirm to the customer and tell the
// shop the order is settled.
export async function notifyOrderPaid(
  orderId: string,
  orderNo: string,
  customerId: string | null,
  amountFils: number,
) {
  const admin = createAdminClient();
  const amount = filsToKwd(amountFils);
  if (customerId) {
    const { data: c } = await admin
      .from("profiles")
      .select("phone")
      .eq("id", customerId)
      .single();
    await record(admin, {
      orderId,
      recipientId: customerId,
      recipientPhone: c?.phone ?? null,
      template: "order_paid",
      message:
        `✅ تم استلام دفعتك لطلب ${orderNo} بمبلغ ${amount} د.ك. شكراً لك — مصبغة بلو بوينت.` +
        `\n\n✅ We've received your payment for order ${orderNo} (${amount} KWD). Thank you — Blue Point Laundry.`,
    });
  }
  // Tell the shop the order is now paid.
  const { data: staff } = await admin
    .from("profiles")
    .select("id, phone")
    .in("role", ["shop", "admin"]);
  for (const s of staff ?? []) {
    await record(admin, {
      orderId,
      recipientId: s.id,
      recipientPhone: s.phone,
      template: "order_paid_shop",
      message:
        `💳 تم دفع الطلب ${orderNo} (${amount} د.ك) عبر رابط الدفع.` +
        `\n\n💳 Order ${orderNo} (${amount} KWD) has been paid via the payment link.`,
    });
  }
}

// Order payment failed/declined → let the customer know it did not go through.
export async function notifyOrderPaymentFailed(
  orderId: string,
  orderNo: string,
  customerId: string | null,
) {
  if (!customerId) return;
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
    template: "order_payment_failed",
    message:
      `❌ لم تتم عملية الدفع لطلب ${orderNo} ولم يُخصم أي مبلغ. يمكنك المحاولة مرة أخرى من نفس الرابط.` +
      `\n\n❌ The payment for order ${orderNo} did not go through and nothing was charged. You can try again from the same link.`,
  });
}

// Wallet top-up captured → confirm to the customer that their balance was funded.
// Fires the moment the payment is verified as captured, regardless of whether the
// customer is still on the result page — so a slow capture still gets a definite
// confirmation.
export async function notifyTopUpConfirmed(customerId: string, creditFils: number) {
  const admin = createAdminClient();
  const { data: c } = await admin
    .from("profiles")
    .select("phone, preferences, credit_fils")
    .eq("id", customerId)
    .single();
  const prefs = c?.preferences;
  const lang =
    prefs && typeof prefs === "object" && !Array.isArray(prefs) &&
    (prefs as Record<string, unknown>).lang === "en"
      ? "en"
      : "ar";
  const added = filsToKwd(creditFils);
  const balance = filsToKwd(c?.credit_fils ?? 0);
  const message =
    lang === "en"
      ? `✅ Payment confirmed. ${added} KWD has been added to your Blue Point wallet.\n💰 New balance: ${balance} KWD.`
      : `✅ تم تأكيد الدفع. تمت إضافة ${added} د.ك إلى محفظتك في بلو بوينت.\n💰 رصيدك الجديد: ${balance} د.ك.`;
  await record(admin, {
    orderId: null,
    recipientId: customerId,
    recipientPhone: c?.phone ?? null,
    template: "topup_confirmed",
    message,
  });
}

// A scheduled pickup couldn't be placed because the wallet balance is 0 → nudge
// the customer to top up so future scheduled pickups go through.
export async function notifyScheduledPickupSkipped(
  customerId: string,
  origin: string,
) {
  const admin = createAdminClient();
  const { data: c } = await admin
    .from("profiles")
    .select("phone, preferences")
    .eq("id", customerId)
    .single();
  const prefs = c?.preferences;
  const lang =
    prefs && typeof prefs === "object" && !Array.isArray(prefs) &&
    (prefs as Record<string, unknown>).lang === "en"
      ? "en"
      : "ar";
  const link = `${origin}/credit`;
  const message =
    lang === "en"
      ? `⏰ Your scheduled pickup today couldn't be placed because your wallet balance is empty. Top up here and we'll pick up on your next scheduled day:\n${link}`
      : `⏰ لم نتمكن من تنفيذ استلامك المجدول اليوم لأن رصيد محفظتك فارغ. اشحن رصيدك من هنا وسنستلم في يومك المجدول القادم:\n${link}`;
  await record(admin, {
    orderId: null,
    recipientId: customerId,
    recipientPhone: c?.phone ?? null,
    template: "scheduled_pickup_skipped",
    message,
  });
}

// New order placed → alert all shop staff.
export async function notifyNewOrder(orderId: string, orderNo: string) {
  const admin = createAdminClient();
  const { data: staff } = await admin
    .from("profiles")
    .select("id, phone")
    .in("role", ["shop", "admin"]);
  const message =
    `🧺 طلب جديد ${orderNo} في بلو بوينت. افتح الموقع لمراجعة الطلب وتعيين مندوب.` +
    `\n\n🧺 New order ${orderNo} at Blue Point. Open the site to review it and assign a driver.`;
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
    message:
      `🚗 لديك طلب استلام ${orderNo}. افتح الموقع لعرض موقع الاستلام.` +
      `\n\n🚗 You have a pickup ${orderNo}. Open the site to see the pickup location.`,
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
    message:
      `📦 الطلب ${orderNo} جاهز للتوصيل. افتح الموقع لعرض موقع التسليم.` +
      `\n\n📦 Order ${orderNo} is ready for delivery. Open the site to see the delivery location.`,
  });
}

// Self-pickup order is ready → tell the customer to come collect it.
export async function notifyReadyForPickup(
  orderId: string,
  orderNo: string,
  customerId: string | null,
) {
  if (!customerId) return;
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
    template: "ready_for_pickup",
    message:
      `🧺 طلبك ${orderNo} جاهز للاستلام من مصبغة بلو بوينت.` +
      `\n\n🧺 Your order ${orderNo} is ready for pickup at Blue Point Laundry.`,
  });
}

// Self-pickup order collected → confirm to the customer it's been picked up.
export async function notifyCollected(
  orderId: string,
  orderNo: string,
  customerId: string | null,
) {
  if (!customerId) return;
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
    template: "collected",
    message:
      `✅ تم استلام طلبك ${orderNo}. شكراً لاختيارك مصبغة بلو بوينت.` +
      `\n\n✅ Your order ${orderNo} has been picked up. Thank you for choosing Blue Point Laundry.`,
  });
}

// Daily late-orders alert → notify shop + admin staff with a summary of every
// order still pending past its dispatch day. Sent by the scheduled job.
export async function notifyLateOrders(
  orders: { id: string; order_no: string }[],
): Promise<{ notified: number }> {
  if (!orders.length) return { notified: 0 };
  const admin = createAdminClient();
  const { data: staff } = await admin
    .from("profiles")
    .select("id, phone")
    .in("role", ["shop", "admin"]);
  const list = orders.map((o) => o.order_no).join("، ");
  const message =
    `⚠️ لديك ${orders.length} طلب متأخر لم يُنجزها المندوب في وقتها:\n${list}\nيرجى المتابعة مع المندوبين.` +
    `\n\n⚠️ You have ${orders.length} late order(s) not completed on time:\n${list}\nPlease follow up with the drivers.`;
  let notified = 0;
  for (const s of staff ?? []) {
    let status = "queued";
    try {
      if (whatsappConfigured() && s.phone) {
        const res = await sendWhatsApp(s.phone, message);
        status = res.ok ? "sent" : "failed";
        if (!res.ok) console.warn(`[WhatsApp late] → ${s.phone}: ${res.error}`);
      }
      await admin.from("notifications").insert({
        order_id: orders[0].id,
        recipient_id: s.id,
        recipient_phone: s.phone,
        template: "late_orders",
        message,
        channel: "whatsapp",
        status,
      });
      if (status === "sent") notified++;
    } catch (e) {
      console.warn(`[notify late] error: ${(e as Error).message}`);
    }
  }
  return { notified };
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
    message:
      `✅ تم توصيل طلبك ${orderNo} بنجاح. شكراً لاختيارك بلو بوينت.` +
      `\n\n✅ Your order ${orderNo} has been delivered. Thank you for choosing Blue Point Laundry.`,
  });
}
