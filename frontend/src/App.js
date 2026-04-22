import React from "react";
import { Navigate, NavLink, Outlet, Route, Routes, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegistrationPage from "./pages/RegistrationPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import Dashboard from "./pages/Dashboard";
import TicketCreatePage from "./pages/TicketCreatePage";
import MyTicketsPage from "./pages/MyTicketsPage";
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
  return (
    <div>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
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
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <SimplePage title="Admin Workspace" />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

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
  if (roles.includes("ROLE_ADMIN")) {
    return "ADMIN";
  }
  if (roles.includes("ROLE_TECHNICIAN")) {
    return "TECHNICIAN";
  }
  return "USER";
}

function initialsFromName(name) {
  if (!name) {
    return "SC";
  }
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

  const onSearchSubmit = (event) => {
    event.preventDefault();
    if (!query.trim()) {
      return;
    }
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const onSuggestionClick = (value) => {
    setQuery(value);
    navigate(`/search?q=${encodeURIComponent(value)}`);
  };

  const onLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const markAllAsRead = () => {
    setNotifications((current) => current.map((item) => ({ ...item, unread: false })));
  };

  const role = roleLabel(user);
  const sidebarClassName = sidebarOpen ? "app-sidebar is-open" : "app-sidebar";

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-left">
          <button
            type="button"
            className="icon-btn mobile-only"
            onClick={() => setSidebarOpen((current) => !current)}
            aria-label="Toggle menu"
          >
            <span aria-hidden="true">☰</span>
          </button>

          <button type="button" className="brand-block" onClick={() => navigate("/")}> 
            <span className="brand-mark" aria-hidden="true">SC</span>
            <span className="brand-copy">
              <strong>Smart Campus Operations Hub</strong>
              <small>Realtime operations dashboard</small>
            </span>
          </button>
        </div>

        <form className="search-wrap" onSubmit={onSearchSubmit}>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search resources, bookings, tickets"
            aria-label="Global search"
          />
          <button type="submit">Search</button>
          {suggestions.length > 0 ? (
            <ul className="search-suggestions">
              {suggestions.map((item) => (
                <li key={item}>
                  <button type="button" onClick={() => onSuggestionClick(item)}>
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </form>

        <div className="header-right">
          <div className="dropdown-wrap">
            <button
              type="button"
              className="icon-btn"
              onClick={() => {
                setNotificationOpen((current) => !current);
                setProfileOpen(false);
              }}
              aria-label="Notifications"
            >
              <span aria-hidden="true">🔔</span>
              {unreadCount > 0 ? <span className="counter-pill">{unreadCount}</span> : null}
            </button>

            {notificationOpen ? (
              <div className="dropdown-panel notification-panel">
                <div className="panel-head">
                  <h4>Notifications</h4>
                  <button type="button" onClick={markAllAsRead}>Mark all read</button>
                </div>
                <ul>
                  {notifications.map((item) => (
                    <li key={item.id} className={item.unread ? "unread" : ""}>
                      <p>{item.text}</p>
                      <small>{item.time}</small>
                      <span className={`status-dot status-${item.type}`}>{item.type}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="dropdown-wrap">
            <button
              type="button"
              className="profile-btn"
              onClick={() => {
                setProfileOpen((current) => !current);
                setNotificationOpen(false);
              }}
              aria-label="Profile menu"
            >
              <span className="avatar-chip" aria-hidden="true">{initialsFromName(user?.name)}</span>
              <span className="profile-text">
                <strong>{user?.name || "Campus User"}</strong>
                <small>{role}</small>
              </span>
            </button>

            {profileOpen ? (
              <div className="dropdown-panel profile-panel">
                <button type="button" onClick={() => navigate("/profile")}>View Profile</button>
                <button type="button" onClick={onLogout}>Logout</button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="content-grid">
        <aside className={sidebarClassName}>
          <nav>
            <NavLink to="/" end>
              Dashboard
            </NavLink>
            <NavLink to="/resources">Resource Management</NavLink>
            <NavLink to="/bookings">Booking Management</NavLink>
            <NavLink to="/tickets/list">Ticket Management</NavLink>
          </nav>
        </aside>

        <main className="main-panel">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SimplePage({ title }) {
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 650);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <section className="surface-card">
      <h2>{title}</h2>
      {loading ? (
        <div className="spinner-wrap">
          <span className="spinner" aria-hidden="true" />
          <p>Loading module...</p>
        </div>
      ) : (
        <p>This module is ready for integration with live backend data.</p>
      )}
    </section>
  );
}

function ProfilePage() {
  const { user } = useAuth();
  return (
    <section className="surface-card">
      <h2>My Profile</h2>
      <p>Name: {user?.name || "N/A"}</p>
      <p>Email: {user?.email || "N/A"}</p>
      <p>Roles: {(user?.roles || []).join(", ") || "ROLE_USER"}</p>
    </section>
  );
}

function SearchResultsPage() {
  const [params] = useSearchParams();
  const query = params.get("q") || "";
  const normalizedQuery = query.trim().toLowerCase();
  const results = normalizedQuery
    ? GLOBAL_SEARCH_ITEMS.filter((item) => item.toLowerCase().includes(normalizedQuery))
    : [];

  return (
    <section className="surface-card">
      <h2>Search Results</h2>
      <p>
        Showing results for <strong>{query || "(empty query)"}</strong>
      </p>
      {results.length === 0 ? (
        <div className="empty-state">
          <p>No matching resources, bookings, or tickets found.</p>
        </div>
      ) : (
        <ul className="results-list">
          {results.map((result) => (
            <li key={result}>{result}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default App;
