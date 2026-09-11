import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/shell/AppShell'
import Analytics from './pages/Analytics'
import BlockPlanning from './pages/BlockPlanning'
import Dashboard from './pages/Dashboard'
import Execution from './pages/Execution'
import Landing from './pages/Landing'
import Login from './pages/Login'
import MaintenanceIntelligence from './pages/MaintenanceIntelligence'
import AssetIntelligence from './pages/AssetIntelligence'
import PredictionOverview from './pages/PredictionOverview'
import MaintenanceTasks from './pages/MaintenanceTasks'
import OperationalMap from './pages/OperationalMap'
import PlanValidation from './pages/PlanValidation'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />

      {/* Main Operational Application Shell */}
      <Route path="/app" element={<AppShell />}>
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="tasks" element={<MaintenanceTasks />} />
        <Route path="tasks/:taskId" element={<MaintenanceIntelligence />} />
        <Route path="predictions" element={<PredictionOverview />} />
        <Route path="asset-intelligence/:assetId" element={<AssetIntelligence />} />
        <Route path="planning" element={<BlockPlanning />} />
        <Route path="map" element={<OperationalMap />} />
        <Route path="execution" element={<Execution />} />
        <Route path="analytics" element={<Analytics />} />
      </Route>

      {/* Deterministic validation step */}
      <Route element={<AppShell />}>
        <Route path="/plan-validation" element={<PlanValidation />} />
      </Route>

      {/* Direct link aliases */}
      <Route path="/maintenance-intelligence/:taskId" element={<Navigate to="/app/tasks/:taskId" replace />} />
      <Route path="/maintenance-intelligence" element={<Navigate to="/app/tasks" replace />} />
      <Route path="/asset-intelligence/:assetId" element={<Navigate to="/app/asset-intelligence/:assetId" replace />} />
      <Route path="/asset-intelligence" element={<Navigate to="/app/map" replace />} />
      <Route path="/predictions" element={<Navigate to="/app/predictions" replace />} />

      {/* Fallback to dashboard */}
      <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
    </Routes>
  )
}

