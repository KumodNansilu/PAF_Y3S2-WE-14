import React from "react";
import { Link } from "react-router-dom";

function UnauthorizedPage() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "3rem 1rem" }}>
      <h1>Unauthorized</h1>
      <p>You do not have permission to view this page.</p>
      <Link to="/">Back to dashboard</Link>
    </div>
  );
}

export default UnauthorizedPage;