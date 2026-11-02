import { useAuth } from "../context/AuthContext";
import EmployeeDashboard from "./dashboards/EmployeeDashboard";
import ManagerDashboard from "./dashboards/ManagerDashboard";
import AdminDashboard from "./dashboards/AdminDashboard";

export default function Dashboard() {
  const { user } = useAuth();
  if (user.role === "admin") return <AdminDashboard />;
  if (user.role === "manager") return <ManagerDashboard />;
  return <EmployeeDashboard />;
}