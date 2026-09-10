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

      {/* Dedicated ML/AI Frontend Layer Routes */}
      <Route path="/maintenance-intelligence" element={<MaintenanceIntelligence />} />
      <Route path="/maintenance-intelligence/:taskId" element={<MaintenanceIntelligence />} />
      <Route path="/asset-intelligence" element={<AssetIntelligence />} />
      <Route path="/asset-intelligence/:assetId" element={<AssetIntelligence />} />
      <Route path="/predictions" element={<PredictionOverview />} />
      <Route path="/predictions/:predictionId" element={<PredictionOverview />} />

      <Route path="/app" element={<AppShell />}>
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="tasks" element={<MaintenanceTasks />} />
        <Route path="tasks/:taskId" element={<MaintenanceIntelligence />} />
        <Route path="planning" element={<BlockPlanning />} />
        <Route path="map" element={<OperationalMap />} />
        <Route path="execution" element={<Execution />} />
        <Route path="analytics" element={<Analytics />} />
      </Route>

      {/* Deterministic validation step — inside the shell, at its own path */}
      <Route element={<AppShell />}>
        <Route path="/plan-validation" element={<PlanValidation />} />
      </Route>

      <Route path="*" element={<Navigate to="/maintenance-intelligence" replace />} />
    </Routes>
  )
}

