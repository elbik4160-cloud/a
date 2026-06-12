"use client";
import { useEffect, useRef } from "react";
import { Centrifuge } from "centrifuge";
import type { PublicationContext, SubscribedContext } from "centrifuge";
import type { EventName, EventPayloadMap } from "@crm/realtime";

const CENTRIFUGO_URL =
  process.env.NEXT_PUBLIC_CENTRIFUGO_URL || "ws://localhost:8000/connection/websocket";

// Singleton — connection واحدة لكل الـ app
let centrifugeInstance: Centrifuge | null = null;

function getCentrifuge(token: string): Centrifuge {
  if (centrifugeInstance) return centrifugeInstance;

  centrifugeInstance = new Centrifuge(CENTRIFUGO_URL, {
    token,
    // Token refresh تلقائي قبل الـ expiry
    getToken: async () => {
      const res = await fetch("/api/realtime/token");
      const data = await res.json();
      return data.token;
    },
  });

  centrifugeInstance.connect();
  return centrifugeInstance;
}

export function useRealtimeChannel<E extends EventName>(
  channel: string,
  event: E,
  handler: (payload: E extends keyof EventPayloadMap ? EventPayloadMap[E] : unknown) => void,
  token: string
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const client = getCentrifuge(token);
    const sub = client.newSubscription(channel, {
      // recover: true ← Centrifugo يسترجع الرسائل الفايتة تلقائياً
    });

    sub.on("publication", (ctx: PublicationContext) => {
      const { event: receivedEvent, payload } = ctx.data;
      if (receivedEvent === event) {
        handlerRef.current(payload);
      }
    });

    // هنا بيحصل الـ recovery — لو كان offline هيجيب الرسائل الفايتة
    sub.on("subscribed", (ctx: SubscribedContext) => {
      if (ctx.wasRecovering && !ctx.recovered) {
        // الرسائل فاتت أكثر من الـ history — reload من API
        console.warn("State lost, need full refresh");
      }
    });

    sub.subscribe();

    return () => {
      sub.unsubscribe();
    };
  }, [channel, event, token]);
}
