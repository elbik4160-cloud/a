import { useEffect, useRef } from "react";
import { Centrifuge } from "centrifuge";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../lib/api";

const CENTRIFUGO_URL = process.env.EXPO_PUBLIC_CENTRIFUGO_URL ?? "ws://localhost:8000/connection/websocket";

export function useRealtime(channel: string, onMessage: (data: unknown) => void) {
  const centrifuge = useRef<Centrifuge | null>(null);

  useEffect(() => {
    let sub: ReturnType<Centrifuge["newSubscription"]> | null = null;

    const connect = async () => {
      try {
        const token = await AsyncStorage.getItem("auth_token");
        if (!token) return;

        centrifuge.current = new Centrifuge(CENTRIFUGO_URL, {
          token: await getRealtimeToken(),
        });

        sub = centrifuge.current.newSubscription(channel);
        sub.on("publication", ({ data }) => onMessage(data));
        sub.subscribe();
        centrifuge.current.connect();
      } catch (err) {
        console.error(`Realtime connection failed for ${channel}:`, err);
      }
    };

    connect();

    return () => {
      sub?.unsubscribe();
      centrifuge.current?.disconnect();
      centrifuge.current = null;
    };
  }, [channel]);

  return centrifuge;
}

async function getRealtimeToken(): Promise<string> {
  try {
    const { token } = await api.realtime.token();
    return token;
  } catch {
    return "";
  }
}
