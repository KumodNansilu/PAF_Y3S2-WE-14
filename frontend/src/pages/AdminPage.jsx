import React, { useEffect, useState } from "react";
import {
  getAllUsers,
  updateUserDetails,
  deleteUser,
  getPendingBookings,
  approveBooking,
} from "../services/api";
import "../styles/AdminPage.css";

function AdminPage() {
  const [activeTab, setActiveTab] = useState("users"); // users or bookings
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [processingBookingId, setProcessingBookingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    } else {
      fetchBookings();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(data);
      setError("");
    } catch (err) {
      setError(
        "Failed to load users. Please ensure you have admin privileges.",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await getPendingBookings();
      setBookings(data);
      setError("");
    } catch (err) {
      setError("Failed to load bookings");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole =
      roleFilter === "ALL" || u.roles?.includes(`ROLE_${roleFilter}`);
    return matchesSearch && matchesRole;
  });

  const generateCSVReport = () => {
    const headers = ["ID", "Name", "Email", "Roles", "Created At"];
    const rows = filteredUsers.map((u) => [
      u.id,
      u.name,
      u.email,
      u.roles.join(" | "),
      new Date(u.createdAt).toLocaleString(),
    ]);

    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `User_Report_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEdit = (user) => {
    setEditingUser({ ...user });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setUpdateLoading(true);
      await updateUserDetails(editingUser.id, {
        name: editingUser.name,
        roles: editingUser.roles,
      });
      await fetchUsers();
      setEditingUser(null);
    } catch (err) {
      alert("Failed to update user.");
      console.error(err);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this user? This action cannot be undone.",
      )
    )
      return;
    try {
      await deleteUser(id);
      await fetchUsers();
    } catch (err) {
      alert(
        "Failed to delete user: " +
          (err.response?.data?.message || err.message),
      );
    }
  };

  const handleRoleToggle = (role) => {
    const currentRoles = [...editingUser.roles];
    if (currentRoles.includes(role)) {
      setEditingUser({
        ...editingUser,
        roles: currentRoles.filter((r) => r !== role),
      });
    } else {
      setEditingUser({
        ...editingUser,
        roles: [...currentRoles, role],
      });
    }
  };

  const handleApproveBooking = async (bookingId) => {
    try {
      setProcessingBookingId(bookingId);
      await approveBooking(bookingId, true);
      alert("Booking approved successfully");
      fetchBookings();
    } catch (err) {
      setError(
        "Failed to approve booking: " +
          (err.response?.data?.message || err.message),
      );
    } finally {
      setProcessingBookingId(null);
    }
  };

  const handleRejectBooking = (bookingId) => {
    setSelectedBookingId(bookingId);
    setShowRejectionModal(true);
    setRejectionReason("");
  };

  const submitRejection = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }
    try {
      setProcessingBookingId(selectedBookingId);
      await approveBooking(selectedBookingId, false, rejectionReason);
      alert("Booking rejected successfully");
      setShowRejectionModal(false);
      setRejectionReason("");
      setSelectedBookingId(null);
      fetchBookings();
    } catch (err) {
      setError(
        "Failed to reject booking: " +
          (err.response?.data?.message || err.message),
      );
    } finally {
      setProcessingBookingId(null);
    }
  };

  if (loading && activeTab === "users") {
    return (
      <div className="admin-loading">
        <span className="spinner" />
        <p>Loading user management...</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header-row">
        <h1>Admin Dashboard</h1>
        <div className="header-actions">
          <button
            className="refresh-btn"
            onClick={() =>
              activeTab === "users" ? fetchUsers() : fetchBookings()
            }
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          👥 User Management
        </button>
        <button
          className={`admin-tab ${activeTab === "bookings" ? "active" : ""}`}
          onClick={() => setActiveTab("bookings")}
        >
          📅 Resource Bookings
        </button>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {/* Users Tab */}
      {activeTab === "users" && (
        <>
          <div className="admin-controls">
            <div className="search-box">
              <span>🔍</span>
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-box">
              <label>Filter by Role:</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="ALL">All Roles</option>
                <option value="ADMIN">Administrators</option>
                <option value="MANAGER">Managers</option>
                <option value="TECHNICIAN">Technicians</option>
                <option value="USER">Standard Users</option>
              </select>
            </div>
            <div className="stats-pill">
              Showing <strong>{filteredUsers.length}</strong> users
            </div>
          </div>

          <div className="surface-card">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Roles</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-cell">
                        <span className="user-avatar">
                          {user.name ? user.name[0].toUpperCase() : "U"}
                        </span>
                        <span>{user.name}</span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <div className="roles-list">
                        {user.roles.map((role) => (
                          <span
                            key={role}
                            className={`role-badge-mini ${role.toLowerCase().replace("role_", "")}`}
                          >
                            {role.replace("ROLE_", "")}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="edit-btn"
                          onClick={() => handleEdit(user)}
                        >
                          Edit
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Bookings Tab */}
      {activeTab === "bookings" && (
        <div>
          {loading ? (
            <div className="admin-loading">
              <span className="spinner" />
              <p>Loading pending bookings...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="surface-card no-data-message">
              <p>No pending bookings to review</p>
            </div>
          ) : (
            <div className="surface-card">
              <table className="admin-table bookings-table">
                <thead>
                  <tr>
                    <th>Resource</th>
                    <th>User</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Purpose</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td>{booking.resourceName}</td>
                      <td>
                        <div>
                          <strong>{booking.userName}</strong>
                          <br />
                          <small>{booking.userEmail}</small>
                        </div>
                      </td>
                      <td>{booking.bookingDate}</td>
                      <td>
                        {booking.startTime} - {booking.endTime}
                      </td>
                      <td>{booking.purpose}</td>
                      <td>
                        <div className="action-buttons booking-actions">
                          <button
                            className="approve-btn"
                            onClick={() => handleApproveBooking(booking.id)}
                            disabled={processingBookingId === booking.id}
                          >
                            ✓ Approve
                          </button>
                          <button
                            className="reject-btn"
                            onClick={() => handleRejectBooking(booking.id)}
                            disabled={processingBookingId === booking.id}
                          >
                            ✗ Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="modal-overlay">
          <div className="modal-content surface-card">
            <div className="modal-header">
              <h2>Edit User Details</h2>
              <button
                className="close-btn"
                onClick={() => setEditingUser(null)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Email (Read-only)</label>
                <input type="text" value={editingUser.email} disabled />
              </div>
              <div className="form-group">
                <label>Roles</label>
                <div className="role-checkboxes">
                  {[
                    "ROLE_USER",
                    "ROLE_TECHNICIAN",
                    "ROLE_MANAGER",
                    "ROLE_ADMIN",
                  ].map((role) => (
                    <label key={role} className="role-check">
                      <input
                        type="checkbox"
                        checked={editingUser.roles.includes(role)}
                        onChange={() => handleRoleToggle(role)}
                      />
                      <span>{role.replace("ROLE_", "")}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="save-btn"
                  disabled={updateLoading}
                >
                  {updateLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {showRejectionModal && (
        <div className="modal-overlay">
          <div className="modal-content surface-card">
            <div className="modal-header">
              <h2>Reject Booking</h2>
              <button
                className="close-btn"
                onClick={() => setShowRejectionModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="form-group">
              <label>Rejection Reason *</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejecting this booking..."
                rows="5"
              />
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setShowRejectionModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="reject-btn"
                onClick={submitRejection}
                disabled={
                  !rejectionReason.trim() ||
                  processingBookingId === selectedBookingId
                }
              >
                {processingBookingId === selectedBookingId
                  ? "Rejecting..."
                  : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;
