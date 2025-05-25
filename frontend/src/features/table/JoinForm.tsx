import { useState } from "react";
import type { TableEvent } from "../../data/events";
import "./JoinForm.css";

interface JoinFormProps {
  tableState: TableEvent;
  sendTableName: (name: string) => void;
}

export const JoinForm = ({ tableState, sendTableName }: JoinFormProps) => {
  const [inputName, setInputName] = useState("");

  const handleSetTableName = () => {
    sendTableName(inputName);
  };

  return (
    <div className="join-form-container">
      <h2>
        Стол #{tableState.table_id} {tableState.table_name}
      </h2>
      <em>Игра скоро начнется...</em>
      {tableState?.role === "leader" && (
        <>
          <h3>Вы лидер стола</h3>
          <ul>
            <li>Расскажите об этом вашем соседям</li>
            <li>Придумайте вместе названия</li>
            <li>Помните, ваше решение - решение всегго стола</li>
          </ul>
        </>
      )}
      {tableState?.role === "observer" && (
        <>
          <h3>Вы наблюдатель</h3>
          <ul>
            <li>Найдите лидера за своим столом</li>
            <li>Отвечайте вместе на вопросы</li>
            <li>Если у лидера случаться неполадки, вам автоматически передасться управление</li>
          </ul>
        </>
      )}

      {tableState.role === "leader" && (
        <div>
          <p>Пусть название стола подскажет остальным, кто вы:</p>
          <input
            type="text"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            placeholder="Название стола"
          />
          <button onClick={handleSetTableName}>
            {tableState.table_name ? "Изменить имя" : "Подтвердить имя"}
          </button>
        </div>
      )}
      <em>{tableState.clients} игроков за столом</em>
    </div>
  );
};
