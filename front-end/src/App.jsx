import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./routes/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

const Soon = ({ title }) => <h1 className="page-title">{title} (coming soon)</h1>;

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/apply" element={<ProtectedRoute roles={["employee", "manager"]}><Soon title="Apply Leave" /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute roles={["employee", "manager"]}><Soon title="My History" /></ProtectedRoute>} />
        <Route path="/approvals" element={<ProtectedRoute roles={["manager"]}><Soon title="Team Requests" /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute roles={["admin"]}><Soon title="Users" /></ProtectedRoute>} />
        <Route path="/departments" element={<ProtectedRoute roles={["admin"]}><Soon title="Departments" /></ProtectedRoute>} />
        <Route path="/leave-types" element={<ProtectedRoute roles={["admin"]}><Soon title="Leave Types" /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute roles={["admin"]}><Soon title="Reports" /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}