import React from "react";
import { useNavigate } from "react-router-dom";
import { createTicket, getResources } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "../styles/TicketCreatePage.css";

const CATEGORY_OPTIONS = [
  { value: "Electrical", icon: "⚡" },
  { value: "Network", icon: "🌐" },
  { value: "Equipment", icon: "🛠" },
  { value: "Facility", icon: "🏢" },
  { value: "Other", icon: "🧩" }
];

const PRIORITY_OPTIONS = [
  { value: "LOW", colorClass: "priority-low" },
  { value: "MEDIUM", colorClass: "priority-medium" },
  { value: "HIGH", colorClass: "priority-high" }
];

const ACCEPTED_TYPES = ["image/jpeg", "image/png"];

const initialState = {
  resourceOrLocation: "",
  category: CATEGORY_OPTIONS[0].value,
  priority: "MEDIUM",
  description: "",
  contactName: "",
  contactEmail: "",
  contactPhone: ""
};

function validateField(name, value) {
  if (name === "resourceOrLocation") {
    if (!value.trim()) {
      return "Resource or location is required.";
    }
  }

  if (name === "category") {
    if (!value.trim()) {
      return "Category is required.";
    }
  }

  if (name === "description") {
    if (!value.trim()) {
      return "Description is required.";
    }
    if (value.trim().length < 10) {
      return "Description must be at least 10 characters.";
    }
  }

  if (name === "contactPhone") {
    if (!value.trim()) {
      return "Phone number is required.";
    }
    if (!/^[+0-9()\-\s]{7,20}$/.test(value.trim())) {
      return "Enter a valid phone number.";
    }
  }

  if (name === "contactEmail") {
    if (!value.trim()) {
      return "Email is required.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
      return "Enter a valid email address.";
    }
  }

  return "";
}

