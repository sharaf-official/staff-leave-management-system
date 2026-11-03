import { useAuth } from '../context/AuthContext'
import useLoading from '../hooks/useLoading'
import { DashboardSkeleton } from '../components/Skeleton'
import EmployeeDashboard from './dashboards/EmployeeDashboard'
import ManagerDashboard from './dashboards/ManagerDashboard'
import AdminDashboard from './dashboards/AdminDashboard'

export default function Dashboard() {
  const { user } = useAuth()
  const loading = useLoading(700)

  if (loading) return <DashboardSkeleton />

  if (user?.role === 'admin') return <AdminDashboard />
  if (user?.role === 'manager') return <ManagerDashboard />
  return <EmployeeDashboard />
}