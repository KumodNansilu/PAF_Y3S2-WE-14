import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/api";
import "../styles/LoginPage.css";

function RegistrationPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.password || !formData.confirmPassword) {
      return "Please fill in all fields to continue.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      return "Please enter a valid email address.";
    }

    if (formData.password.length < 8) {
      return "Password must be at least 8 characters long.";
    }

    if (formData.password !== formData.confirmPassword) {
      return "Passwords do not match.";
    }

    return "";
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    registerUser({
      ...formData,
      fullName: formData.fullName.trim(),
      email: formData.email.trim()
    })
      .then((response) => {
        setNotice(response.message || "Registration completed successfully.");
        setTimeout(() => navigate("/login"), 1200);
      })
      .catch((requestError) => {
        const serverMessage = requestError?.response?.data?.message
          || requestError?.response?.data?.error
          || requestError?.response?.data?.detail
          || requestError?.message;
        setError(serverMessage || "Registration failed. Please try again.");
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <section className="auth-panel" aria-label="Registration form">
          <p className="brand-overline">Campus Platform</p>
          <h1>Create your account</h1>
          <p>Register with your email to prepare access for the campus portal.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-field">
              <label className="field-label" htmlFor="fullName">Full name</label>
              <input id="fullName" name="fullName" className="text-input" value={formData.fullName} onChange={handleChange} placeholder="Your name" />
            </div>

            <div className="form-field">
              <label className="field-label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" autoComplete="email" className="text-input" value={formData.email} onChange={handleChange} placeholder="you@example.edu" />
            </div>

            <div className="form-field">
              <label className="field-label" htmlFor="password">Password</label>
              <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} className="text-input" value={formData.password} onChange={handleChange} placeholder="Create a password" aria-describedby="password-help" />
              <small id="password-help" className="helper-text">Use at least 8 characters.</small>
            </div>

            <div className="form-field">
              <label className="field-label" htmlFor="confirmPassword">Confirm password</label>
              <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" className="text-input" value={formData.confirmPassword} onChange={handleChange} placeholder="Repeat your password" />
            </div>

            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          {error ? <div className="notice-box" style={{ background: "#fff1f1", borderColor: "#f2c0c0" }}>{error}</div> : null}
          {notice ? <div className="notice-box">{notice}</div> : null}

          <div className="card-actions">
            <Link to="/login" className="secondary-button">Back to login</Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default RegistrationPage;