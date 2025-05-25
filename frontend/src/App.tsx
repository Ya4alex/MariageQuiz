import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import TablePage from "./features/table/TablePage";
import AdminPage from "./features/admin/AdminPage";
import ScreenPage from "./features/screen/ScreenPage";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Navigate to="/screen" />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/table/:id" element={<TablePage />} />
        <Route path="/screen" element={<ScreenPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
