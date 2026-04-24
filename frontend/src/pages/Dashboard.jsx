import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function resolveRole(roles) {
  const rolesList = roles || [];
  if (rolesList.includes("ROLE_ADMIN")) return "ADMIN";
  if (rolesList.includes("ROLE_MANAGER")) return "MANAGER";
  if (rolesList.includes("ROLE_TECHNICIAN")) return "TECHNICIAN";
  return "USER";
}

function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const role = resolveRole(user?.roles || []);

  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="spinner-wrap" style={{ padding: "4rem", justifyContent: "center" }}>
        <span className="spinner" />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  switch (role) {
    case "ADMIN":
      return <AdminDashboard user={user} />;
    case "MANAGER":
      return <ManagerDashboard user={user} />;
    case "TECHNICIAN":
      return <TechnicianDashboard user={user} />;
    default:
      return <UserDashboard user={user} />;
  }
}

function ManagerDashboard({ user }) {
  const navigate = useNavigate();
  return (
    <div className="dashboard-wrap manager-theme">
      <header className="welcome-banner">
        <div>
          <p className="eyebrow">Operations Management</p>
          <h1>Operations Manager Hub</h1>
          <p>Welcome, {user?.name}. Overseeing 14 active campus tickets.</p>
        </div>
        <span className="role-badge" style={{ background: '#f3e5f5', color: '#7b1fa2' }}>MANAGER</span>
      </header>

      <section className="stats-grid">
        <StatCard icon="📊" title="Daily Tickets" value="14" desc="Needs assignment" />
        <StatCard icon="⌛" title="SLA Breaches" value="2" desc="Urgent attention" />
        <StatCard icon="📈" title="Resolution" value="92%" desc="Avg success rate" />
        <StatCard icon="🏷️" title="Resources" value="48" desc="Status monitored" />
      </section>

      <div className="activity-grid">
        <section className="surface-card">
          <h2>Manager Oversight</h2>
          <div className="quick-action-grid">
            <button onClick={() => navigate("/tickets/list")}>Review All Tickets</button>
            <button onClick={() => navigate("/analytics")}>Performance Data</button>
            <button onClick={() => navigate("/resources")}>Asset Audit</button>
          </div>
        </section>

        <section className="surface-card">
          <h2>Staff Overview</h2>
          <ul className="activity-list">
            <li>
              <div>
                <p>3 Technicians Online</p>
                <small>Average workload: 4 tickets</small>
              </div>
              <span className="status-chip status-approved">ACTIVE</span>
            </li>
            <li>
              <div>
                <p>Maintenance Scheduled</p>
                <small>Main Library • Saturday</small>
              </div>
              <span className="status-chip status-progress">PLANNED</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function AdminDashboard({ user }) {
  const navigate = useNavigate();
  return (
    <div className="dashboard-wrap admin-theme">
      <header className="welcome-banner">
        <div>
          <p className="eyebrow">System Administration</p>
          <h1>Administrator Hub</h1>
          <p>Welcome back, {user?.name}. You have full system control.</p>
        </div>
        <span className="role-badge">ADMIN</span>
      </header>

      <section className="stats-grid">
        <StatCard icon="👥" title="Total Users" value="1,240" desc="+12 this week" />
        <StatCard icon="📦" title="Active Resources" value="48" desc="Across 4 blocks" />
        <StatCard icon="🎫" title="System Tickets" value="14" desc="Needs attention" />
        <StatCard icon="📈" title="Uptime" value="99.9%" desc="Last 30 days" />
      </section>

      <div className="activity-grid">
        <section className="surface-card">
          <h2>Administrative Controls</h2>
          <div className="quick-action-grid">
            <button onClick={() => navigate("/admin")}>User Management</button>
            <button onClick={() => navigate("/resources")}>Asset Catalog</button>
            <button onClick={() => navigate("/analytics")}>Operations Report</button>
          </div>
        </section>

        <section className="surface-card">
          <h2>Critical Alerts</h2>
          <ul className="activity-list">
            <li>
              <div>
                <p>Server Load High</p>
                <small>Cluster B-04</small>
              </div>
              <span className="status-chip status-rejected">WARNING</span>
            </li>
            <li>
              <div>
                <p>New Resource Request</p>
                <small>Multimedia Dept</small>
              </div>
              <span className="status-chip status-pending">PENDING</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function TechnicianDashboard({ user }) {
  const navigate = useNavigate();
  return (
    <div className="dashboard-wrap technician-theme">
      <header className="welcome-banner">
        <div>
          <p className="eyebrow">Technical Operations</p>
          <h1>Field Services Dashboard</h1>
          <p>Hello {user?.name}. You have 5 tasks pending for today.</p>
        </div>
        <span className="role-badge">TECHNICIAN</span>
      </header>

      <section className="stats-grid">
        <StatCard icon="🎯" title="My Tasks" value="5" desc="Assigned to you" />
        <StatCard icon="⏱" title="Avg Fix Time" value="42m" desc="This month" />
        <StatCard icon="✅" title="Completed" value="28" desc="Last 7 days" />
        <StatCard icon="🌟" title="Rating" value="4.9/5" desc="User feedback" />
      </section>

      <div className="activity-grid">
        <section className="surface-card">
          <h2>Assigned Tickets</h2>
          <ul className="activity-list">
            <li>
              <div>
                <p>Projector Failure</p>
                <small>Room 402 • High Priority</small>
              </div>
              <span className="status-chip status-progress">IN PROGRESS</span>
            </li>
            <li>
              <div>
                <p>Wi-Fi Node Down</p>
                <small>Main Library • Urgent</small>
              </div>
              <span className="status-chip status-rejected">CRITICAL</span>
            </li>
          </ul>
          <button style={{ marginTop: "1rem" }} className="refresh-btn" onClick={() => navigate("/tickets/list")}>View All Tasks</button>
        </section>

        <section className="surface-card">
          <h2>Quick Tools</h2>
          <div className="quick-action-grid">
            <button onClick={() => navigate("/resources")}>Check Inventory</button>
            <button onClick={() => navigate("/tickets/list")}>Knowledge Base</button>
          </div>
        </section>
      </div>
    </div>
  );
}

function UserDashboard({ user }) {
  const navigate = useNavigate();
  return (
    <div className="dashboard-wrap">
      <header className="welcome-banner">
        <div>
          <p className="eyebrow">Campus Services</p>
          <h1>Student & Faculty Hub</h1>
          <p>Welcome, {user?.name}. What would you like to do today?</p>
        </div>
        <span className="role-badge">USER</span>
      </header>

      <section className="stats-grid">
        <StatCard icon="📅" title="My Bookings" value="2" desc="Next: Tomorrow 10AM" />
        <StatCard icon="🎫" title="My Tickets" value="1" desc="In Progress" />
        <StatCard icon="📦" title="Resources" value="24" desc="Available to book" />
        <StatCard icon="🔔" title="Notifs" value="3" desc="New updates" />
      </section>

      <div className="activity-grid">
        <section className="surface-card">
          <h2>Quick Actions</h2>
          <div className="quick-action-grid">
            <button onClick={() => navigate("/resources")}>Book a Room</button>
            <button onClick={() => navigate("/tickets")}>Report an Issue</button>
            <button onClick={() => navigate("/bookings")}>Manage Bookings</button>
          </div>
        </section>

        <section className="surface-card">
          <h2>Recent Activity</h2>
          <ul className="activity-list">
            <li>
              <div>
                <p>Lab Booking</p>
                <small>Multimedia Lab • Approved</small>
              </div>
              <span className="status-chip status-approved">ACTIVE</span>
            </li>
            <li>
              <div>
                <p>AC Maintenance</p>
                <small>Ticket #T-291 • Started</small>
              </div>
              <span className="status-chip status-progress">PROCESSING</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, desc }) {
  return (
    <article className="metric-card">
      <span className="metric-icon">{icon}</span>
      <h3>{title}</h3>
      <p className="metric-value">{value}</p>
      <p className="metric-desc">{desc}</p>
    </article>
  );
}

export default Dashboard;