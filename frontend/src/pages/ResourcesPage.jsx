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

const FACILITY_TYPE_OPTIONS = ["LECTURE_HALL", "LAB", "MEETING_ROOM"];
const ASSET_TYPE = "EQUIPMENT";
const STATUS_OPTIONS = ["ACTIVE", "OUT_OF_SERVICE"];
const DAY_OPTIONS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getDayOfWeekFromDate(dateValue) {
  if (!dateValue) {
    return "MONDAY";
  }

  const dayIndex = new Date(`${dateValue}T00:00:00`).getDay();
  return DAY_OPTIONS[dayIndex] || "MONDAY";
}

function getDateForDayOfWeek(dayOfWeek) {
  const today = new Date();
  const todayIndex = today.getDay();
  const targetIndex = DAY_OPTIONS.indexOf((dayOfWeek || "").toUpperCase());

  if (targetIndex < 0) {
    return getTodayDate();
  }

  const offset = (targetIndex - todayIndex + 7) % 7;
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + offset);
  return nextDate.toISOString().slice(0, 10);
}

function createWindow(date = getTodayDate(), startTime = "08:00", endTime = "17:00") {
  return {
    date,
    dayOfWeek: getDayOfWeekFromDate(date),
    startTime,
    endTime
  };
}

function normalizeAvailabilityWindows(windows = []) {
  if (!Array.isArray(windows) || windows.length === 0) {
    return [createWindow()];
  }

  return windows.map((window) => {
    const date = window.date || getDateForDayOfWeek(window.dayOfWeek);
    return {
      date,
      dayOfWeek: getDayOfWeekFromDate(date),
      startTime: window.startTime || "08:00",
      endTime: window.endTime || "17:00"
    };
  });
}

function formatWindowLabel(window) {
  if (window.date) {
    return `${window.date} (${window.dayOfWeek}): ${window.startTime} - ${window.endTime}`;
  }

  return `${window.dayOfWeek}: ${window.startTime} - ${window.endTime}`;
}

const initialForm = {
  name: "",
  type: "LECTURE_HALL",
  capacity: 1,
  location: "",
  status: "ACTIVE",
  availabilityWindows: [createWindow()]
};

