import { useState, useEffect, useCallback, useRef } from "react";
import type { WsEvent } from "../../data/events";
import { toast } from "react-toastify";
import { WS_SERVER } from "../../config";

const RECONNECT_DELAY = 3000;

export const useAdmin = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<number | null>(null);

  useEffect(() => {
    let isUnmounted = false;

    function connect() {
      if (isUnmounted) return;
      const ws = new WebSocket(`${WS_SERVER}/ws/admin`);
      wsRef.current = ws;
      setSocket(ws);

      ws.onmessage = (event) => {
        const data: WsEvent = JSON.parse(event.data);
        switch (data.event_type) {
          case "error":
            toast.error("Ошибка: " + (data as any).error, { position: "bottom-right" });
            break;
          default:
            // обработка других событий
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
  }, []);

  const sendAdminResizeTables = useCallback(
    (count: number) => {
      if (socket) {
        socket.send(
          JSON.stringify({
            event_type: "from_admin_resize_tables",
            count,
          })
        );
      }
    },
    [socket]
  );

  const sendAdminChangeLeader = useCallback(
    (tableId: number) => {
      if (socket) {
        socket.send(
          JSON.stringify({
            event_type: "from_admin_change_leader",
            table_id: tableId,
          })
        );
      }
    },
    [socket]
  );

  const sendAdminStartGame = useCallback(() => {
    if (socket) {
      socket.send(
        JSON.stringify({
          event_type: "from_admin_start_game",
        })
      );
    }
  }, [socket]);

  const sendAdminShowAnswers = useCallback(() => {
    if (socket) {
      socket.send(
        JSON.stringify({
          event_type: "from_admin_show_answers",
        })
      );
    }
  }, [socket]);

  const sendAdminPreviousQuestion = useCallback(() => {
    if (socket) {
      socket.send(
        JSON.stringify({
          event_type: "from_admin_previous_question",
        })
      );
    }
  }, [socket]);

  const sendAdminNextQuestion = useCallback(() => {
    if (socket) {
      socket.send(
        JSON.stringify({
          event_type: "from_admin_next_question",
        })
      );
    }
  }, [socket]);

  const sendAdminShowResults = useCallback(() => {
    if (socket) {
      socket.send(
        JSON.stringify({
          event_type: "from_admin_show_results",
        })
      );
    }
  }, [socket]);

  const sendAdminResetGame = useCallback(() => {
    if (socket) {
      socket.send(
        JSON.stringify({
          event_type: "from_admin_reset_game",
        })
      );
    }
  }, [socket]);

  const sendAdminNextStep = useCallback(() => {
    if (socket) {
      socket.send(
        JSON.stringify({
          event_type: "from_admin_next_step",
        })
      );
    }
  }, [socket]);

  return {
    sendAdminResizeTables,
    sendAdminChangeLeader,
    sendAdminStartGame,
    sendAdminShowAnswers,
    sendAdminPreviousQuestion,
    sendAdminNextQuestion,
    sendAdminShowResults,
    sendAdminResetGame,
    sendAdminNextStep
  };
};
