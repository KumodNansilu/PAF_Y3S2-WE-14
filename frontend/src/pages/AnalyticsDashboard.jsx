import React, { useEffect, useState } from "react";
import { getAnalytics } from "../services/api";
import "../styles/AnalyticsDashboard.css";

function AnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getAnalytics()
      .then((res) => {
        if (active) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.response?.data?.message || err.message);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <div className="analytics-loading">Loading Analytics...</div>;
  }

  if (error) {
    return <div className="alert-error">Failed to load analytics: {error}</div>;
  }

  if (!data) return null;

  const sortedTechnicians = Object.entries(data.technicianPerformance).sort((a, b) => b[1] - a[1]);

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h2>Analytics Dashboard</h2>
        <p>System-wide metrics and technician performance.</p>
      </div>

      <div className="analytics-kpi-grid">
        <div className="analytics-card">
          <div className="kpi-title">Open Tickets</div>
          <div className="kpi-value value-open">{data.totalOpen}</div>
        </div>
        <div className="analytics-card">
          <div className="kpi-title">In Progress</div>
          <div className="kpi-value value-progress">{data.totalInProgress}</div>
        </div>
        <div className="analytics-card">
          <div className="kpi-title">Resolved/Closed</div>
          <div className="kpi-value value-resolved">{data.totalResolved}</div>
        </div>
        <div className="analytics-card">
          <div className="kpi-title">High Priority</div>
          <div className="kpi-value value-high">{data.totalHighPriority}</div>
        </div>
      </div>

      <div className="analytics-row">
        <div className="analytics-card resolution-card">
          <h3>Average Resolution Time</h3>
          {data.averageResolutionTimeHours != null ? (
            <div className="resolution-time">
              <span className="big-number">{data.averageResolutionTimeHours.toFixed(1)}</span>
              <span className="unit">Hours</span>
            </div>
          ) : (
            <p>Not enough data to calculate.</p>
          )}
          <p className="resolution-desc">Calculated across all historically resolved or closed tickets.</p>
        </div>

        <div className="analytics-card performance-card">
          <h3>Technician Performance</h3>
          <p className="resolution-desc">Ranking based on total tickets resolved.</p>
          {sortedTechnicians.length === 0 ? (
            <p>No technicians have resolved tickets yet.</p>
          ) : (
            <div className="technician-list">
              {sortedTechnicians.map(([email, count], index) => (
                <div key={email} className="technician-row">
                  <div className="tech-rank">#{index + 1}</div>
                  <div className="tech-email">{email}</div>
                  <div className="tech-score">{count} tickets</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;
