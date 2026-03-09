import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    axios
      .get("http://127.0.0.1:8000/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setUser(res.data);
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem("token");
        navigate("/login");
      });
  }, [navigate]);

 if (loading) return <p className="loading-text">Loading...</p>; 

  const firstName = user.name.split(" ")[0];

  const getRiskClass = (risk) => {
  if (!risk) return "risk";

  const value = risk.toLowerCase();

  if (value === "low") return "risk low";
  if (value === "medium") return "risk medium";
  if (value === "high") return "risk high";

  return "risk";
};

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <h2>Welcome, {firstName} 👋</h2>
          <p>Your personal insurance profile details</p>
        </div>

        <div className="profile-details">
          <div className="detail-row">
            <span className="label">Full Name</span>
            <span className="value">{user.name}</span>
          </div>

          <div className="detail-row">
            <span className="label">Email</span>
            <span className="value">{user.email}</span>
          </div>

          <div className="detail-row">
            <span className="label">Date of Birth</span>
            <span className="value">
              {user.dob ? new Date(user.dob).toLocaleDateString() : "N/A"}
            </span>
          </div>

          <div className="detail-row">
            <span className="label">Gender</span>
            <span className="value">{user.gender || "N/A"}</span>
          </div>

          <div className="detail-row">
            <span className="label">Occupation</span>
            <span className="value">{user.occupation || "N/A"}</span>
          </div>

          <div className="detail-row">
            <span className="label">Annual Income</span>
            <span className="value">
              {user.annual_income ? `₹ ${user.annual_income}` : "N/A"}
            </span>
          </div>

          <div className="detail-row">
            <span className="label">Phone</span>
            <span className="value">{user.phone || "N/A"}</span>
          </div>

          <div className="detail-row">
            <span className="label">Risk Profile</span>
            <span className={getRiskClass(user.risk_profile)}>
              {user.risk_profile || "N/A"}
            </span>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "20px" }}>
        <button
          onClick={() => navigate("/RecommendationSetup")}
          style={{
            padding: "10px 20px",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          View Recommended Policies
        </button>
      </div>
      
      </div>
    </div>
  );
}

export default Profile;
