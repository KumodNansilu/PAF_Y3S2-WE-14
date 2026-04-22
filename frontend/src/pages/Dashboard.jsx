import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function resolveRole(roles) {
  if ((roles || []).includes("ROLE_ADMIN")) {
    return "ADMIN";
  }
  if ((roles || []).includes("ROLE_TECHNICIAN")) {
    return "TECHNICIAN";
  }
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

  const recentTickets = role === "TECHNICIAN"
    ? [
        { title: "Projector calibration", status: "IN_PROGRESS", date: "Today, 09:50 AM" },
        { title: "Wi-Fi outage at Block C", status: "ACTIVE", date: "Today, 08:10 AM" }
      ]
    : [
        { title: "Air conditioner maintenance", status: "IN_PROGRESS", date: "Today, 11:15 AM" },
        { title: "Printer ink replacement", status: "ACTIVE", date: "Today, 07:40 AM" }
      ];

  const resourceHighlights = [
    { name: "Innovation Hub", type: "Lab", capacity: 40, status: "ACTIVE" },
    { name: "Studio Room 3", type: "Media", capacity: 12, status: "PENDING" },
    { name: "Main Auditorium", type: "Hall", capacity: 240, status: "OUT_OF_SERVICE" }
  ];

  React.useEffect(() => {
    const loadingTimer = window.setTimeout(() => setLoading(false), 900);
    const clockTimer = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      window.clearTimeout(loadingTimer);
      window.clearInterval(clockTimer);
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

  const statusClass = (status) => {
    if (status === "APPROVED" || status === "ACTIVE") {
      return "status-approved";
    }
    if (status === "PENDING") {
      return "status-pending";
    }
    if (status === "REJECTED" || status === "OUT_OF_SERVICE") {
      return "status-rejected";
    }
    return "status-progress";
  };

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
          ? Array.from({ length: 4 }).map((_, index) => <div key={index} className="skeleton-card" />)
          : stats.map((card) => (
              <article className="metric-card" key={card.title}>
                <span className="metric-icon" aria-hidden="true">{card.icon}</span>
                <h3>{card.title}</h3>
                <p className="metric-value">{card.value}</p>
                <p className="metric-desc">{card.description}</p>
              </article>
            ))}
      </section>

      <section className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="quick-action-grid">
          {quickActions.map((action) => (
            <button key={action.label} type="button" onClick={() => navigate(action.path)}>
              {action.label}
            </button>
          ))}
        </div>
      </section>

      <section className="activity-grid">
        <article className="surface-card">
          <div className="section-head">
            <h2>Recent Bookings</h2>
          </div>
          {recentBookings.length === 0 ? (
            <div className="empty-state">
              <p>No bookings yet</p>
              <button type="button" onClick={() => navigate("/bookings")}>Create Booking</button>
            </div>
          ) : (
            <ul className="activity-list">
              {recentBookings.map((item) => (
                <li key={`${item.title}-${item.date}`}>
                  <div>
                    <p>{item.title}</p>
                    <small>{item.date}</small>
                  </div>
                  <span className={`status-chip ${statusClass(item.status)}`}>{item.status}</span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="surface-card">
          <div className="section-head">
            <h2>Recent Tickets</h2>
          </div>
          {recentTickets.length === 0 ? (
            <div className="empty-state">
              <p>No tickets found</p>
              <button type="button" onClick={() => navigate("/tickets")}>Create Ticket</button>
            </div>
          ) : (
            <ul className="activity-list">
              {recentTickets.map((item) => (
                <li key={`${item.title}-${item.date}`}>
                  <div>
                    <p>{item.title}</p>
                    <small>{item.date}</small>
                  </div>
                  <span className={`status-chip ${statusClass(item.status)}`}>{item.status}</span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="surface-card resource-panel">
        <div className="section-head">
          <h2>Resource Highlights</h2>
          <button type="button" onClick={() => navigate("/resources")}>View All</button>
        </div>
        <div className="resource-grid">
          {resourceHighlights.map((resource) => (
            <article key={resource.name} className="resource-card">
              <h3>{resource.name}</h3>
              <p>{resource.type}</p>
              <p>Capacity: {resource.capacity}</p>
              <span className={`status-chip ${statusClass(resource.status)}`}>{resource.status}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="surface-card">
        <h2>Data Feed</h2>
        <div className="spinner-wrap">
          <span className="spinner" aria-hidden="true" />
          <p>Listening for live booking and ticket updates...</p>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;