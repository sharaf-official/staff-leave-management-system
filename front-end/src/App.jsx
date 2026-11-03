import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./routes/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ApplyLeave from "./pages/ApplyLeave";
import History from "./pages/History";
import Approvals from "./pages/Approvals";
import Users from "./pages/Users";
import Departments from "./pages/Departments";
import LeaveTypes from "./pages/LeaveTypes";
import Reports from "./pages/Reports";


export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/apply" element={<ProtectedRoute roles={["employee", "manager"]}><ApplyLeave /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute roles={["employee", "manager"]}><History /></ProtectedRoute>} />
        <Route path="/approvals" element={<ProtectedRoute roles={["manager"]}><Approvals /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute roles={["admin"]}><Users /></ProtectedRoute>} />
        <Route path="/departments" element={<ProtectedRoute roles={["admin"]}><Departments /></ProtectedRoute>} />
        <Route path="/leave-types" element={<ProtectedRoute roles={["admin"]}><LeaveTypes /></ProtectedRoute>} />
<Route path="/reports" element={<ProtectedRoute roles={["admin"]}><Reports /></ProtectedRoute>} />      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}