import React from "react";
import { Link, Navigate, NavLink, Outlet, Route, Routes, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegistrationPage from "./pages/RegistrationPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import Dashboard from "./pages/Dashboard";

import TicketCreatePage from "./pages/TicketCreatePage";
import MyTicketsPage from "./pages/MyTicketsPage";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import AdminPage from "./pages/AdminPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import "./styles/AppShell.css";

function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

function AppShell() {
  const { user, loading } = useAuth();

  return (
    <div className="app-shell">
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Protected Layout */}
        <Route
          element={
            <ProtectedRoute>
              <ProtectedLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/resources" element={<SimplePage title="Resource Management" />} />
          <Route path="/bookings" element={<SimplePage title="Booking Management" />} />
          <Route path="/tickets" element={<TicketCreatePage />} />
          <Route path="/tickets/list" element={<MyTicketsPage />} />
          <Route path="/tickets/my" element={<MyTicketsPage />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/search" element={<SearchResultsPage />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <AdminPage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

/* ===================== EXTRA COMPONENTS ===================== */

const GLOBAL_SEARCH_ITEMS = [
  "Resource: Multimedia Lab",
  "Resource: Engineering Hall",
  "Resource: Study Pods",
  "Booking: Lab Session - Tomorrow",
  "Booking: Auditorium Setup",
  "Booking: Sports Ground",
  "Ticket: Projector not working",
  "Ticket: Air conditioning issue",
  "Ticket: Wi-Fi unstable"
];

function roleLabel(user) {
  const roles = user?.roles || [];
  if (roles.includes("ROLE_ADMIN")) return "ADMIN";
  if (roles.includes("ROLE_TECHNICIAN")) return "TECHNICIAN";
  return "USER";
}

function initialsFromName(name) {
  if (!name) return "SC";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function ProtectedLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [notificationOpen, setNotificationOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const [notifications, setNotifications] = React.useState([
    { id: "n1", text: "Booking #B-104 approved", type: "APPROVED", time: "2 min ago", unread: true },
    { id: "n2", text: "Ticket #T-093 moved to in progress", type: "IN_PROGRESS", time: "12 min ago", unread: true },
    { id: "n3", text: "Resource: Robotics Lab is available", type: "ACTIVE", time: "1 hr ago", unread: false }
  ]);

  const unreadCount = notifications.filter((item) => item.unread).length;
  const normalizedQuery = query.trim().toLowerCase();
  const suggestions = normalizedQuery
    ? GLOBAL_SEARCH_ITEMS.filter((item) => item.toLowerCase().includes(normalizedQuery)).slice(0, 6)
    : [];

  React.useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const onSearchSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const onLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const role = roleLabel(user);

  return (
    <div>
      <header>
        <h2>PAF Portal</h2>
        {!user ? null : (
          <nav>
            <Link to="/">Dashboard</Link>
            <Link to="/admin">Admin</Link>
            <button onClick={onLogout}>Logout</button>
          </nav>
        )}
      </header>

      <Outlet />
    </div>
  );
}

function SimplePage({ title }) {
  return (
    <div>
      <h2>{title}</h2>
      <p>Module ready.</p>
    </div>
  );
}

function ProfilePage() {
  const { user } = useAuth();
  return (
    <div>
      <h2>Profile</h2>
      <p>{user?.name}</p>
    </div>
  );
}

function SearchResultsPage() {
  const [params] = useSearchParams();
  const query = params.get("q") || "";

  return (
    <div>
      <h2>Search</h2>
      <p>{query}</p>
    </div>
  );
}

export default App;