function bytesToReadable(size) {
  if (!size || size < 1024) {
    return `${size || 0} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function TicketCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = React.useState(initialState);
  const [images, setImages] = React.useState([]);
  const [fieldErrors, setFieldErrors] = React.useState({});
  const [touched, setTouched] = React.useState({});
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState("");
  const [resourceOptions, setResourceOptions] = React.useState([]);
  const [resourceLoading, setResourceLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) {
      return;
    }

    setForm((current) => ({
      ...current,
      contactName: current.contactName || user.name || "",
      contactEmail: current.contactEmail || user.email || ""
    }));
  }, [user]);

  React.useEffect(() => {
    let mounted = true;

    const loadResourceOptions = async () => {
      try {
        setResourceLoading(true);
        const data = await getResources({ status: "ACTIVE" });
        if (mounted) {
          setResourceOptions(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (mounted) {
          setResourceOptions([]);
        }
      } finally {
        if (mounted) {
          setResourceLoading(false);
        }
      }
    };

    loadResourceOptions();

    return () => {
      mounted = false;
    };
  }, []);

  const imagePreviews = React.useMemo(
    () => images.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [images]
  );

  React.useEffect(() => {
    return () => {
      imagePreviews.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [imagePreviews]);

  const filteredResources = resourceOptions.filter((item) =>
    `${item.name} ${item.type} ${item.location} ${item.status}`
      .toLowerCase()
      .includes(form.resourceOrLocation.toLowerCase().trim())
  );
  const isRequiredFilled =
    form.resourceOrLocation.trim() &&
    form.category.trim() &&
    form.description.trim() &&
    form.contactPhone.trim() &&
    form.contactEmail.trim();

  const hasFieldErrors = Object.values(fieldErrors).some(Boolean);
  const canSubmit = isRequiredFilled && !hasFieldErrors && !submitting;

  const updateField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    const nextError = validateField(name, value);
    setFieldErrors((current) => ({ ...current, [name]: nextError }));
  };

  const onChange = (event) => {
    const { name, value } = event.target;
    updateField(name, value);
  };

  const onBlurField = (event) => {
    const { name, value } = event.target;
    setTouched((current) => ({ ...current, [name]: true }));
    setFieldErrors((current) => ({ ...current, [name]: validateField(name, value) }));
  };

  const validateImages = (selected) => {
    if (selected.length > 3) {
      return "You can upload a maximum of 3 images.";
    }

    const invalidFile = selected.find((file) => !ACCEPTED_TYPES.includes(file.type));
    if (invalidFile) {
      return "Only JPG and PNG images are allowed.";
    }

    return "";
  };

  const onImageChange = (event) => {
    const selected = Array.from(event.target.files || []);
    const imageError = validateImages(selected);
    setFormError(imageError);
    setImages(imageError ? [] : selected);
  };

  const onDropImages = (event) => {
    event.preventDefault();
    const dropped = Array.from(event.dataTransfer.files || []);
    if (dropped.length === 0) {
      return;
    }
    const imageError = validateImages(dropped);
    setFormError(imageError);
    setImages(imageError ? [] : dropped);
  };

  const onDragOver = (event) => {
    event.preventDefault();
  };

  const removeImageAt = (index) => {
    setImages((current) => current.filter((_, imageIndex) => imageIndex !== index));
  };

  const resetForm = () => {
    setForm({
      ...initialState,
      contactName: user?.name || "",
      contactEmail: user?.email || ""
    });
    setImages([]);
    setFieldErrors({});
    setTouched({});
    setFormError("");
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {
      resourceOrLocation: validateField("resourceOrLocation", form.resourceOrLocation),
      category: validateField("category", form.category),
      description: validateField("description", form.description),
      contactPhone: validateField("contactPhone", form.contactPhone),
      contactEmail: validateField("contactEmail", form.contactEmail)
    };
    setFieldErrors(nextErrors);
    setTouched({
      resourceOrLocation: true,
      category: true,
      description: true,
      contactPhone: true,
      contactEmail: true
    });

    if (Object.values(nextErrors).some(Boolean)) {
      setFormError("Please correct the highlighted fields.");
      return;
    }

    try {
      setSubmitting(true);
      setFormError("");

      await createTicket(form, images);
      navigate("/tickets/list", { state: { created: true } });
    } catch (requestError) {
      const message = requestError?.response?.data?.message || "Failed to create ticket. Please try again.";
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const descriptionLength = form.description.length;

  return (
    <section className="ticket-page-shell">
      <div className="surface-card ticket-create-page">
      <div className="ticket-heading">
        <h2>Create Maintenance Ticket</h2>
        <p>Report an issue with campus resources</p>
      </div>

      <form className="ticket-form" onSubmit={onSubmit}>
        <div className="ticket-form-section">
          <h3>Resource / Location</h3>
          <label>
            Resource or location
            <input
              list="resource-suggestions"
              name="resourceOrLocation"
              value={form.resourceOrLocation}
              onChange={onChange}
              onBlur={onBlurField}
              className={touched.resourceOrLocation && fieldErrors.resourceOrLocation ? "invalid" : ""}
              placeholder="e.g. Multimedia Lab, Room 302, Library..."
              required
            />
            <datalist id="resource-suggestions">
              {filteredResources.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name} - {item.type} - {item.location}
                </option>
              ))}
            </datalist>
          </label>
          {resourceLoading ? <p>Loading resources...</p> : null}
          {!resourceLoading && filteredResources.length === 0 ? (
            <p className="field-error">No ACTIVE resources found in the catalogue.</p>
          ) : null}
          {touched.resourceOrLocation && fieldErrors.resourceOrLocation ? (
            <p className="field-error">{fieldErrors.resourceOrLocation}</p>
          ) : null}
        </div>

        <div className="ticket-form-section">
          <h3>Category</h3>
          <label>
            Issue category
            <select
              name="category"
              value={form.category}
              onChange={onChange}
              onBlur={onBlurField}
              className={touched.category && fieldErrors.category ? "invalid" : ""}
              required
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option value={option.value} key={option.value}>{option.icon} {option.value}</option>
              ))}
            </select>
          </label>
          {touched.category && fieldErrors.category ? <p className="field-error">{fieldErrors.category}</p> : null}
        </div>

        <div className="ticket-form-section">
          <h3>Description</h3>
          <label>
            Issue details
            <textarea
              name="description"
              value={form.description}
              onChange={onChange}
              onBlur={onBlurField}
              minLength={10}
              maxLength={2000}
              className={touched.description && fieldErrors.description ? "invalid" : ""}
              required
              rows={5}
              placeholder="Describe the issue in detail..."
            />
          </label>
          <div className="ticket-inline-meta">
            <span className="char-counter">{descriptionLength}/2000</span>
            {touched.description && fieldErrors.description ? <p className="field-error">{fieldErrors.description}</p> : null}
          </div>
        </div>

        <div className="ticket-form-section">
          <h3>Priority</h3>
          <div className="priority-row">
            {PRIORITY_OPTIONS.map((option) => (
              <label key={option.value} className={`priority-option ${option.colorClass}`}>
                <input
                  type="radio"
                  name="priority"
                  value={option.value}
                  checked={form.priority === option.value}
                  onChange={onChange}
                />
                {option.value}
              </label>
            ))}
          </div>
        </div>

        <div className="ticket-form-section">
          <h3>Contact Details</h3>
          <div className="ticket-grid-two">
          <label>
            Phone number
            <input
              type="tel"
              name="contactPhone"
              value={form.contactPhone}
              onChange={onChange}
              onBlur={onBlurField}
              required
              className={touched.contactPhone && fieldErrors.contactPhone ? "invalid" : ""}
              placeholder="+94 77 123 4567"
            />
            {touched.contactPhone && fieldErrors.contactPhone ? <p className="field-error">{fieldErrors.contactPhone}</p> : null}
          </label>

          <label>
            Email
            <input
              type="email"
              name="contactEmail"
              value={form.contactEmail}
              onChange={onChange}
              onBlur={onBlurField}
              required
              className={touched.contactEmail && fieldErrors.contactEmail ? "invalid" : ""}
              placeholder="name@example.com"
            />
            {touched.contactEmail && fieldErrors.contactEmail ? <p className="field-error">{fieldErrors.contactEmail}</p> : null}
          </label>
        </div>
        </div>

        <div className="ticket-form-section">
          <h3>Reporter</h3>
          <label>
            Name
            <input
              type="text"
              name="contactName"
              value={form.contactName}
              onChange={onChange}
              maxLength={120}
              placeholder="Your full name"
            />
          </label>
        </div>

        <div className="ticket-form-section">
          <h3>Image Upload</h3>
          <label>
            Upload Images (Max 3)
          </label>
          <div className="upload-dropzone" onDrop={onDropImages} onDragOver={onDragOver}>
            <p>Drag & drop JPG/PNG files here</p>
            <label className="file-picker-btn">
              Browse Files
              <input type="file" multiple accept=".jpg,.jpeg,.png" onChange={onImageChange} />
            </label>
          </div>
          {images.length > 0 ? (
            <div className="ticket-file-list">
              {imagePreviews.map((item, index) => (
                <article key={`${item.file.name}-${item.file.size}`}>
                  <img src={item.url} alt={item.file.name} />
                  <div>
                    <strong>{item.file.name}</strong>
                    <small>{bytesToReadable(item.file.size)}</small>
                  </div>
                  <button type="button" onClick={() => removeImageAt(index)}>Remove</button>
                </article>
              ))}
            </div>
          ) : null}
        </div>

        {formError ? <p className="ticket-message ticket-error">{formError}</p> : null}

        <div className="ticket-actions">
          <button type="submit" disabled={!canSubmit}>
            {submitting ? "Submitting..." : "Submit Ticket"}
          </button>
          <button type="button" className="btn-secondary" onClick={resetForm} disabled={submitting}>
            Cancel / Reset
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate("/tickets/list")}>View Tickets</button>
        </div>
      </form>
      </div>
      {submitting ? (
        <div className="ticket-loading-overlay">
          <div className="ticket-spinner" aria-hidden="true" />
          <p>Submitting ticket...</p>
        </div>
      ) : null}
    </section>
  );
}

export default TicketCreatePage;
