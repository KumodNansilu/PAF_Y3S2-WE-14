import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getMyTickets } from "../services/api";
import "../styles/MyTicketsPage.css";

function MyTicketsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const showSuccess = Boolean(location.state?.created);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [tickets, setTickets] = React.useState([]);

  React.useEffect(() => {
    let active = true;

    const loadTickets = async () => {
      try {
        setLoading(true);
        const data = await getMyTickets();
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
          <h2>My Tickets</h2>
          <p>Track tickets you have reported.</p>
        </div>
        <button type="button" onClick={() => navigate("/tickets")}>Create New Ticket</button>
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
                <span className={`status-chip status-${ticket.status}`}>{ticket.status}</span>
              </div>
              <p>{ticket.description}</p>
              <div className="my-ticket-meta">
                <span>{ticket.category}</span>
                <span className={`priority-pill priority-${ticket.priority}`}>{ticket.priority}</span>
                <span>{new Date(ticket.createdAt).toLocaleString()}</span>
                <span>{ticket.imageCount} image(s)</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default MyTicketsPage;
