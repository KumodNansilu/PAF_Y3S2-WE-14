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
  const [searchText, setSearchText] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [priorityFilter, setPriorityFilter] = React.useState("");
  const [assignedTechnicianFilter, setAssignedTechnicianFilter] = React.useState("");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");

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

  const filteredTickets = React.useMemo(() => {
    const search = searchText.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const ticketDate = ticket.createdAt ? new Date(ticket.createdAt) : null;
      const matchesSearch = !search || [
        ticket.id,
        ticket.resourceOrLocation,
        ticket.category,
        ticket.description,
        ticket.createdByEmail,
        ticket.assignedTechnicianEmail,
        ticket.contactName,
        ticket.contactEmail,
        ticket.contactPhone,
        ticket.priority,
        ticket.status
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));

      const matchesStatus = !statusFilter || ticket.status === statusFilter;
      const matchesPriority = !priorityFilter || ticket.priority === priorityFilter;

      const assignedValue = assignedTechnicianFilter.trim().toLowerCase();
      const matchesAssignedTechnician =
        !assignedValue || String(ticket.assignedTechnicianEmail || "unassigned").toLowerCase().includes(assignedValue);

      const matchesFrom = !dateFrom || !ticketDate || ticketDate >= new Date(`${dateFrom}T00:00:00`);
      const matchesTo = !dateTo || !ticketDate || ticketDate <= new Date(`${dateTo}T23:59:59.999`);

      return matchesSearch && matchesStatus && matchesPriority && matchesAssignedTechnician && matchesFrom && matchesTo;
    });
  }, [tickets, searchText, statusFilter, priorityFilter, assignedTechnicianFilter, dateFrom, dateTo]);

  const clearFilters = () => {
    setSearchText("");
    setStatusFilter("");
    setPriorityFilter("");
    setAssignedTechnicianFilter("");
    setDateFrom("");
    setDateTo("");
  };

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

      <section className="ticket-filter-panel">
        <div className="ticket-filter-grid">
          <label>
            Search tickets
            <input
              type="text"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Ticket ID, resource, category, keywords"
            />
          </label>

          <label>
            Status
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="">All statuses</option>
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </label>

          <label>
            Priority
            <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
              <option value="">All priorities</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
            </select>
          </label>

          <label>
            Assigned technician
            <input
              type="text"
              value={assignedTechnicianFilter}
              onChange={(event) => setAssignedTechnicianFilter(event.target.value)}
              placeholder="Technician email or name"
            />
          </label>

          <label>
            Date from
            <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          </label>

          <label>
            Date to
            <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </label>
        </div>

        <div className="ticket-filter-actions">
          <button type="button" className="btn-secondary" onClick={clearFilters}>
            Clear Filters
          </button>
          <span className="ticket-filter-count">
            Showing {filteredTickets.length} of {tickets.length} tickets
          </span>
        </div>
      </section>

      {loading ? (
        <div className="my-ticket-loading">Loading tickets...</div>
      ) : tickets.length === 0 ? (
        <div className="my-ticket-empty">No tickets found yet.</div>
      ) : filteredTickets.length === 0 ? (
        <div className="my-ticket-empty">No tickets match the current search and filters.</div>
      ) : (
        <div className="my-ticket-list">
          {filteredTickets.map((ticket) => (
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
                <span className="ticket-id-chip">#{ticket.id}</span>
                <span>{ticket.category}</span>
                <span className={`priority-pill priority-${ticket.priority}`}>{ticket.priority}</span>
                <span>{new Date(ticket.createdAt).toLocaleString()}</span>
                <span>{ticket.resourceOrLocation}</span>
                <span>{ticket.assignedTechnicianEmail || "UNASSIGNED"}</span>
              </div>
              {openTicketId === ticket.id ? (
                <div className="my-ticket-detail">
                  <p><strong>Description:</strong> {ticket.description || "No description provided."}</p>
                  <p><strong>Contact:</strong> {ticket.contactName || "N/A"} | {ticket.contactEmail || "N/A"} | {ticket.contactPhone || "N/A"}</p>
                  <p><strong>Created By:</strong> {ticket.createdByEmail || "N/A"}</p>
                  <p><strong>Assigned Technician:</strong> {ticket.assignedTechnicianEmail || "Unassigned"}</p>
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
