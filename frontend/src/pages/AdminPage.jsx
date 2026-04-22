import React from "react";
import { getAdminPing } from "../services/api";

function AdminPage() {
  const [message, setMessage] = React.useState("Loading...");

  React.useEffect(() => {
    getAdminPing()
      .then((data) => setMessage(data.message))
      .catch(() => setMessage("Failed to load admin data."));
  }, []);

  return (
    <div>
      <h1>Admin Area</h1>
      <p>{message}</p>
    </div>
  );
}

export default AdminPage;