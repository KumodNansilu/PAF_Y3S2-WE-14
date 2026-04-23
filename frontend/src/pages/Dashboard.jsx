import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function resolveRole(roles) {
  if ((roles || []).includes("ROLE_ADMIN")) return "ADMIN";
  if ((roles || []).includes("ROLE_TECHNICIAN")) return "TECHNICIAN";
  return "USER";
}

function roleStats(role) {
  if (role === "ADMIN") {
    return [
      { icon: "📦", title: "Resources", value: 42, description: "Total managed assets" },
      { icon: "📅", title: "Bookings", value: 119, description: "Active and upcoming" },
      { icon: "🎫", title: "Tickets", value: 23, description: "Open support requests" },
      { icon: "✅", title: "Approved Today", value: 16, description: "Approved operations" }
    ];
  }

  if (role === "TECHNICIAN") {
    return [
      { icon: "🎯", title: "Assigned Tickets", value: 8, description: "Currently owned" },
      { icon: "🔵", title: "In Progress", value: 5, description: "Needs active work" },
      { icon: "🟢", title: "Resolved Today", value: 3, description: "Completed fixes" },
      { icon: "⏱", title: "Avg Response", value: "34m", description: "First response time" }
    ];
  }

  return [
    { icon: "📦", title: "Resources", value: 16, description: "Available to book" },
    { icon: "📅", title: "Bookings", value: 4, description: "Your upcoming bookings" },
    { icon: "🎫", title: "My Tickets", value: 2, description: "Open tickets" },
    { icon: "🟢", title: "Approved", value: 3, description: "Approved requests" }
  ];
}

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [currentTime, setCurrentTime] = React.useState(new Date());

  const role = resolveRole(user?.roles || []);
  const stats = roleStats(role);

  const quickActions = role === "ADMIN"
    ? [
        { label: "Manage Resources", path: "/resources" },
        { label: "View Bookings", path: "/bookings" },
        { label: "Create Ticket", path: "/tickets" }
      ]
    : [
        { label: "Book Resource", path: "/resources" },
        { label: "Create Ticket", path: "/tickets" },
        { label: "View Bookings", path: "/bookings" }
      ];

  const recentBookings = [
    { title: "Multimedia Lab", status: "APPROVED", date: "Today, 10:30 AM" },
    { title: "Conference Hall A", status: "PENDING", date: "Tomorrow, 02:00 PM" },
    { title: "Football Ground", status: "REJECTED", date: "Apr 24, 09:00 AM" }
  ];

  const recentTickets = [
    { title: "Air conditioner maintenance", status: "IN_PROGRESS", date: "Today, 11:15 AM" },
    { title: "Printer ink replacement", status: "ACTIVE", date: "Today, 07:40 AM" }
  ];

  React.useEffect(() => {
    const loadingTimer = setTimeout(() => setLoading(false), 900);
    const clockTimer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      clearTimeout(loadingTimer);
      clearInterval(clockTimer);
    };
  }, []);

  const formatDateTime = (value) =>
    value.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

  return (
    <div className="dashboard-wrap">
      <section className="welcome-banner">
        <div>
          <p className="eyebrow">Campus Operations Dashboard</p>
          <h1>Welcome back, {user?.name || "User"}</h1>
          <p className="time-caption">{formatDateTime(currentTime)}</p>
        </div>
        <span className="role-badge">{role}</span>
      </section>

      <section className="stats-grid">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton-card" />)
          : stats.map((card) => (
              <article className="metric-card" key={card.title}>
                <span>{card.icon}</span>
                <h3>{card.title}</h3>
                <p>{card.value}</p>
                <p>{card.description}</p>
              </article>
            ))}
      </section>

      <section className="quick-actions">
        <h2>Quick Actions</h2>
        {quickActions.map((a) => (
          <button key={a.label} onClick={() => navigate(a.path)}>
            {a.label}
          </button>
        ))}
      </section>
    </div>
  );
}

export default Dashboard;