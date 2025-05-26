import { useState, useEffect, useCallback, useRef } from "react";
import type { TableEvent, WsEvent } from "../../data/events";
import { toast } from "react-toastify";
import { WS_SERVER } from "../../config";

const RECONNECT_DELAY = 3000;

export const useTableWebSocket = (tableId: number) => {
  const [tableState, setTableState] = useState<TableEvent | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<number | null>(null);

  useEffect(() => {
    let isUnmounted = false;

    function connect() {
      if (isUnmounted) return;
      const ws = new WebSocket(`${WS_SERVER}/ws/table/${tableId}`);
      wsRef.current = ws;
      setSocket(ws);

      ws.onmessage = (event) => {
        const data: WsEvent = JSON.parse(event.data);
        console.log(data); // Логирование входящих сообщений
        switch (data.event_type) {
          case "table":
            setTableState(data as TableEvent);
            break;
          case "error":
            toast.error((data as any).error, { position: "bottom-right" });
            break;
          default:
            break;
        }
      };

      ws.onclose = () => {
        if (!isUnmounted) {
          toast.warn("Соединение с сервером потеряно. Переподключение...", {
            position: "bottom-right",
            autoClose: 2000,
          });
          reconnectTimeout.current = window.setTimeout(connect, RECONNECT_DELAY);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      isUnmounted = true;
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };
  }, [tableId]);

  // Отправка имени стола
  const sendTableName = useCallback(
    (name: string) => {
      if (socket) {
        socket.send(
          JSON.stringify({
            event_type: "from_set_table_name",
            table_name: name,
          })
        );
      }
    },
    [socket]
  );

  // Отправка выбранных ответов (лидер выбирает варианты)
  const sendTableAnswers = useCallback(
    (answers: number[]) => {
      if (socket) {
        socket.send(
          JSON.stringify({
            event_type: "from_set_table_answers",
            table_answers: answers,
          })
        );
      }
    },
    [socket]
  );

  // Отправка финального ответа (лидер отправляет окончательный выбор)
  const sendAnswerQuestion = useCallback(
    (answers: number[]) => {
      if (socket) {
        socket.send(
          JSON.stringify({
            event_type: "from_answer_question",
            table_answers: answers,
          })
        );
      }
    },
    [socket]
  );

  return { tableState, sendTableName, sendTableAnswers, sendAnswerQuestion };
};
