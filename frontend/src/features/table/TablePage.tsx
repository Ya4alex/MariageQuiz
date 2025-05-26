import { JoinForm } from "./JoinForm";
import QuestionForm from "./QuestionForm";
import { useTableWebSocket } from "./useTableState";
import { useParams } from "react-router-dom";
import "./TablePage.css";
import TableResult from "./TableResult";

const TablePage = () => {
  const { id } = useParams<{ id: string }>();
  const { tableState, sendTableName, sendTableAnswers, sendAnswerQuestion } = useTableWebSocket(
    id ? parseInt(id) : 0
  );

  return (
    <div className="table-page-container">
      {tableState?.table_state === "waiting_game_start" && (
        <JoinForm tableState={tableState} sendTableName={sendTableName} />
      )}

      {(tableState?.table_state === "in_question" || tableState?.table_state === "in_answers") && (
        <QuestionForm
          tableState={tableState}
          sendTableAnswers={sendTableAnswers}
          sendAnswerQuestion={sendAnswerQuestion}
        />
      )}
      {tableState?.table_state === "in_results" && <TableResult tableState={tableState} />}
    </div>
  );
};

export default TablePage;
