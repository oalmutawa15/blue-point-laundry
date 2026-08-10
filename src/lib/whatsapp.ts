import "server-only";

// Sends WhatsApp messages from a normal (non–Business-API) number via a QR-linked
// gateway. Default provider: UltraMsg. Falls back to "not configured" so the app
// keeps working (messages are still logged/recorded) until credentials are set.

export type WaResult = { ok: boolean; error?: string };

// UltraMsg is the default (and only) provider. It's considered configured as
// soon as the instance id + token are present — no separate WHATSAPP_PROVIDER
// var required (a missing provider var was silently disabling all sends).
function ultramsgEnabled(): boolean {
  const provider = process.env.WHATSAPP_PROVIDER;
  const hasCreds = !!process.env.ULTRAMSG_INSTANCE_ID && !!process.env.ULTRAMSG_TOKEN;
  // Enabled when creds exist, unless the provider is explicitly set to something
  // other than ultramsg.
  return hasCreds && (!provider || provider === "ultramsg");
}

export function whatsappConfigured(): boolean {
  return ultramsgEnabled();
}

export async function sendWhatsApp(to: string, body: string): Promise<WaResult> {
  if (ultramsgEnabled()) {
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

// Send an image (by public URL) with an optional caption over WhatsApp.
export async function sendWhatsAppImage(
  to: string,
  imageUrl: string,
  caption: string,
): Promise<WaResult> {
  if (ultramsgEnabled()) {
    const instance = process.env.ULTRAMSG_INSTANCE_ID;
    const token = process.env.ULTRAMSG_TOKEN;
    if (!instance || !token) return { ok: false, error: "not_configured" };
    try {
      const res = await fetch(`https://api.ultramsg.com/${instance}/messages/image`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token, to, image: imageUrl, caption }).toString(),
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
