import ReactConfetti from "react-confetti";
import type { ScreenTablesStateEvent } from "../../data/events";
import type { TableData } from "../../data/models";
import "./JoinPage.css";
import { useWindowSize } from "react-use";

// Маппинг статусов
const statusMap: Record<TableData["table_state"], string> = {
  waiting_leader: "Ожидает лидера",
  waiting_game_start: "Готов",
  in_question: "Готова",
  in_answers: "Готова",
  in_results: "Готова",
};

interface JoinPageProps {
  screenState: ScreenTablesStateEvent;
}

function getStatusColor(table: TableData) {
  const readyStates = ["waiting_game_start", "in_question", "in_answers", "in_statistics"];
  if (table.table_state === "waiting_leader") return "status-red";
  if (table.table_state === "waiting_game_start" && !table.table_name) return "status-yellow";
  if (readyStates.includes(table.table_state)) return "status-green";
  return "status-yellow";
}

export const JoinPage = ({ screenState }: JoinPageProps) => {
  const { tables } = screenState;
  const { width, height } = useWindowSize();
  return (
    <>
      <ReactConfetti width={width} height={height} numberOfPieces={10} recycle={true} />
      <div>
        <h1 className="screen-instructions-h1">Ожидание Игры</h1>
        <span className="screen-instructions-counter">
          {
            screenState.tables.filter(
              (table) => table.table_state === "waiting_game_start" && table.table_name
            ).length
          }
          /{screenState.tables.length} готово
        </span>
        <div className="screen-tables-list-container">
          <ul className="screen-instructions">
            <li>
              Найдите и Отсканируйте <b>QR</b> на вашем столе{" "}
            </li>
            <li>Придумайте название команды</li>
            <li>Подождите, пока ведущий начнёт игру</li>
          </ul>
        </div>
        <div className="screen-tables-list">
          {tables.map((table) => (
            <div className="screen-table-card" key={table.table_id}>
              <div className="screen-table-id">
                <b>Стол № {table.table_id}</b>
              </div>
              <div className="screen-table-title">{table.table_name || <em>Без названия</em>}</div>
              <div className={`screen-table-status`}>
                Статус:{" "}
                <b className={getStatusColor(table)}>
                  {table.table_state === "waiting_game_start" && !table.table_name
                    ? "Придумывает название"
                    : statusMap[table.table_state]}
                </b>
              </div>
              <div className="screen-table-clients">Устройств: {table.clients}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
