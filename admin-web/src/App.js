import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AdminLogin from "./pages/AdminLogin";
import CustomerSuccessDashboard from "./pages/CustomerSuccessDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import SupportMaintenanceDashboard from "./pages/SupportMaintenanceDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/login" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/super-admin" element={<SuperAdminDashboard />} />
        <Route
          path="/admin/customer-success"
          element={<CustomerSuccessDashboard />}
        />
        <Route
          path="/admin/support"
          element={<SupportMaintenanceDashboard />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
