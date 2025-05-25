import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import type {
  ScreenTablesStateEvent,
  ScreenTableAnsweredEvent,
  ErrorWsEvent,
} from "../../data/events";
import { WS_SERVER } from "../../config";

type AnyScreenEvent = ScreenTablesStateEvent | ScreenTableAnsweredEvent | ErrorWsEvent;

function isScreenTableAnsweredEvent(data: AnyScreenEvent): data is ScreenTableAnsweredEvent {
  return data.event_type === "screen_table_answered";
}

function isErrorWsEvent(data: AnyScreenEvent): data is ErrorWsEvent {
  return data.event_type === "error";
}

const RECONNECT_DELAY = 3000; // 2 секунды

export const useScreenState = () => {
  const [screenState, setScreenState] = useState<ScreenTablesStateEvent>({
    event_type: "screen_tables_state",
    game_state: "waiting",
    tables: [],
    question: undefined,
    results: undefined,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<number | null>(null);
  useEffect(() => {
    let isUnmounted = false;

    function connect() {
      if (isUnmounted) return;
      const ws = new WebSocket(`${WS_SERVER}/ws/screen`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        const data: AnyScreenEvent = JSON.parse(event.data);
        if (data.event_type === "screen_tables_state") {
          console.log("Получено состояние столов:", data);
          setScreenState(data as ScreenTablesStateEvent);
        }
        if (isScreenTableAnsweredEvent(data)) {
          toast.info(
            `Стол №${data.table_id} ${data.table_name ? `${data.table_name} ` : ""}дал ответ`,
            { position: "bottom-right", autoClose: 4000 }
          );
          if (data.last) {
            toast.success("Все столы ответили!", {
              position: "bottom-right",
              autoClose: 5000,
            });
          }
        }
        if (isErrorWsEvent(data)) {
          toast.error("Ошибка: " + data.error, { position: "bottom-right" });
        }
      };

      ws.onclose = () => {
        if (!isUnmounted) {
          toast.warn("Соединение с сервером потеряно. Переподключение...", {
            position: "bottom-right",
            autoClose: 2000,
          });
          reconnectTimeout.current = setTimeout(connect, RECONNECT_DELAY);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      isUnmounted = true;
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, []);

  return screenState;
};
