import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import AppShell from "@/components/layout/AppShell";
import Landing from "@/pages/Landing";
import { Login, Register } from "@/pages/Auth";
import Dashboard from "@/pages/app/Dashboard";
import Transactions from "@/pages/app/Transactions";
import AddImport from "@/pages/app/AddImport";
import Budgets from "@/pages/app/Budgets";
import Insights from "@/pages/app/Insights";
import Goals from "@/pages/app/Goals";
import Subscriptions from "@/pages/app/Subscriptions";
import Alerts from "@/pages/app/Alerts";
import Settings from "@/pages/app/Settings";

function RequireAuth({ children }) {
  const { user } = useAuth();
  const loc = useLocation();
  return user ? children : <Navigate to="/login" replace state={{ from: loc.pathname }} />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/app" element={<RequireAuth><AppShell /></RequireAuth>}>
        <Route index element={<Dashboard />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="add" element={<AddImport />} />
        <Route path="budgets" element={<Budgets />} />
        <Route path="insights" element={<Insights />} />
        <Route path="goals" element={<Goals />} />
        <Route path="subscriptions" element={<Subscriptions />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
