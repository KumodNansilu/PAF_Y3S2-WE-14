import React, { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { getCurrentUser, getGoogleLoginUrl } from "../services/api";
import "../styles/LoginPage.css";

function LoginPage() {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const oauthError = useMemo(() => {
    const query = new URLSearchParams(location.search);
    return query.get("error");
  }, [location.search]);

  const errorMessage = useMemo(() => {
    if (error) {
      return error;
    }

    if (oauthError) {
      return "Login failed. Please try again with your university account.";
    }

    return "";
  }, [error, oauthError]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      // Quick reachability check so we can show a useful network error before redirect.
      await getCurrentUser();
      window.location.href = getGoogleLoginUrl();
    } catch (requestError) {
      setError("Network error. Cannot reach the login server right now.");
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <section className="branding-panel" aria-label="Branding panel">
        <div className="branding-content">
          <div className="brand-logo" aria-hidden="true">SCH</div>
          <p className="brand-overline">Campus Platform</p>
          <h1>Smart Campus Operations Hub</h1>
          <p className="brand-tagline">Manage resources and campus operations efficiently.</p>

          <div className="campus-illustration" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="campus-card">Resources</div>
            <div className="campus-card">Bookings</div>
            <div className="campus-card">Tickets</div>
          </div>
        </div>
      </section>

      <section className="form-panel" aria-label="Login form panel">
        <div className="form-card">
          <h2>Sign in to your account</h2>
          <p className="form-subtitle">Secure login powered by Google OAuth 2.0</p>

          <button
            type="button"
            className="google-button"
            onClick={handleGoogleLogin}
            disabled={loading}
            aria-busy={loading}
          >
            <span className="google-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" role="img" aria-label="Google icon">
                <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.6 2.6 12 2.6 6.8 2.6 2.6 6.8 2.6 12S6.8 21.4 12 21.4c6.9 0 9.1-4.8 9.1-7.3 0-.5-.1-.9-.1-1.3H12z"/>
              </svg>
            </span>
            <span>{loading ? "Connecting..." : "Continue with Google"}</span>
            {loading ? <span className="spinner" aria-hidden="true" /> : null}
          </button>

          {errorMessage ? <p className="error-message">{errorMessage}</p> : null}

          <p className="helper-text">Use your university Google account to login.</p>
        </div>
      </section>
    </div>
  );
}

export default LoginPage;