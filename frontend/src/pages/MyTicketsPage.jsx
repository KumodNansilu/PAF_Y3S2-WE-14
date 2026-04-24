import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getTicketsForRole, updateTicketStatus, assignTechnician, resolveTicket, addComment, editComment, deleteComment, getTicketImages, deleteTicketImage, updateTicketDetails } from "../services/api";
import "../styles/MyTicketsPage.css";

function MyTicketsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const showSuccess = Boolean(location.state?.created);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [tickets, setTickets] = React.useState([]);
  
  const [searchText, setSearchText] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [priorityFilter, setPriorityFilter] = React.useState("");
  const [assignedTechnicianFilter, setAssignedTechnicianFilter] = React.useState("");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");

  const [selectedTicket, setSelectedTicket] = React.useState(null);

  const [technicianEmailInput, setTechnicianEmailInput] = React.useState("");
  const [statusInput, setStatusInput] = React.useState("");
  const [resolutionNotesInput, setResolutionNotesInput] = React.useState("");
  
  const [commentInput, setCommentInput] = React.useState("");
  const [editingCommentId, setEditingCommentId] = React.useState(null);
  const [editingCommentText, setEditingCommentText] = React.useState("");
  const [ticketImages, setTicketImages] = React.useState([]);

  const [isEditingDetails, setIsEditingDetails] = React.useState(false);
  const [editDetailsForm, setEditDetailsForm] = React.useState({
    description: "",
    priority: "",
    contactName: "",
    contactEmail: "",
    contactPhone: ""
  });

  const roles = user?.roles || [];
  const isAdmin = roles.includes("ROLE_ADMIN");
  const isManager = roles.includes("ROLE_MANAGER");
  const isTechnician = roles.includes("ROLE_TECHNICIAN");

  const canSeeAllFilters = isAdmin || isManager;

  const loadTickets = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTicketsForRole();
      setTickets(Array.isArray(data) ? data : []);
      setError("");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Failed to load tickets.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let active = true;
    loadTickets().then(() => {
      if (!active) return;
    });
    return () => { active = false; };
  }, [loadTickets]);

  const filteredTickets = React.useMemo(() => {
    const search = searchText.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const ticketDate = ticket.createdAt ? new Date(ticket.createdAt) : null;
      const matchesSearch = !search || [
        ticket.id, ticket.resourceOrLocation, ticket.category, ticket.description,
        ticket.createdByEmail, ticket.assignedTechnicianEmail, ticket.contactName
      ].filter(Boolean).some((value) => String(value).toLowerCase().includes(search));

      const matchesStatus = !statusFilter || ticket.status === statusFilter;
      const matchesPriority = !priorityFilter || ticket.priority === priorityFilter;
      const assignedValue = assignedTechnicianFilter.trim().toLowerCase();
      const matchesAssignedTechnician = !assignedValue || String(ticket.assignedTechnicianEmail || "unassigned").toLowerCase().includes(assignedValue);
      const matchesFrom = !dateFrom || !ticketDate || ticketDate >= new Date(`${dateFrom}T00:00:00`);
      const matchesTo = !dateTo || !ticketDate || ticketDate <= new Date(`${dateTo}T23:59:59.999`);

      return matchesSearch && matchesStatus && matchesPriority && matchesAssignedTechnician && matchesFrom && matchesTo;
    });
  }, [tickets, searchText, statusFilter, priorityFilter, assignedTechnicianFilter, dateFrom, dateTo]);

  // KPIs
  const totalTickets = tickets.length;
  const openTickets = tickets.filter(t => t.status === "OPEN").length;
  const inProgressTickets = tickets.filter(t => t.status === "IN_PROGRESS").length;
  const resolvedTickets = tickets.filter(t => t.status === "RESOLVED").length;
  const closedTickets = tickets.filter(t => t.status === "CLOSED").length;
  const rejectedTickets = tickets.filter(t => t.status === "REJECTED").length;
  const highPriorityTickets = tickets.filter(t => t.priority === "HIGH").length;

  const handleTicketClick = async (ticket) => {
    setSelectedTicket(ticket);
    setStatusInput(ticket.status);
    setTechnicianEmailInput(ticket.assignedTechnicianEmail || "");
    setResolutionNotesInput(ticket.resolutionNotes || "");
    setIsEditingDetails(false);
    setEditDetailsForm({
      description: ticket.description || "",
      priority: ticket.priority || "",
      contactName: ticket.contactName || "",
      contactEmail: ticket.contactEmail || "",
      contactPhone: ticket.contactPhone || ""
    });
    setTicketImages([]);
    if (ticket.imageCount > 0) {
      try {
        const images = await getTicketImages(ticket.id);
        setTicketImages(images);
      } catch (err) {
        console.error("Failed to load images", err);
      }
    }
  };

  const handleAssign = async () => {
    if (!selectedTicket || !technicianEmailInput) return;
    try {
      await assignTechnician(selectedTicket.id, technicianEmailInput);
      await loadTickets();
      setSelectedTicket({ ...selectedTicket, assignedTechnicianEmail: technicianEmailInput });
    } catch (err) {
      alert("Failed to assign technician: " + (err.response?.data?.message || err.message));
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedTicket || !newStatus) return;
    try {
      await updateTicketStatus(selectedTicket.id, newStatus);
      await loadTickets();
      setSelectedTicket({ ...selectedTicket, status: newStatus });
      setStatusInput(newStatus);
    } catch (err) {
      alert("Failed to update status: " + (err.response?.data?.message || err.message));
    }
  };

  const handleResolve = async () => {
    if (!selectedTicket || !resolutionNotesInput.trim()) return;
    try {
      await resolveTicket(selectedTicket.id, resolutionNotesInput);
      await loadTickets();
      setSelectedTicket({ ...selectedTicket, status: "RESOLVED", resolutionNotes: resolutionNotesInput });
      setStatusInput("RESOLVED");
    } catch (err) {
      alert("Failed to resolve ticket: " + (err.response?.data?.message || err.message));
    }
  };

  const handleAddComment = async () => {
    if (!commentInput.trim() || !selectedTicket) return;
    try {
      const updatedTicket = await addComment(selectedTicket.id, commentInput);
      await loadTickets();
      setSelectedTicket(updatedTicket);
      setCommentInput("");
    } catch (err) {
      alert("Failed to add comment: " + (err.response?.data?.message || err.message));
    }
  };

  const handleEditCommentSubmit = async (commentId) => {
    if (!editingCommentText.trim() || !selectedTicket) return;
    try {
      const updatedTicket = await editComment(selectedTicket.id, commentId, editingCommentText);
      await loadTickets();
      setSelectedTicket(updatedTicket);
      setEditingCommentId(null);
      setEditingCommentText("");
    } catch (err) {
      alert("Failed to edit comment: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!selectedTicket) return;
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      const updatedTicket = await deleteComment(selectedTicket.id, commentId);
      await loadTickets();
      setSelectedTicket(updatedTicket);
    } catch (err) {
      alert("Failed to delete comment: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteImage = async (fileName) => {
    if (!selectedTicket) return;
    if (!window.confirm("Are you sure you want to delete this attachment?")) return;
    try {
      await deleteTicketImage(selectedTicket.id, fileName);
      setTicketImages(prev => prev.filter(img => img.fileName !== fileName));
      await loadTickets();
      // To keep selectedTicket in sync with loaded tickets:
      setSelectedTicket(prev => ({ ...prev, imageCount: prev.imageCount - 1 }));
    } catch (err) {
      alert("Failed to delete image: " + (err.response?.data?.message || err.message));
    }
  };

  const handleUpdateDetails = async () => {
    if (!selectedTicket) return;
    try {
      const updatedTicket = await updateTicketDetails(selectedTicket.id, editDetailsForm);
      await loadTickets();
      setSelectedTicket(updatedTicket);
      setIsEditingDetails(false);
    } catch (err) {
      alert("Failed to update ticket details: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="dashboard-container">
      <div className={`dashboard-main ${selectedTicket ? "panel-open" : ""}`}>
        <div className="dashboard-header">
          <div>
            <h2>Ticket Dashboard</h2>
            <p>Overview and management of all operations.</p>
          </div>
          <button className="btn-primary" onClick={() => navigate("/tickets")}>Create Ticket</button>
        </div>

        {showSuccess && <div className="alert-success">Ticket created successfully.</div>}
        {error && <div className="alert-error">{error}</div>}

        {/* KPI SUMMARY CARDS */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <span className="kpi-icon">📋</span>
            <div className="kpi-info">
              <h3>{totalTickets}</h3>
              <p>Total Tickets</p>
            </div>
          </div>
          <div className="kpi-card kpi-open">
            <span className="kpi-icon">🔵</span>
            <div className="kpi-info">
              <h3>{openTickets}</h3>
              <p>Open</p>
            </div>
          </div>
          <div className="kpi-card kpi-progress">
            <span className="kpi-icon">🟡</span>
            <div className="kpi-info">
              <h3>{inProgressTickets}</h3>
              <p>In Progress</p>
            </div>
          </div>
          <div className="kpi-card kpi-resolved">
            <span className="kpi-icon">🟢</span>
            <div className="kpi-info">
              <h3>{resolvedTickets}</h3>
              <p>Resolved</p>
            </div>
          </div>
          <div className="kpi-card kpi-high">
            <span className="kpi-icon">🔴</span>
            <div className="kpi-info">
              <h3>{highPriorityTickets}</h3>
              <p>High Priority</p>
            </div>
          </div>
        </div>

        {/* STATUS PROGRESS BAR */}
        {totalTickets > 0 && (
          <div className="status-overview">
            <div className="status-bar">
              <div className="status-segment segment-open" style={{ width: `${(openTickets/totalTickets)*100}%` }}></div>
              <div className="status-segment segment-progress" style={{ width: `${(inProgressTickets/totalTickets)*100}%` }}></div>
              <div className="status-segment segment-resolved" style={{ width: `${(resolvedTickets/totalTickets)*100}%` }}></div>
              <div className="status-segment segment-closed" style={{ width: `${(closedTickets/totalTickets)*100}%` }}></div>
              <div className="status-segment segment-rejected" style={{ width: `${(rejectedTickets/totalTickets)*100}%` }}></div>
            </div>
            <div className="status-labels">
              <span>🔵 Open: {openTickets}</span>
              <span>🟡 In Progress: {inProgressTickets}</span>
              <span>🟢 Resolved: {resolvedTickets}</span>
              <span>⚫ Closed: {closedTickets}</span>
              <span>🔴 Rejected: {rejectedTickets}</span>
            </div>
          </div>
        )}

        {/* FILTERS */}
        <div className="filter-panel">
          <input type="text" placeholder="Search ID, resource..." value={searchText} onChange={e => setSearchText(e.target.value)} />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="OPEN">OPEN</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="CLOSED">CLOSED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
            <option value="">All Priorities</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
          </select>
          {canSeeAllFilters && (
            <input type="text" placeholder="Assignee email..." value={assignedTechnicianFilter} onChange={e => setAssignedTechnicianFilter(e.target.value)} />
          )}
          <button className="btn-secondary" onClick={() => { setSearchText(""); setStatusFilter(""); setPriorityFilter(""); setAssignedTechnicianFilter(""); setDateFrom(""); setDateTo(""); }}>Clear</button>
        </div>

        {/* TICKET LIST */}
        <div className="ticket-list-container">
          {loading ? (
            <div className="loading-state">Loading tickets...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="empty-state">No tickets found.</div>
          ) : (
            <table className="ticket-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Resource</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assignee</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map(ticket => (
                  <tr key={ticket.id} className={selectedTicket?.id === ticket.id ? "selected-row" : ""} onClick={() => handleTicketClick(ticket)}>
                    <td>#{ticket.id.substring(0, 8)}</td>
                    <td>{ticket.resourceOrLocation}</td>
                    <td>{ticket.category}</td>
                    <td><span className={`badge priority-${ticket.priority}`}>{ticket.priority}</span></td>
                    <td><span className={`badge status-${ticket.status}`}>{ticket.status}</span></td>
                    <td>{ticket.assignedTechnicianEmail || "Unassigned"}</td>
                    <td>{new Date(ticket.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="btn-small" onClick={(e) => { e.stopPropagation(); handleTicketClick(ticket); }}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* SIDE PANEL */}
      {selectedTicket && (
        <div className="side-panel">
          <div className="panel-header">
            <div>
              <h3 style={{ display: "inline-block", marginRight: "1rem" }}>Ticket #{selectedTicket.id.substring(0, 8)}</h3>
              {(isAdmin || (selectedTicket.createdByEmail === user?.email && selectedTicket.status === "OPEN")) && !isEditingDetails && (
                <button className="btn-secondary btn-small" onClick={() => setIsEditingDetails(true)}>✎ Edit</button>
              )}
            </div>
            <button className="close-btn" onClick={() => setSelectedTicket(null)}>✕</button>
          </div>
          
          <div className="panel-content">
            <div className="panel-section">
              <div className="tags">
                <span className={`badge priority-${selectedTicket.priority}`}>{selectedTicket.priority} Priority</span>
                <span className={`badge status-${selectedTicket.status}`}>{selectedTicket.status}</span>
              </div>
              <h4 className="detail-title">{selectedTicket.resourceOrLocation}</h4>
              <p className="detail-category">{selectedTicket.category}</p>
              
              {isEditingDetails ? (
                <div style={{ marginTop: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div className="control-group">
                    <label>Description</label>
                    <textarea 
                      value={editDetailsForm.description} 
                      onChange={e => setEditDetailsForm({...editDetailsForm, description: e.target.value})}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d9d9e3', minHeight: '80px' }}
                    />
                  </div>
                  <div className="control-group">
                    <label>Priority</label>
                    <select 
                      value={editDetailsForm.priority} 
                      onChange={e => setEditDetailsForm({...editDetailsForm, priority: e.target.value})}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d9d9e3' }}
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                    </select>
                  </div>
                  <div className="control-group">
                    <label>Contact Name</label>
                    <input type="text" value={editDetailsForm.contactName} onChange={e => setEditDetailsForm({...editDetailsForm, contactName: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d9d9e3' }} />
                  </div>
                  <div className="control-group">
                    <label>Contact Email</label>
                    <input type="email" value={editDetailsForm.contactEmail} onChange={e => setEditDetailsForm({...editDetailsForm, contactEmail: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d9d9e3' }} />
                  </div>
                  <div className="control-group">
                    <label>Contact Phone</label>
                    <input type="text" value={editDetailsForm.contactPhone} onChange={e => setEditDetailsForm({...editDetailsForm, contactPhone: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d9d9e3' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
                    <button className="btn-success btn-small" onClick={handleUpdateDetails}>Save Changes</button>
                    <button className="btn-secondary btn-small" onClick={() => setIsEditingDetails(false)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <p className="detail-desc">{selectedTicket.description}</p>
              )}
            </div>

            {ticketImages.length > 0 && (
              <div className="panel-section">
                <h4>Attachments ({ticketImages.length})</h4>
                <div className="attachments-grid">
                  {ticketImages.map(img => {
                    const canDelete = isAdmin || selectedTicket.createdByEmail === user?.email;
                    return (
                      <div key={img.fileName} className="attachment-item">
                        <a href={`data:${img.contentType};base64,${img.dataBase64}`} target="_blank" rel="noreferrer">
                          <img src={`data:${img.contentType};base64,${img.dataBase64}`} alt={img.fileName} className="attachment-thumb" />
                        </a>
                        {canDelete && (
                          <button className="btn-delete-img" onClick={() => handleDeleteImage(img.fileName)} title="Delete Attachment">
                            ✖
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!isEditingDetails && (
              <div className="panel-section">
                <h4>Contact Info</h4>
                <p>{selectedTicket.contactName} ({selectedTicket.contactEmail})</p>
                <p>{selectedTicket.contactPhone}</p>
              </div>
            )}

            {/* ROLE BASED CONTROLS */}
            <div className="panel-section controls-section">
              <h4>Management</h4>
              
              <div className="control-group">
                <label>Assigned Technician</label>
                {isAdmin ? (
                  <div className="input-row">
                    <input type="email" value={technicianEmailInput} onChange={e => setTechnicianEmailInput(e.target.value)} placeholder="Email..." />
                    <button className="btn-secondary btn-small" onClick={handleAssign}>Assign</button>
                  </div>
                ) : (
                  <p>{selectedTicket.assignedTechnicianEmail || "Unassigned"}</p>
                )}
              </div>

              <div className="control-group">
                <label>Status</label>
                {canSeeAllFilters ? (
                  <div className="input-row">
                    <select value={statusInput} onChange={e => setStatusInput(e.target.value)}>
                      <option value="OPEN">OPEN</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="CLOSED">CLOSED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                    <button className="btn-secondary btn-small" onClick={() => handleStatusChange(statusInput)}>Update</button>
                  </div>
                ) : isTechnician ? (
                  <div className="technician-actions" style={{ flexDirection: "column" }}>
                    {selectedTicket.status === "OPEN" && (
                      <button className="btn-primary" onClick={() => handleStatusChange("IN_PROGRESS")}>Start Work</button>
                    )}
                    {selectedTicket.status === "IN_PROGRESS" && (
                      <div className="resolve-container" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <textarea 
                          placeholder="Describe how the issue was fixed..."
                          value={resolutionNotesInput}
                          onChange={e => setResolutionNotesInput(e.target.value)}
                          style={{ padding: "8px", borderRadius: "4px", border: "1px solid #d9d9e3", minHeight: "60px", fontFamily: "inherit" }}
                        />
                        <button 
                          className="btn-success" 
                          onClick={handleResolve}
                          disabled={!resolutionNotesInput.trim()}
                        >
                          Mark as Resolved
                        </button>
                      </div>
                    )}
                    {selectedTicket.status !== "OPEN" && selectedTicket.status !== "IN_PROGRESS" && (
                      <p>No further actions available. Notes: {selectedTicket.resolutionNotes}</p>
                    )}
                  </div>
                ) : (
                  <p>Contact admin to change status.</p>
                )}
              </div>
            </div>

            {/* COMMENTS SECTION */}
            <div className="panel-section comments-section">
              <h4>Activity & Comments</h4>
              <div className="comments-list">
                <div className="comment system-comment">
                  <strong>System:</strong> Ticket created by {selectedTicket.createdByEmail} on {new Date(selectedTicket.createdAt).toLocaleString()}.
                </div>
                {(selectedTicket.comments || []).map(c => {
                  const isAuthor = c.authorEmail === user?.email;
                  const canDelete = isAuthor || isAdmin;
                  
                  if (editingCommentId === c.id) {
                    return (
                      <div key={c.id} className="comment edit-mode-comment">
                        <textarea value={editingCommentText} onChange={e => setEditingCommentText(e.target.value)} style={{ width: '100%', marginBottom: '8px' }} />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn-success btn-small" onClick={() => handleEditCommentSubmit(c.id)}>Save</button>
                          <button className="btn-secondary btn-small" onClick={() => setEditingCommentId(null)}>Cancel</button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={c.id} className="comment user-comment">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>{c.authorEmail}</strong> <span className="time">{new Date(c.createdAt).toLocaleString()}</span>
                          {c.updatedAt !== c.createdAt && <span className="time" style={{marginLeft: '4px'}}>(edited)</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {isAuthor && <button className="btn-secondary btn-small" onClick={() => { setEditingCommentId(c.id); setEditingCommentText(c.text); }}>Edit</button>}
                          {canDelete && <button className="btn-secondary btn-small" style={{ color: 'red' }} onClick={() => handleDeleteComment(c.id)}>Delete</button>}
                        </div>
                      </div>
                      <p>{c.text}</p>
                    </div>
                  );
                })}
              </div>
              <div className="add-comment">
                <input type="text" value={commentInput} onChange={e => setCommentInput(e.target.value)} placeholder="Add a comment..." onKeyDown={e => e.key === 'Enter' && handleAddComment()} />
                <button className="btn-secondary" onClick={handleAddComment}>Post</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyTicketsPage;