const initialAssetForm = {
  ...initialForm,
  type: ASSET_TYPE
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
  const [createMode, setCreateMode] = React.useState("FACILITY");
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
    const assets = resources.filter((item) => item.type === ASSET_TYPE).length;
    const facilities = resources.length - assets;
    return {
      total: resources.length,
      active,
      outOfService: resources.length - active,
      facilities,
      assets
    };
  }, [resources]);

  const groupedResources = React.useMemo(() => {
    const facilityItems = resources.filter((item) => item.type !== ASSET_TYPE);
    const assetItems = resources.filter((item) => item.type === ASSET_TYPE);
    return { facilityItems, assetItems };
  }, [resources]);

  const onFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const onFormChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: name === "capacity" ? Number(value) || "" : value }));
  };

  const onModeChange = (mode) => {
    setCreateMode(mode);
    setEditingId("");
    setSubmitError("");
    setForm(mode === "ASSET" ? initialAssetForm : initialForm);
  };

  const onWindowChange = (index, field, value) => {
    setForm((current) => ({
      ...current,
      availabilityWindows: current.availabilityWindows.map((window, i) =>
        i === index
          ? {
              ...window,
              [field]: value,
              ...(field === "date" ? { dayOfWeek: getDayOfWeekFromDate(value) } : {})
            }
          : window
      )
    }));
  };

  const addWindow = () => {
    setForm((current) => ({
      ...current,
      availabilityWindows: [
        ...current.availabilityWindows,
        createWindow()
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
    setForm(createMode === "ASSET" ? initialAssetForm : initialForm);
    setEditingId("");
    setSubmitError("");
  };

  const startEdit = (resource) => {
    setEditingId(resource.id);
    setCreateMode(resource.type === ASSET_TYPE ? "ASSET" : "FACILITY");
    setSubmitError("");
    setForm({
      name: resource.name,
      type: resource.type,
      capacity: resource.capacity,
      location: resource.location,
      status: resource.status,
      availabilityWindows: normalizeAvailabilityWindows(resource.availabilityWindows)
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
        type: createMode === "ASSET" ? ASSET_TYPE : form.type,
        capacity: Number(form.capacity),
        availabilityWindows: form.availabilityWindows.map((window) => ({
          date: window.date,
          dayOfWeek: getDayOfWeekFromDate(window.date),
          startTime: window.startTime,
          endTime: window.endTime
        }))
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
            <strong>{counts.facilities}</strong>
            <span>Facilities</span>
          </div>
          <div>
            <strong>{counts.assets}</strong>
            <span>Assets</span>
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
          {[...FACILITY_TYPE_OPTIONS, ASSET_TYPE].map((type) => (
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

          <div className="create-mode-switch" role="tablist" aria-label="Resource type selector">
            <button
              type="button"
              role="tab"
              className={`mode-btn ${createMode === "FACILITY" ? "active" : ""}`}
              aria-selected={createMode === "FACILITY"}
              onClick={() => onModeChange("FACILITY")}
              disabled={submitting}
            >
              Facilities
            </button>
            <button
              type="button"
              role="tab"
              className={`mode-btn ${createMode === "ASSET" ? "active" : ""}`}
              aria-selected={createMode === "ASSET"}
              onClick={() => onModeChange("ASSET")}
              disabled={submitting}
            >
              Assets
            </button>
          </div>

          {createMode === "ASSET" ? (
            <p className="mode-helper">Create equipment assets with clear item quantities for users.</p>
          ) : (
            <p className="mode-helper">Create facilities such as lecture halls, labs, and meeting rooms.</p>
          )}

          <div className="resource-form-grid">
            <label>
              {createMode === "ASSET" ? "Asset name" : "Facility name"}
              <input name="name" value={form.name} onChange={onFormChange} required />
            </label>
            {createMode === "FACILITY" ? (
              <label>
                Facility type
                <select name="type" value={form.type} onChange={onFormChange} required>
                  {FACILITY_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label>
              {createMode === "ASSET" ? "Items available" : "Capacity"}
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
              {createMode === "ASSET" ? "Storage location" : "Location"}
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
              <div className="window-row" key={`${window.date}-${index}`}>
                <input
                  type="date"
                  value={window.date || ""}
                  onChange={(event) => onWindowChange(index, "date", event.target.value)}
                  required
                />
                <input
                  type="time"
                  value={window.startTime}
                  onChange={(event) => onWindowChange(index, "startTime", event.target.value)}
                  required
                />
                <input
                  type="time"
                  value={window.endTime}
                  onChange={(event) => onWindowChange(index, "endTime", event.target.value)}
                  required
                />
                <button type="button" className="danger-btn" onClick={() => removeWindow(index)}>
                  Remove
                </button>
              </div>
            ))}
          </div>

          {submitError ? <p className="error-text">{submitError}</p> : null}

          <button type="submit" className="primary-btn" disabled={submitting}>
            {submitting
              ? "Saving..."
              : editingId
                ? createMode === "ASSET"
                  ? "Update Asset"
                  : "Update Facility"
                : createMode === "ASSET"
                  ? "Create Asset"
                  : "Create Facility"}
          </button>
        </form>
      ) : null}

      <div className="surface-card resource-list">
        <h3>Catalogue Results</h3>
        {loading ? <p>Loading resources...</p> : null}
        {error ? <p className="error-text">{error}</p> : null}

        {!loading && !error && resources.length === 0 ? <p>No resources found for current filters.</p> : null}

        {!loading && !error && resources.length > 0 ? (
          <>
            <section className="catalog-section facilities-section">
              <div className="catalog-section-head">
                <h4>Facilities</h4>
                <p>Lecture halls, labs, and meeting spaces.</p>
              </div>
              <div className="resource-table-wrap">
              {groupedResources.facilityItems.length === 0 ? (
                <p>No facilities available.</p>
              ) : (
                <table className="catalog-table">
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
                    {groupedResources.facilityItems.map((resource) => (
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
                                {formatWindowLabel(window)}
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
              )}
              </div>
            </section>

            <section className="catalog-section assets-section">
              <div className="catalog-section-head">
                <h4>Assets</h4>
                <p>Equipment inventory and item availability.</p>
              </div>
              <div className="resource-table-wrap">
              {groupedResources.assetItems.length === 0 ? (
                <p>No assets available.</p>
              ) : (
                <table className="catalog-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Items Available</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Availability Windows</th>
                      {isAdmin ? <th>Actions</th> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {groupedResources.assetItems.map((resource) => (
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
                              <li key={`${resource.id}-asset-window-${index}`}>
                                {formatWindowLabel(window)}
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
              )}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </section>
  );
}

export default ResourcesPage;
