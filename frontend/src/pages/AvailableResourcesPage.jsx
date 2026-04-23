import React from "react";
import { useAuth } from "../context/AuthContext";
import { getResources } from "../services/api";
import "../styles/AvailableResourcesPage.css";

const RESOURCE_ICONS = {
  LECTURE_HALL: "🎓",
  LAB: "🔬",
  MEETING_ROOM: "👥",
  EQUIPMENT: "🛠️"
};

const RESOURCE_COLORS = {
  LECTURE_HALL: "lecture",
  LAB: "lab",
  MEETING_ROOM: "meeting",
  EQUIPMENT: "equipment"
};

function getResourceLabel(type) {
  if (!type) return "Unknown";
  return type.replace(/_/g, " ");
}

function AvailableResourcesPage() {
  const { user } = useAuth();
  
  const [resources, setResources] = React.useState([]);
  const [filteredResources, setFilteredResources] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [selectedResource, setSelectedResource] = React.useState(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedType, setSelectedType] = React.useState("");
  const [selectedLocation, setSelectedLocation] = React.useState("");
  const [minCapacity, setMinCapacity] = React.useState("");

  // Load only ACTIVE resources
  React.useEffect(() => {
    const loadResources = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getResources({ status: "ACTIVE" });
        setResources(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load resources. Please try again.");
        setResources([]);
      } finally {
        setLoading(false);
      }
    };

    loadResources();
  }, []);

  // Apply filters
  React.useEffect(() => {
    let filtered = resources;

    // Search by name or location
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          r.location.toLowerCase().includes(query)
      );
    }

    // Filter by type
    if (selectedType) {
      filtered = filtered.filter((r) => r.type === selectedType);
    }

    // Filter by location
    if (selectedLocation) {
      filtered = filtered.filter(
        (r) => r.location.toLowerCase() === selectedLocation.toLowerCase()
      );
    }

    // Filter by minimum capacity
    if (minCapacity) {
      const min = parseInt(minCapacity, 10);
      if (!isNaN(min)) {
        filtered = filtered.filter((r) => r.capacity >= min);
      }
    }

    setFilteredResources(filtered);
  }, [resources, searchQuery, selectedType, selectedLocation, minCapacity]);

  // Get unique locations for filter dropdown
  const uniqueLocations = React.useMemo(() => {
    return [...new Set(resources.map((r) => r.location))].sort();
  }, [resources]);

  // Get unique types for filter dropdown
  const uniqueTypes = React.useMemo(() => {
    return [...new Set(resources.map((r) => r.type))].sort();
  }, [resources]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedType("");
    setSelectedLocation("");
    setMinCapacity("");
  };

  const hasActiveFilters =
    searchQuery || selectedType || selectedLocation || minCapacity;

  return (
    <section className="available-resources-page">
      {/* Header */}
      <div className="surface-card resources-header">
        <div className="header-content">
          <span className="section-eyebrow">Browse</span>
          <div className="header-title-row">
            <span className="header-icon" aria-hidden="true">
              📚
            </span>
            <div>
              <h1>Available Resources</h1>
              <p>
                Discover and explore all available academic resources including lecture halls,
                labs, meeting rooms, and equipment ready for your use.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="resource-stats-grid">
        <article className="stat-card">
          <span className="stat-icon">📊</span>
          <div>
            <span className="stat-label">Total Available</span>
            <strong>{resources.length}</strong>
          </div>
        </article>
        <article className="stat-card">
          <span className="stat-icon">🎓</span>
          <div>
            <span className="stat-label">Lecture Halls</span>
            <strong>{resources.filter((r) => r.type === "LECTURE_HALL").length}</strong>
          </div>
        </article>
        <article className="stat-card">
          <span className="stat-icon">🔬</span>
          <div>
            <span className="stat-label">Labs</span>
            <strong>{resources.filter((r) => r.type === "LAB").length}</strong>
          </div>
        </article>
        <article className="stat-card">
          <span className="stat-icon">👥</span>
          <div>
            <span className="stat-label">Meeting Rooms</span>
            <strong>{resources.filter((r) => r.type === "MEETING_ROOM").length}</strong>
          </div>
        </article>
      </div>

      {/* Filters */}
      <div className="surface-card filters-section">
        <div className="filters-header">
          <h3>Filter Resources</h3>
          {hasActiveFilters && (
            <button
              className="clear-filters-btn"
              onClick={handleClearFilters}
              aria-label="Clear all filters"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="filters-grid">
          <div className="filter-group">
            <label htmlFor="search-input">Search</label>
            <input
              id="search-input"
              type="text"
              placeholder="Search by name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="type-select">Resource Type</label>
            <select
              id="type-select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="filter-select"
            >
              <option value="">All Types</option>
              {uniqueTypes.map((type) => (
                <option key={type} value={type}>
                  {getResourceLabel(type)}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="location-select">Location</label>
            <select
              id="location-select"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="filter-select"
            >
              <option value="">All Locations</option>
              {uniqueLocations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="capacity-input">Min Capacity</label>
            <input
              id="capacity-input"
              type="number"
              placeholder="Enter minimum capacity"
              value={minCapacity}
              onChange={(e) => setMinCapacity(e.target.value)}
              min="0"
              className="filter-input"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="resources-results-section">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading available resources...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🔍</span>
            <h3>No Resources Found</h3>
            <p>
              {hasActiveFilters
                ? "Try adjusting your filters to find what you're looking for."
                : "There are currently no available resources."}
            </p>
            {hasActiveFilters && (
              <button
                className="secondary-btn"
                onClick={handleClearFilters}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="resources-grid">
            {filteredResources.map((resource) => (
              <div
                key={resource.id}
                className={`resource-card ${RESOURCE_COLORS[resource.type] || "default"}`}
              >
                <div className="resource-card-header">
                  <div className="resource-type-badge">
                    <span className="badge-icon">
                      {RESOURCE_ICONS[resource.type] || "📦"}
                    </span>
                    <span className="badge-text">{getResourceLabel(resource.type)}</span>
                  </div>
                  <div className="resource-status-badge available">
                    <span className="status-dot"></span>
                    Available
                  </div>
                </div>

                <div className="resource-card-body">
                  <h3 className="resource-name">{resource.name}</h3>

                  <div className="resource-info-grid">
                    <div className="info-item">
                      <span className="info-icon">📍</span>
                      <div>
                        <small>Location</small>
                        <p>{resource.location}</p>
                      </div>
                    </div>

                    <div className="info-item">
                      <span className="info-icon">👥</span>
                      <div>
                        <small>Capacity</small>
                        <p>{resource.capacity} {resource.type === "EQUIPMENT" ? "items" : "people"}</p>
                      </div>
                    </div>
                  </div>

                  {resource.availabilityWindows && resource.availabilityWindows.length > 0 && (
                    <div className="availability-section">
                      <h4>Available Times</h4>
                      <div className="availability-list">
                        {resource.availabilityWindows.map((window, idx) => (
                          <div key={idx} className="availability-item">
                            <span className="day-badge">{window.dayOfWeek?.substring(0, 3)}</span>
                            <span className="time-range">
                              {window.startTime} - {window.endTime}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="resource-card-footer">
                  <button
                    className="view-details-btn"
                    onClick={() => setSelectedResource(resource)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedResource && (
        <div className="modal-overlay" onClick={() => setSelectedResource(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close-btn"
              onClick={() => setSelectedResource(null)}
              aria-label="Close details"
            >
              ✕
            </button>

            <div className="modal-header">
              <span className="modal-icon">
                {RESOURCE_ICONS[selectedResource.type] || "📦"}
              </span>
              <div>
                <span className="modal-eyebrow">{getResourceLabel(selectedResource.type)}</span>
                <h2>{selectedResource.name}</h2>
              </div>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h3>Details</h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Status</span>
                    <span className="status-badge available">
                      <span className="status-dot"></span>
                      {selectedResource.status}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Location</span>
                    <p className="detail-value">{selectedResource.location}</p>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Capacity</span>
                    <p className="detail-value">
                      {selectedResource.capacity}{" "}
                      {selectedResource.type === "EQUIPMENT" ? "items" : "people"}
                    </p>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Resource ID</span>
                    <p className="detail-value">{selectedResource.id}</p>
                  </div>
                </div>
              </div>

              {selectedResource.availabilityWindows &&
                selectedResource.availabilityWindows.length > 0 && (
                  <div className="detail-section">
                    <h3>Availability Schedule</h3>
                    <div className="schedule-list">
                      {selectedResource.availabilityWindows.map((window, idx) => (
                        <div key={idx} className="schedule-item">
                          <div className="schedule-day">
                            <strong>{window.dayOfWeek}</strong>
                            {window.date && (
                              <small>{window.date}</small>
                            )}
                          </div>
                          <div className="schedule-time">
                            <span className="time-badge">
                              {window.startTime}
                            </span>
                            <span className="time-separator">→</span>
                            <span className="time-badge">
                              {window.endTime}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <div className="detail-section">
                <h3>Booking Information</h3>
                <p className="info-text">
                  To book this resource, please visit the Booking Management section or create a support ticket
                  if you have any questions.
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="primary-btn"
                onClick={() => setSelectedResource(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default AvailableResourcesPage;
