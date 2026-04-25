import React, { useState, useEffect } from "react";
import {
  getResources,
  createBooking,
  getMyBookings,
  cancelBooking,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import "../styles/ResourceBookingPage.css";

function ResourceBookingPage() {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("browse"); // browse or my-bookings
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [filters, setFilters] = useState({
    type: "",
    location: "",
    status: "ACTIVE",
  });

  const [formData, setFormData] = useState({
    resourceId: "",
    resourceName: "",
    bookingDate: "",
    startTime: "09:00",
    endTime: "10:00",
    purpose: "",
  });

  useEffect(() => {
    fetchResources();
    if (activeTab === "my-bookings") {
      fetchMyBookings();
    }
  }, [activeTab]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const filterParams = {
        type: filters.type || undefined,
        location: filters.location || undefined,
        status: filters.status || "ACTIVE",
      };
      const data = await getResources(filterParams);
      setResources(data);
      setError("");
    } catch (err) {
      setError("Failed to load resources");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyBookings = async () => {
    try {
      const data = await getMyBookings();
      setMyBookings(data);
      setError("");
    } catch (err) {
      setError("Failed to load your bookings");
      console.error(err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    fetchResources();
  };

  const handleResourceSelect = (resource) => {
    setSelectedResource(resource);
    setFormData((prev) => ({
      ...prev,
      resourceId: resource.id,
      resourceName: resource.name,
    }));
    setShowBookingForm(true);
  };

  const handleBookingFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();

    if (
      !formData.bookingDate ||
      !formData.startTime ||
      !formData.endTime ||
      !formData.purpose
    ) {
      setError("Please fill in all required fields");
      return;
    }

    if (formData.startTime >= formData.endTime) {
      setError("End time must be later than start time");
      return;
    }

    try {
      setLoading(true);
      await createBooking({
        resourceId: formData.resourceId,
        resourceName: formData.resourceName,
        bookingDate: formData.bookingDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        purpose: formData.purpose,
      });
      setError("");
      alert(
        "Booking request submitted successfully! Admin will review and approve/reject it.",
      );
      setShowBookingForm(false);
      setFormData({
        resourceId: "",
        resourceName: "",
        bookingDate: "",
        startTime: "09:00",
        endTime: "10:00",
        purpose: "",
      });
      fetchMyBookings();
    } catch (err) {
      const status = err.response?.status;
      const backendMessage = err.response?.data?.message;
      const fallbackMessage =
        status === 404
          ? "Booking endpoint was not found on the backend. Please restart the backend and try again."
          : err.message;

      setError(
        "Failed to create booking: " + (backendMessage || fallbackMessage),
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm("Are you sure you want to cancel this booking?")) {
      try {
        await cancelBooking(bookingId);
        alert("Booking cancelled successfully");
        fetchMyBookings();
      } catch (err) {
        setError(
          "Failed to cancel booking: " +
            (err.response?.data?.message || err.message),
        );
      }
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "APPROVED":
        return "status-approved";
      case "REJECTED":
        return "status-rejected";
      case "PENDING":
        return "status-pending";
      case "CANCELLED":
        return "status-cancelled";
      default:
        return "";
    }
  };

  return (
    <div className="booking-page">
      <h1>📅 Resource Booking System</h1>
      <p className="booking-subtitle">
        Book campus resources easily • Get instant notifications • Track your
        bookings
      </p>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      <div className="tabs">
        <button
          className={`tab-button ${activeTab === "browse" ? "active" : ""}`}
          onClick={() => setActiveTab("browse")}
        >
          🔍 Browse Resources
        </button>
        <button
          className={`tab-button ${activeTab === "my-bookings" ? "active" : ""}`}
          onClick={() => setActiveTab("my-bookings")}
        >
          My Bookings
        </button>
      </div>

      {activeTab === "browse" && (
        <div className="browse-section">
          <div className="filters-section">
            <h3>Filter Resources</h3>
            <div className="filter-group">
              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="filter-input"
              >
                <option value="">All Types</option>
                <option value="LECTURE_HALL">Lecture Hall</option>
                <option value="LAB">Lab</option>
                <option value="MEETING_ROOM">Meeting Room</option>
                <option value="EQUIPMENT">Equipment</option>
              </select>
              <input
                type="text"
                name="location"
                placeholder="Location..."
                value={filters.location}
                onChange={handleFilterChange}
                className="filter-input"
              />
              <button onClick={applyFilters} className="btn btn-primary">
                🔍 Apply Filters
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading">Loading resources...</div>
          ) : (
            <div className="resources-grid">
              {resources.length === 0 ? (
                <p className="no-data">
                  No resources found matching your criteria
                </p>
              ) : (
                resources.map((resource) => (
                  <div key={resource.id} className="resource-card">
                    <h3>{resource.name}</h3>
                    <div className="details">
                      <div className="detail-item">
                        <span>📂</span>
                        <span>
                          <strong>Type:</strong>{" "}
                          {resource.type.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span>📍</span>
                        <span>
                          <strong>Location:</strong> {resource.location}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span>👥</span>
                        <span>
                          <strong>Capacity:</strong> {resource.capacity} people
                        </span>
                      </div>
                      <div className="detail-item">
                        <span>✓</span>
                        <span
                          className={`status-badge ${resource.status !== "ACTIVE" ? "inactive" : ""}`}
                        >
                          {resource.status}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleResourceSelect(resource)}
                      className="btn btn-success"
                      disabled={resource.status !== "ACTIVE"}
                    >
                      {resource.status === "ACTIVE"
                        ? "📅 Book Now"
                        : "❌ Not Available"}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "my-bookings" && (
        <div className="my-bookings-section">
          {loading ? (
            <div className="loading">Loading your bookings...</div>
          ) : myBookings.length === 0 ? (
            <p className="no-data">You haven't made any bookings yet</p>
          ) : (
            <div className="bookings-table">
              <table>
                <thead>
                  <tr>
                    <th>Resource</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Purpose</th>
                    <th>Status</th>
                    <th>Reason</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {myBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td>{booking.resourceName}</td>
                      <td>{booking.bookingDate}</td>
                      <td>
                        {booking.startTime} - {booking.endTime}
                      </td>
                      <td>{booking.purpose}</td>
                      <td>
                        <span
                          className={`status-badge ${getStatusBadgeClass(booking.status)}`}
                        >
                          {booking.status}
                        </span>
                      </td>
                      <td>{booking.rejectionReason || "-"}</td>
                      <td>
                        {(booking.status === "PENDING" ||
                          booking.status === "APPROVED") && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="btn btn-small btn-danger"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showBookingForm && selectedResource && (
        <div
          className="modal-overlay"
          onClick={() => setShowBookingForm(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>📆 Book {selectedResource.name}</h2>
            <form onSubmit={handleSubmitBooking}>
              <div className="form-group">
                <label>Booking Date *</label>
                <input
                  type="date"
                  name="bookingDate"
                  value={formData.bookingDate}
                  onChange={handleBookingFormChange}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Time *</label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleBookingFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Time *</label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleBookingFormChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Purpose of Booking *</label>
                <textarea
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleBookingFormChange}
                  placeholder="Describe what you'll use this resource for..."
                  rows="4"
                  required
                />
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? "⏳ Submitting..." : "✓ Submit Booking Request"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBookingForm(false)}
                  className="btn btn-secondary"
                >
                  ✕ Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResourceBookingPage;
