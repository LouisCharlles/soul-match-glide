import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { buildWebSocketUrl } from "@/lib/realtime";

type StoryEvent =
  | { type: "story.created" | "story.updated"; entity: "story"; data: unknown; timestamp?: string }
  | { type: "story.deleted"; entity: "story"; data: { id: number }; timestamp?: string };

interface RealtimeContextValue {
  presenceByUserId: Record<number, boolean>;
  subscribeToStoryEvents: (listener: (event: StoryEvent) => void) => () => void;
}

const RealtimeContext = createContext<RealtimeContextValue | undefined>(undefined);
const RECONNECT_DELAYS_MS = [1000, 2000, 5000, 10000];

function debugRealtime(message: string, details?: Record<string, unknown>) {
  if (!import.meta.env.DEV) {
    return;
  }

  console.debug(`[bonding:realtime] ${message}`, details ?? {});
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [presenceByUserId, setPresenceByUserId] = useState<Record<number, boolean>>({});
  const storyListenersRef = useRef(new Set<(event: StoryEvent) => void>());

  useEffect(() => {
    if (!isAuthenticated) {
      setPresenceByUserId({});
      return;
    }

    const presenceUrl = buildWebSocketUrl("/ws/presence/");
    const storiesUrl = buildWebSocketUrl("/ws/stories/");
    if (!presenceUrl || !storiesUrl) {
      return;
    }

    let isCancelled = false;
    const makeConnector = (
      channelName: "presence" | "stories",
      url: string,
      handlers: {
        onMessage: (event: MessageEvent<string>) => void;
        onOpen?: (socket: WebSocket) => void;
        shouldReconnect?: (event: CloseEvent) => boolean;
      },
    ) => {
      let socket: WebSocket | null = null;
      let pingTimer: number | null = null;
      let reconnectTimer: number | null = null;
      let reconnectAttempt = 0;
      let reconnectScheduled = false;

      const clearPing = () => {
        if (pingTimer !== null) {
          window.clearInterval(pingTimer);
          pingTimer = null;
        }
      };

      const clearReconnect = () => {
        if (reconnectTimer !== null) {
          window.clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
        reconnectScheduled = false;
      };

      const scheduleReconnect = (reason: string) => {
        if (isCancelled || reconnectScheduled) {
          return;
        }

        const delay = RECONNECT_DELAYS_MS[Math.min(reconnectAttempt, RECONNECT_DELAYS_MS.length - 1)];
        reconnectAttempt += 1;
        reconnectScheduled = true;
        reconnectTimer = window.setTimeout(() => {
          reconnectTimer = null;
          reconnectScheduled = false;
          connect();
        }, delay);

        debugRealtime(`agendando reconexão de ${channelName}`, { delay, attempt: reconnectAttempt, reason });
      };

      const connect = () => {
        if (isCancelled || socket?.readyState === WebSocket.OPEN || socket?.readyState === WebSocket.CONNECTING) {
          return;
        }

        debugRealtime(`abrindo socket de ${channelName}`);
        socket = new WebSocket(url);

        socket.onopen = () => {
          reconnectAttempt = 0;
          clearReconnect();
          debugRealtime(`socket de ${channelName} conectado`);

          if (channelName === "presence") {
            pingTimer = window.setInterval(() => {
              if (socket?.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: "ping" }));
              }
            }, 30000);
          }

          handlers.onOpen?.(socket);
        };

        socket.onmessage = handlers.onMessage;

        socket.onerror = () => {
          debugRealtime(`erro no socket de ${channelName}`);
        };

        socket.onclose = (event) => {
          clearPing();
          socket = null;
          debugRealtime(`socket de ${channelName} fechado`, { code: event.code, reason: event.reason });

          if (isCancelled) {
            return;
          }

          const shouldReconnect = handlers.shouldReconnect?.(event) ?? true;
          if (!shouldReconnect) {
            debugRealtime(`reconexão abortada para ${channelName}`, { code: event.code });
            return;
          }

          scheduleReconnect(`close:${event.code}`);
        };
      };

      const cleanup = () => {
        clearPing();
        clearReconnect();
        socket?.close();
        socket = null;
      };

      return { connect, cleanup };
    };

    const presenceConnection = makeConnector("presence", presenceUrl, {
      onMessage: (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "presence.updated" && payload.data?.user_id) {
            setPresenceByUserId((current) => ({
              ...current,
              [Number(payload.data.user_id)]: Boolean(payload.data.is_online),
            }));
          }
        } catch {
          // ignore malformed presence messages
        }
      },
      shouldReconnect: (event) => {
        if (event.code === 4001 || event.code === 4003) {
          return false;
        }
        return true;
      },
    });

    const storiesConnection = makeConnector("stories", storiesUrl, {
      onMessage: (event) => {
        try {
          const payload = JSON.parse(event.data) as StoryEvent;
          storyListenersRef.current.forEach((listener) => listener(payload));
        } catch {
          // ignore malformed story events
        }
      },
      shouldReconnect: (event) => {
        if (event.code === 4001 || event.code === 4003) {
          return false;
        }
        return true;
      },
    });

    presenceConnection.connect();
    storiesConnection.connect();

    return () => {
      isCancelled = true;
      presenceConnection.cleanup();
      storiesConnection.cleanup();
    };
  }, [isAuthenticated]);

  const value = useMemo<RealtimeContextValue>(() => ({
    presenceByUserId,
    subscribeToStoryEvents: (listener) => {
      storyListenersRef.current.add(listener);
      return () => {
        storyListenersRef.current.delete(listener);
      };
    },
  }), [presenceByUserId]);

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error("useRealtime must be used within a RealtimeProvider");
  }
  return context;
}
