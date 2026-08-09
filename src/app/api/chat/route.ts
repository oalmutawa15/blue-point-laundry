import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PRICE_CATEGORIES } from "@/lib/priceList";
import { filsToKwd } from "@/lib/money";

export const dynamic = "force-dynamic";

const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const CONTACT = process.env.BLUE_POINT_CONTACT || "";
const MAPS = "https://www.google.com/maps/search/?api=1&query=29.3348158,48.072984";

type Msg = { role: "user" | "assistant"; content: string };

function priceListText(): string {
  return PRICE_CATEGORIES.map((c) => {
    const lines = c.items
      .map((it) => {
        if (it.from != null) return `- ${it.en} (${it.ar}): from ${filsToKwd(it.from)} KWD`;
        const p = it.prices;
        if (!p) return `- ${it.en} (${it.ar}): price on request`;
        const parts = [
          p.wash != null ? `wash&iron ${filsToKwd(p.wash)}` : null,
          p.dryclean != null ? `dryclean ${filsToKwd(p.dryclean)}` : null,
          p.iron != null ? `iron-only ${filsToKwd(p.iron)}` : null,
        ]
          .filter(Boolean)
          .join(", ");
        return `- ${it.en} (${it.ar}): ${parts} KWD`;
      })
      .join("\n");
    return `${c.en}:\n${lines}`;
  }).join("\n\n");
}

export async function POST(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ reply: "Chat is not configured yet." });
  }

  let incoming: Msg[] = [];
  try {
    const body = (await req.json()) as { messages?: Msg[] };
    incoming = (body.messages ?? [])
      .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-8);
  } catch {
    incoming = [];
  }

  // Ground the bot in the signed-in customer's real data.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let customerText = "The user is not signed in, so you can't see their orders — ask them to sign in or give an order number for order-status questions.";
  if (user) {
    const [{ data: profile }, { data: orders }] = await Promise.all([
      supabase.from("profiles").select("full_name, credit_fils").eq("id", user.id).single(),
      supabase
        .from("orders")
        .select("order_no, status, price_fils, delivery_date, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);
    const bal = filsToKwd(profile?.credit_fils ?? 0);
    const list =
      (orders ?? [])
        .map(
          (o) =>
            `#${o.order_no}: status=${o.status}, price=${o.price_fils != null ? filsToKwd(o.price_fils) + " KWD" : "not set yet"}, delivery_date=${o.delivery_date ?? "not set yet"}`,
        )
        .join("\n") || "This customer has no orders yet.";
    customerText = `Signed-in customer: ${profile?.full_name || "customer"}. Wallet balance: ${bal} KWD.\nTheir recent orders:\n${list}`;
  }

  const system = `You are the friendly customer-support assistant for Blue Point Laundry (مصبغة بلو بوينت), a laundry & dry-cleaning service in Kuwait. Currency is Kuwaiti Dinar (KWD).

Help with:
- "Where is my order" / order status: use the customer's orders in CUSTOMER CONTEXT. Explain statuses in plain words: new = order received; pickup_requested = a driver is assigned to pick up; picked_up = picked up from you; counting = at the shop being counted; awaiting_payment = counted & priced, waiting for payment; washing = being washed; ready = ready for delivery; delivering = out for delivery; delivered = delivered. If they have several orders, ask which order number, or summarise the latest.
- Prices: use the PRICE LIST. If an item isn't there, say to check the Price List page in the app or ask the shop.
- Delivery time: use the order's delivery_date when available; otherwise explain the shop sets the delivery date once the order is counted and priced.
- Contact & location: ${CONTACT ? `phone: ${CONTACT}. ` : "we don't have a phone number to share here — direct them to visit the shop. "}Location on Google Maps: ${MAPS}
- How ordering works: from the app, tap once to request a pickup; a driver collects the clothes; the shop counts and prices them; you pay from your prepaid wallet (top up with KNET/cards); then they're washed and delivered back. Walk-in drop-off at the shop is also fine.

Rules: Reply in the SAME language the user writes in (Arabic or English). Be concise and warm — a few sentences. NEVER invent order numbers, prices, delivery dates, or a phone number that is not given here. If you don't know, say so and point them to the app or the shop.

PRICE LIST:
${priceListText()}

CUSTOMER CONTEXT:
${customerText}`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.3,
        max_tokens: 600,
        messages: [{ role: "system", content: system }, ...incoming],
      }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      choices?: { message?: { content?: string } }[];
      error?: { message?: string };
    };
    if (!res.ok) {
      console.error("[groq chat] http", res.status, json?.error?.message);
      return NextResponse.json({ reply: "Sorry, I couldn't respond right now. Please try again." });
    }
    const reply = json.choices?.[0]?.message?.content?.trim() || "Sorry, I didn't catch that.";
    return NextResponse.json({ reply });
  } catch (e) {
    console.error("[groq chat] error", (e as Error).message);
    return NextResponse.json({ reply: "Sorry, I couldn't respond right now. Please try again." });
  }
}
