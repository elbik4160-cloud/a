// Publisher — يُستخدم من API Routes بعد كل mutation
import type { EventName, EventPayloadMap } from "@crm/realtime";

const CENTRIFUGO_API_URL = process.env.CENTRIFUGO_API_URL || "http://localhost:8000/api";

if (!process.env.CENTRIFUGO_API_KEY) {
  console.error(
    "CENTRIFUGO_API_KEY is not set — real-time publishing will fail. Set it in .env.local"
  );
}
const CENTRIFUGO_API_KEY = process.env.CENTRIFUGO_API_KEY ?? "";

interface PublishOptions<E extends EventName> {
  channel: string;
  event: E;
  data: E extends keyof EventPayloadMap ? EventPayloadMap[E] : unknown;
}

export async function publishToChannel<E extends EventName>(
  options: PublishOptions<E>
): Promise<void> {
  const { channel, event, data } = options;

  try {
    const response = await fetch(`${CENTRIFUGO_API_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": CENTRIFUGO_API_KEY,
      },
      body: JSON.stringify({
        method: "publish",
        params: {
          channel,
          data: { event, payload: data },
        },
      }),
    });

    if (!response.ok) {
      console.error("Centrifugo publish failed:", await response.text());
    }
  } catch (error) {
    // لا نرمي error — الـ real-time هو enhancement وليس critical path
    console.error("Centrifugo publish error:", error);
  }
}

// Helper لـ batch publish (أكثر كفاءة)
export async function batchPublish(
  messages: Array<{ channel: string; data: unknown }>
): Promise<void> {
  const commands = messages.map((msg) => ({
    method: "publish",
    params: msg,
  }));

  try {
    const response = await fetch(`${CENTRIFUGO_API_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": CENTRIFUGO_API_KEY,
      },
      body: JSON.stringify(commands),
    });

    if (!response.ok) {
      console.error("Centrifugo batch publish failed:", await response.text());
    }
  } catch (error) {
    console.error("Centrifugo batch publish error:", error);
  }
}
