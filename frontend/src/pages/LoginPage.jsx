import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getCurrentUser, getGoogleLoginUrl, loginWithEmail } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "../styles/LoginPage.css";

function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  const handleEmailLogin = async (event) => {
    event.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Enter both email and password to continue.");
      return;
    }

    setLoading(true);
    try {
      await loginWithEmail({ email: email.trim(), password });
      const me = await getCurrentUser();
      setUser(me?.authenticated ? me : null);
      const redirectPath = location.state?.from?.pathname || "/";
      navigate(redirectPath, { replace: true });
    } catch (requestError) {
      const serverMessage = requestError?.response?.data?.message;
      setError(serverMessage || "Email login failed. Please check your credentials.");
    } finally {
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
          <p className="form-subtitle">Use email and password, or continue with Google OAuth 2.0.</p>

          <form className="auth-form" onSubmit={handleEmailLogin}>
            <div className="form-field">
              <label className="field-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className="text-input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.edu"
              />
            </div>

            <div className="form-field">
              <label className="field-label" htmlFor="password">
                Password
              </label>
              <div className="password-field">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="text-input password-input"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="toggle-button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="auth-links">
              <Link to="/forgot-password" className="inline-link">
                Forgot password?
              </Link>
              <Link to="/register" className="inline-link">
                Create an account
              </Link>
            </div>

            <button type="submit" className="primary-button" disabled={loading}>
              Sign in with Email
            </button>
          </form>

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

          <p className="helper-text">Use your university Google account or the email form above.</p>
        </div>
      </section>
    </div>
  );
}

export default LoginPage;