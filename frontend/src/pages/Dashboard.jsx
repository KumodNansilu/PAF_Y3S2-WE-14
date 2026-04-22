import React from "react";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <h1>Dashboard</h1>
      <div>
        <p><strong>Name:</strong> {user?.name}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Roles:</strong> {(user?.roles || []).join(", ") || "None"}</p>
      </div>
      <button type="button" onClick={logout} style={{ width: "fit-content" }}>
        Logout
      </button>
    </div>
  );
}

export default Dashboard;