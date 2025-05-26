import { useState } from "react";
import { useAdmin } from "./useAdminState";
import "./AdminPage.css";

const AdminPage = () => {
  const {
    sendAdminResizeTables,
    sendAdminChangeLeader,
    sendAdminStartGame,
    sendAdminShowAnswers,
    sendAdminPreviousQuestion,
    sendAdminNextQuestion,
    sendAdminShowResults,
    sendAdminResetGame,
    sendAdminNextStep,
  } = useAdmin();
  const [tableCount, setTableCount] = useState(7);
  const [tableId, setTableId] = useState(1);

  // Подтверждение для опасных/важных действий
  const confirmAction = (message: string, action: () => void) => {
    if (window.confirm(message)) action();
  };

  return (
    <div className="admin-page">
      <h1 style={{ textAlign: "center", marginBottom: "1em" }}>Admin</h1>

      <div className="admin-section">
        <div className="admin-label">Настройки столов</div>
        <div className="admin-input-row">
          <label htmlFor="tableCount">Кол-во столов:</label>
          <input
            onChange={(e) => setTableCount(parseInt(e.target.value))}
            value={tableCount}
            type="number"
            id="tableCount"
            min={1}
            style={{ width: 60 }}
          />
          <button
            className="admin-btn admin-btn-secondary"
            onClick={() =>
              confirmAction(
                "Изменить количество столов?",
                () => sendAdminResizeTables(tableCount)
              )
            }
          >
            Применить
          </button>
        </div>
        <div className="admin-input-row">
          <label htmlFor="tableId">ID стола:</label>
          <input
            onChange={(e) => setTableId(parseInt(e.target.value))}
            value={tableId}
            type="number"
            id="tableId"
            min={1}
            style={{ width: 60 }}
          />
          <button
            className="admin-btn admin-btn-secondary"
            onClick={() =>
              confirmAction(
                `Сделать стол ${tableId} новым лидером?`,
                () => sendAdminChangeLeader(tableId)
              )
            }
          >
            Новый лидер
          </button>
        </div>
      </div>

      <div className="admin-section">
        <button
          className="admin-btn admin-btn-primary"
          onClick={sendAdminNextStep}
        >
          ➡️ Следующий шаг
        </button>
        <button
          className="admin-btn admin-btn-secondary"
          onClick={() =>
            confirmAction(
              "Начать игру? Это действие нельзя отменить.",
              sendAdminStartGame
            )
          }
        >
          ▶️ Начать игру
        </button>
        <button
          className="admin-btn admin-btn-secondary"
          onClick={() =>
            confirmAction(
              "Показать ответы всем?",
              sendAdminShowAnswers
            )
          }
        >
          Показать ответы
        </button>
        <button
          className="admin-btn admin-btn-secondary"
          onClick={sendAdminPreviousQuestion}
        >
          ⬅️ Предыдущий вопрос
        </button>
        <button
          className="admin-btn admin-btn-secondary"
          onClick={sendAdminNextQuestion}
        >
          ➡️ Следующий вопрос
        </button>
        <button
          className="admin-btn admin-btn-warning"
          onClick={() =>
            confirmAction(
              "Показать результаты? После этого игра будет завершена.",
              sendAdminShowResults
            )
          }
        >
          🏆 Показать результаты
        </button>
        <button
          className="admin-btn admin-btn-danger"
          onClick={() =>
            confirmAction(
              "Сбросить игру? Это действие нельзя отменить!",
              sendAdminResetGame
            )
          }
        >
          ❗ Сбросить игру
        </button>
      </div>

      <p style={{ textAlign: "center", color: "#888", fontSize: "0.95em" }}>
        Все действия требуют подтверждения нажатием на кнопку.<br />
        <b>Основная кнопка — "Следующий шаг"</b>
      </p>
    </div>
  );
};

export default AdminPage;
