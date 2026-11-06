import { Routes, Route, Navigate } from "react-router-dom";

import Layout from "./components/Layout";
import ProtectedRoute from "./routes/ProtectedRoute";

import Login from "./pages/Login";
import FirstLogin from "./pages/FirstLogin";
import RegisterCompany from "./pages/RegisterCompany";
import Dashboard from "./pages/Dashboard";
import ApplyLeave from "./pages/ApplyLeave";
import History from "./pages/History";
import Approvals from "./pages/Approvals";
import Users from "./pages/Users";
import Departments from "./pages/Departments";
import LeaveTypes from "./pages/LeaveTypes";
import Reports from "./pages/Reports";
import Outbox from "./pages/Outbox";
import Profile from "./pages/Profile";

const STAFF = ["employee", "manager"];
const MANAGER = ["manager"];
const ADMIN = ["admin"];

export default function App() {
  return (
    <Routes>
      {/* public pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/first-login" element={<FirstLogin />} />
      <Route path="/register-company" element={<RegisterCompany />} />

      {/* signed-in pages (inside the app layout) */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/outbox" element={<Outbox />} />

        <Route path="/apply" element={<ProtectedRoute roles={STAFF}><ApplyLeave /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute roles={STAFF}><History /></ProtectedRoute>} />
        <Route path="/approvals" element={<ProtectedRoute roles={MANAGER}><Approvals /></ProtectedRoute>} />

        <Route path="/users" element={<ProtectedRoute roles={ADMIN}><Users /></ProtectedRoute>} />
        <Route path="/departments" element={<ProtectedRoute roles={ADMIN}><Departments /></ProtectedRoute>} />
        <Route path="/leave-types" element={<ProtectedRoute roles={ADMIN}><LeaveTypes /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute roles={ADMIN}><Reports /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}