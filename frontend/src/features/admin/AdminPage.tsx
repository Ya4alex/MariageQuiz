import { useState } from "react";
import { useAdmin } from "./useAdminState";

const AdminPage = () => {
  const {
    sendAdminChangeLeader,
    sendAdminStartGame,
    sendAdminShowAnswers,
    sendAdminNextQuestion,
    sendAdminShowResults,
    sendAdminResetGame,
  } = useAdmin();
  const [tableId, setTableId] = useState(1);
  return (
    <div>
      <h1>Admin Page</h1>
      <p>This is the admin page.</p>
      <div>
        <label htmlFor="tableId">Table ID:</label>
        <input
          onChange={(e) => setTableId(parseInt(e.target.value))}
          value={tableId}
          type="number"
          id="tableId"
          placeholder="Enter table ID"
        />
        <button onClick={() => sendAdminChangeLeader(tableId)}>Change Leader</button>
      </div>
      <button onClick={sendAdminStartGame}>Start Game</button>
      <button onClick={sendAdminShowAnswers}>Show Answers</button>
      <button onClick={sendAdminNextQuestion}>Next Question</button>
      <button onClick={sendAdminShowResults}>Show Results</button>  
      <button onClick={sendAdminResetGame}>Reset Game</button>
      <p>Click the buttons to send commands to the server.</p>
    </div>
  );
};

export default AdminPage;
