import React from "react";
import { useAuth } from "../context/AuthContext";
import {
  createResource,
  deleteResource,
  getResources,
  updateResource,
  updateResourceStatus
} from "../services/api";
import "../styles/ResourcesPage.css";

const TYPE_OPTIONS = ["LECTURE_HALL", "LAB", "MEETING_ROOM", "EQUIPMENT"];
const STATUS_OPTIONS = ["ACTIVE", "OUT_OF_SERVICE"];
const DAY_OPTIONS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY"
];

const initialForm = {
  name: "",
  type: "LECTURE_HALL",
  capacity: 1,
  location: "",
  status: "ACTIVE",
  availabilityWindows: [{ dayOfWeek: "MONDAY", startTime: "08:00", endTime: "17:00" }]
};

function blankFilters() {
  return {
    q: "",
    type: "",
    status: "",
    location: "",
    capacityMin: "",
    capacityMax: ""
  };
}

function ResourcesPage() {
  const { user } = useAuth();
  const isAdmin = (user?.roles || []).includes("ROLE_ADMIN");

  const [resources, setResources] = React.useState([]);
  const [filters, setFilters] = React.useState(blankFilters());
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [form, setForm] = React.useState(initialForm);
  const [editingId, setEditingId] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState("");

  const loadResources = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await getResources(filters);
      setResources(Array.isArray(data) ? data : []);
      setError("");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Failed to load resources.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  React.useEffect(() => {
    loadResources();
  }, [loadResources]);

  const counts = React.useMemo(() => {
    const active = resources.filter((item) => item.status === "ACTIVE").length;
    return {
      total: resources.length,
      active,
      outOfService: resources.length - active
    };
  }, [resources]);

  const onFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const onFormChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: name === "capacity" ? Number(value) || "" : value }));
  };

  const onWindowChange = (index, field, value) => {
    setForm((current) => ({
      ...current,
      availabilityWindows: current.availabilityWindows.map((window, i) =>
        i === index ? { ...window, [field]: value } : window
      )
    }));
  };

  const addWindow = () => {
    setForm((current) => ({
      ...current,
      availabilityWindows: [
        ...current.availabilityWindows,
        { dayOfWeek: "MONDAY", startTime: "08:00", endTime: "17:00" }
      ]
    }));
  };

  const removeWindow = (index) => {
    setForm((current) => {
      if (current.availabilityWindows.length === 1) {
        return current;
      }
      return {
        ...current,
        availabilityWindows: current.availabilityWindows.filter((_, i) => i !== index)
      };
    });
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId("");
    setSubmitError("");
  };

  const startEdit = (resource) => {
    setEditingId(resource.id);
    setSubmitError("");
    setForm({
      name: resource.name,
      type: resource.type,
      capacity: resource.capacity,
      location: resource.location,
      status: resource.status,
      availabilityWindows: (resource.availabilityWindows || []).length
        ? resource.availabilityWindows
        : [{ dayOfWeek: "MONDAY", startTime: "08:00", endTime: "17:00" }]
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setSubmitError("");

      const payload = {
        ...form,
        capacity: Number(form.capacity)
      };

      if (editingId) {
        await updateResource(editingId, payload);
      } else {
        await createResource(payload);
      }

      resetForm();
      await loadResources();
    } catch (requestError) {
      setSubmitError(requestError?.response?.data?.message || "Failed to save resource.");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (resource) => {
    if (!window.confirm(`Delete resource \"${resource.name}\"?`)) {
      return;
    }

    try {
      await deleteResource(resource.id);
      if (editingId === resource.id) {
        resetForm();
      }
      await loadResources();
    } catch (requestError) {
      alert(requestError?.response?.data?.message || "Failed to delete resource.");
    }
  };

  const onStatusToggle = async (resource) => {
    const nextStatus = resource.status === "ACTIVE" ? "OUT_OF_SERVICE" : "ACTIVE";

    try {
      await updateResourceStatus(resource.id, nextStatus);
      await loadResources();
    } catch (requestError) {
      alert(requestError?.response?.data?.message || "Failed to update status.");
    }
  };

  return (
    <section className="resources-page">
      <div className="surface-card resources-head">
        <div>
          <h2>Facilities & Assets Catalogue</h2>
          <p>Maintain lecture halls, labs, meeting rooms, and equipment with searchable metadata.</p>
        </div>
        <div className="resource-kpis">
          <div>
            <strong>{counts.total}</strong>
            <span>Total</span>
          </div>
          <div>
            <strong>{counts.active}</strong>
            <span>Active</span>
          </div>
          <div>
            <strong>{counts.outOfService}</strong>
            <span>Out of Service</span>
          </div>
        </div>
      </div>

      <div className="surface-card resource-filters">
        <input
          name="q"
          value={filters.q}
          onChange={onFilterChange}
          placeholder="Search by name, type, location"
        />
        <select name="type" value={filters.type} onChange={onFilterChange}>
          <option value="">All Types</option>
          {TYPE_OPTIONS.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <select name="status" value={filters.status} onChange={onFilterChange}>
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <input
          name="location"
          value={filters.location}
          onChange={onFilterChange}
          placeholder="Location"
        />
        <input
          name="capacityMin"
          value={filters.capacityMin}
          onChange={onFilterChange}
          placeholder="Min capacity"
          type="number"
          min="1"
        />
        <input
          name="capacityMax"
          value={filters.capacityMax}
          onChange={onFilterChange}
          placeholder="Max capacity"
          type="number"
          min="1"
        />
        <button type="button" onClick={() => setFilters(blankFilters())}>Clear</button>
      </div>

      {isAdmin ? (
        <form className="surface-card resource-form" onSubmit={onSubmit}>
          <div className="form-head">
            <h3>{editingId ? "Edit Resource" : "Create Resource"}</h3>
            {editingId ? (
              <button type="button" className="ghost-btn" onClick={resetForm}>
                Cancel Edit
              </button>
            ) : null}
          </div>

          <div className="resource-form-grid">
            <label>
              Resource name
              <input name="name" value={form.name} onChange={onFormChange} required />
            </label>
            <label>
              Type
              <select name="type" value={form.type} onChange={onFormChange} required>
                {TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Capacity
              <input
                name="capacity"
                value={form.capacity}
                onChange={onFormChange}
                type="number"
                min="1"
                required
              />
            </label>
            <label>
              Location
              <input name="location" value={form.location} onChange={onFormChange} required />
            </label>
            <label>
              Status
              <select name="status" value={form.status} onChange={onFormChange} required>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="window-block">
            <div className="window-head">
              <h4>Availability Windows</h4>
              <button type="button" className="ghost-btn" onClick={addWindow}>
                Add Window
              </button>
            </div>

            {form.availabilityWindows.map((window, index) => (
              <div className="window-row" key={`${window.dayOfWeek}-${index}`}>
                <select
                  value={window.dayOfWeek}
                  onChange={(event) => onWindowChange(index, "dayOfWeek", event.target.value)}
                >
                  {DAY_OPTIONS.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
                <input
                  type="time"
                  value={window.startTime}
                  onChange={(event) => onWindowChange(index, "startTime", event.target.value)}
                />
                <input
                  type="time"
                  value={window.endTime}
                  onChange={(event) => onWindowChange(index, "endTime", event.target.value)}
                />
                <button type="button" className="danger-btn" onClick={() => removeWindow(index)}>
                  Remove
                </button>
              </div>
            ))}
          </div>

          {submitError ? <p className="error-text">{submitError}</p> : null}

          <button type="submit" className="primary-btn" disabled={submitting}>
            {submitting ? "Saving..." : editingId ? "Update Resource" : "Create Resource"}
          </button>
        </form>
      ) : null}

      <div className="surface-card resource-list">
        <h3>Catalogue Results</h3>
        {loading ? <p>Loading resources...</p> : null}
        {error ? <p className="error-text">{error}</p> : null}

        {!loading && !error && resources.length === 0 ? <p>No resources found for current filters.</p> : null}

        {!loading && !error && resources.length > 0 ? (
          <div className="resource-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Capacity</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Availability Windows</th>
                  {isAdmin ? <th>Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {resources.map((resource) => (
                  <tr key={resource.id}>
                    <td>{resource.name}</td>
                    <td>{resource.type}</td>
                    <td>{resource.capacity}</td>
                    <td>{resource.location}</td>
                    <td>
                      <span className={`status-chip status-${resource.status}`}>{resource.status}</span>
                    </td>
                    <td>
                      <ul className="window-list">
                        {(resource.availabilityWindows || []).map((window, index) => (
                          <li key={`${resource.id}-window-${index}`}>
                            {window.dayOfWeek}: {window.startTime} - {window.endTime}
                          </li>
                        ))}
                      </ul>
                    </td>
                    {isAdmin ? (
                      <td>
                        <div className="action-row">
                          <button type="button" className="ghost-btn" onClick={() => startEdit(resource)}>
                            Edit
                          </button>
                          <button type="button" className="ghost-btn" onClick={() => onStatusToggle(resource)}>
                            Toggle Status
                          </button>
                          <button type="button" className="danger-btn" onClick={() => onDelete(resource)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default ResourcesPage;
