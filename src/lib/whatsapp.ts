import "server-only";

// Sends WhatsApp messages from a normal (non–Business-API) number via a QR-linked
// gateway. Default provider: UltraMsg. Falls back to "not configured" so the app
// keeps working (messages are still logged/recorded) until credentials are set.

export type WaResult = { ok: boolean; error?: string };

export function whatsappConfigured(): boolean {
  return (
    process.env.WHATSAPP_PROVIDER === "ultramsg" &&
    !!process.env.ULTRAMSG_INSTANCE_ID &&
    !!process.env.ULTRAMSG_TOKEN
  );
}

export async function sendWhatsApp(to: string, body: string): Promise<WaResult> {
  if (process.env.WHATSAPP_PROVIDER === "ultramsg") {
    const instance = process.env.ULTRAMSG_INSTANCE_ID;
    const token = process.env.ULTRAMSG_TOKEN;
    if (!instance || !token) return { ok: false, error: "not_configured" };
    try {
      const res = await fetch(`https://api.ultramsg.com/${instance}/messages/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token, to, body }).toString(),
      });
      const json = (await res.json().catch(() => ({}))) as {
        sent?: string | boolean;
        error?: string;
      };
      if (!res.ok || json.error) {
        return { ok: false, error: json.error || `http_${res.status}` };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }
  return { ok: false, error: "no_provider" };
}
