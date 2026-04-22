import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/LoginPage.css";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!email) {
      setNotice("Enter your email address to continue.");
      return;
    }

    setNotice("Password reset flow is ready for backend wiring.");
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <section className="auth-panel" aria-label="Forgot password form">
          <p className="brand-overline">Campus Platform</p>
          <h1>Reset your password</h1>
          <p>Enter the email address for your account and we’ll prepare the reset flow.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-field">
              <label className="field-label" htmlFor="resetEmail">Email</label>
              <input
                id="resetEmail"
                name="resetEmail"
                type="email"
                autoComplete="email"
                className="text-input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.edu"
              />
            </div>

            <button type="submit" className="primary-button">Send reset link</button>
          </form>

          {notice ? <div className="notice-box">{notice}</div> : null}

          <div className="card-actions">
            <Link to="/login" className="secondary-button">Back to login</Link>
            <Link to="/register" className="secondary-button">Create account</Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;