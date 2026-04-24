import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { updateProfileImage, getProfile } from "../services/api";
import "../styles/ProfilePage.css";

const ProfilePage = () => {
  const { user, logout, login } = useAuth(); // Use login to update local user state if needed
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "Campus User",
    phone: user?.phone || "+1 (555) 123-4567",
    department: user?.department || "Operations",
  });
  const [avatar, setAvatar] = useState(user?.profileImage || null);
  const [uploading, setUploading] = useState(false);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image size should be less than 2MB");
        return;
      }

      setUploading(true);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = reader.result;
        try {
          await updateProfileImage(base64);
          setAvatar(base64);
          // Optional: You might want to update the global auth context here
          // to reflect the change in the header immediately.
        } catch (err) {
          alert("Failed to upload image");
        } finally {
          setUploading(false);
        }
      };
    }
  };

  const [settings, setSettings] = useState({
    bookingUpdates: true,
    ticketUpdates: true,
    comments: false,
    darkMode: false,
  });

  const role = (user?.roles || ["ROLE_USER"]).includes("ROLE_ADMIN")
    ? "ADMIN"
    : (user?.roles || []).includes("ROLE_TECHNICIAN")
    ? "TECHNICIAN"
    : "USER";

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setIsEditing(false);
  };

  const handleSettingToggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getInitials = (name) => {
    if (!name) return "SC";
    return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  };

  const renderActivitySummary = () => {
    if (role === "ADMIN") {
      return (
        <div className="stats-grid">
          <div className="stat-card"><h3>12</h3><p>Resources Managed</p></div>
          <div className="stat-card"><h3>84</h3><p>Bookings Handled</p></div>
          <div className="stat-card"><h3>29</h3><p>Tickets Managed</p></div>
        </div>
      );
    } else if (role === "TECHNICIAN") {
      return (
        <div className="stats-grid">
          <div className="stat-card"><h3>5</h3><p>Assigned Tickets</p></div>
          <div className="stat-card"><h3>42</h3><p>Completed Tickets</p></div>
          <div className="stat-card"><h3>3</h3><p>In Progress Tasks</p></div>
        </div>
      );
    }
    return (
      <div className="stats-grid">
        <div className="stat-card"><h3>14</h3><p>Total Bookings</p></div>
        <div className="stat-card"><h3>2</h3><p>Active Bookings</p></div>
        <div className="stat-card"><h3>8</h3><p>Total Tickets</p></div>
        <div className="stat-card"><h3>1</h3><p>Open Tickets</p></div>
      </div>
    );
  };

  return (
    <div className={`profile-container ${settings.darkMode ? 'dark-theme' : ''}`}>
      {/* HEADER CARD */}
      <div className="profile-header-card glass-panel">
        <div className="profile-header-content">
          <div className="avatar-wrapper">
            {avatar ? (
              <img src={avatar} alt="Profile" className="profile-avatar" />
            ) : (
              <div className="profile-initials">{getInitials(formData.name)}</div>
            )}
            <label className="avatar-upload-btn" title="Change Avatar">
              ✏️
              <input type="file" accept="image/*" onChange={handleAvatarChange} hidden />
            </label>
          </div>
          <div className="profile-details">
            <h1 className="profile-name">{formData.name}</h1>
            <p className="profile-email">{user?.email || "user@smartcampus.edu"}</p>
            <span className={`role-badge role-${role.toLowerCase()}`}>{role}</span>
          </div>
        </div>
        <div className="profile-actions">
          <button className="btn btn-primary" onClick={() => setIsEditing(true)}>Edit Profile</button>
          <button className="btn btn-outline" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="profile-grid">
        <div className="profile-column">
          {/* PERSONAL INFO */}
          <div className="profile-card glass-panel">
            <h2 className="card-title">Personal Information</h2>
            <div className="info-list">
              <div className="info-item">
                <span className="info-label">Full Name</span>
                <span className="info-value">{formData.name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email Address</span>
                <span className="info-value text-muted">{user?.email || "user@smartcampus.edu"} (OAuth)</span>
              </div>
              <div className="info-item">
                <span className="info-label">Phone Number</span>
                <span className="info-value">{formData.phone}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Department</span>
                <span className="info-value">{formData.department}</span>
              </div>
            </div>
          </div>

          {/* SECURITY SECTION */}
          <div className="profile-card glass-panel">
            <h2 className="card-title">Security & Session</h2>
            <div className="info-list">
              <div className="info-item">
                <span className="info-label">Login Method</span>
                <span className="info-value flex-align">
                  <svg className="google-icon" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Google OAuth
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Last Login</span>
                <span className="info-value">Today, {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-column">
          {/* ACTIVITY SUMMARY */}
          <div className="profile-card glass-panel">
            <h2 className="card-title">Activity Summary</h2>
            {renderActivitySummary()}
          </div>

          {/* ACCOUNT SETTINGS */}
          <div className="profile-card glass-panel">
            <h2 className="card-title">Account Settings</h2>
            <div className="settings-list">
              <div className="setting-item">
                <div className="setting-text">
                  <strong>Booking Updates</strong>
                  <p>Receive notifications for booking status changes</p>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={settings.bookingUpdates} onChange={() => handleSettingToggle('bookingUpdates')} />
                  <span className="slider round"></span>
                </label>
              </div>
              <div className="setting-item">
                <div className="setting-text">
                  <strong>Ticket Updates</strong>
                  <p>Get notified when your tickets are resolved</p>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={settings.ticketUpdates} onChange={() => handleSettingToggle('ticketUpdates')} />
                  <span className="slider round"></span>
                </label>
              </div>
              <div className="setting-item">
                <div className="setting-text">
                  <strong>Dark Theme</strong>
                  <p>Toggle dark mode for the profile page</p>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={settings.darkMode} onChange={() => handleSettingToggle('darkMode')} />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITY */}
      <div className="profile-card glass-panel full-width">
        <h2 className="card-title">Recent Activity</h2>
        <ul className="timeline">
          <li className="timeline-item">
            <div className="timeline-icon booking-icon">📅</div>
            <div className="timeline-content">
              <strong>Booked Multimedia Lab</strong>
              <span className="time">2 hours ago</span>
              <p>Reservation for tomorrow 10:00 AM - 12:00 PM</p>
            </div>
          </li>
          <li className="timeline-item">
            <div className="timeline-icon ticket-icon">🛠️</div>
            <div className="timeline-content">
              <strong>Created Ticket #T-093</strong>
              <span className="time">Yesterday</span>
              <p>Projector not working in Room A-302</p>
            </div>
          </li>
          <li className="timeline-item">
            <div className="timeline-icon system-icon">🔒</div>
            <div className="timeline-content">
              <strong>Logged in via Google</strong>
              <span className="time">Yesterday</span>
              <p>Session started from recognized device.</p>
            </div>
          </li>
        </ul>
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditing && (
        <div className="modal-overlay">
          <div className="modal-card glass-panel animated-pop">
            <h2>Edit Profile</h2>
            <form onSubmit={handleSaveProfile}>
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input 
                  type="tel" 
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Department</label>
                <input 
                  type="text" 
                  value={formData.department} 
                  onChange={(e) => setFormData({...formData, department: e.target.value})} 
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setIsEditing(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
