import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getTicketsForRole } from "../services/api";
import "../styles/MyTicketsPage.css";

function MyTicketsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const showSuccess = Boolean(location.state?.created);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [tickets, setTickets] = React.useState([]);
  const [openTicketId, setOpenTicketId] = React.useState("");

  const roleLabel = React.useMemo(() => {
    const roles = user?.roles || [];
    if (roles.includes("ROLE_ADMIN")) {
      return "All Tickets";
    }
    if (roles.includes("ROLE_TECHNICIAN")) {
      return "Assigned Tickets";
    }
    return "My Tickets";
  }, [user]);

  React.useEffect(() => {
    let active = true;

    const loadTickets = async () => {
      try {
        setLoading(true);
        const data = await getTicketsForRole();
        if (active) {
          setTickets(Array.isArray(data) ? data : []);
          setError("");
        }
      } catch (requestError) {
        if (active) {
          setError(requestError?.response?.data?.message || "Failed to load tickets.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadTickets();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="surface-card my-tickets-page">
      <div className="my-tickets-head">
        <div>
          <h2>{roleLabel}</h2>
          <p>View tickets with status, priority, resource, and created date.</p>
        </div>
        <button type="button" onClick={() => navigate("/tickets")}>Create Ticket</button>
      </div>

      {showSuccess ? <p className="my-ticket-success">Ticket created successfully.</p> : null}
      {error ? <p className="my-ticket-error">{error}</p> : null}

      {loading ? (
        <div className="my-ticket-loading">Loading tickets...</div>
      ) : tickets.length === 0 ? (
        <div className="my-ticket-empty">No tickets found yet.</div>
      ) : (
        <div className="my-ticket-list">
          {tickets.map((ticket) => (
            <article className="my-ticket-card" key={ticket.id}>
              <div className="my-ticket-row">
                <h3>{ticket.resourceOrLocation}</h3>
                <div className="my-ticket-actions-inline">
                  <span className={`status-chip status-${ticket.status}`}>{ticket.status}</span>
                  <button
                    type="button"
                    className="open-ticket-btn"
                    onClick={() => setOpenTicketId((current) => (current === ticket.id ? "" : ticket.id))}
                  >
                    {openTicketId === ticket.id ? "Close" : "Open"}
                  </button>
                </div>
              </div>
              <div className="my-ticket-meta">
                <span>{ticket.category}</span>
                <span className={`priority-pill priority-${ticket.priority}`}>{ticket.priority}</span>
                <span>{new Date(ticket.createdAt).toLocaleString()}</span>
                <span>{ticket.resourceOrLocation}</span>
              </div>
              {openTicketId === ticket.id ? (
                <div className="my-ticket-detail">
                  <p><strong>Description:</strong> {ticket.description || "No description provided."}</p>
                  <p><strong>Contact:</strong> {ticket.contactName || "N/A"} | {ticket.contactEmail || "N/A"} | {ticket.contactPhone || "N/A"}</p>
                  <p><strong>Created By:</strong> {ticket.createdByEmail || "N/A"}</p>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default MyTicketsPage;
