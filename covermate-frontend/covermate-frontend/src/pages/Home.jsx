import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";

function Home() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState("");

  const handleRecommendationClick = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setMsg("Please login first to get recommendations.");
      setTimeout(() => setMsg(""), 3000);
      return;
    }

  const savedRecommendations = localStorage.getItem("recommendations");

  if (savedRecommendations) {
    navigate("/recommendations");
  } else {
    navigate("/recommendation-setup");
  }
};

  return (
    <div className="home-container">

      {msg && (
        <div style={{
          maxWidth: "460px",
          margin: "0 auto 20px",
          padding: "12px 16px",
          borderRadius: "10px",
          textAlign: "center",
          fontSize: "14px",
          fontWeight: "500",
          background: "#fef2f2",
          color: "#b91c1c",
          border: "1px solid #fecaca",
        }}>
          {msg}
        </div>
      )}

      {/* Hero Section */}
      <div className="hero">
        <h1>Secure Your Future Today</h1>
        <p>
          Get personalized insurance recommendations, compare policies easily,
and make smarter financial decisions.
        </p>
        <div className="hero-buttons">
          <button onClick={() => navigate("/policies")}>
            Browse Policies
          </button>

          <button onClick={handleRecommendationClick}>
      Get Recommendations
    </button>

        </div>
      </div>

      {/* Features Section */}
      <div className="features">
        <div className="feature-card">
          <div className="feature-icon">🧠</div>
          <h3>Smart Policy Recommendations</h3>
          <p>Get insurance policies tailored to your
      risk profile and personal preferences.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">⚖️</div>
          <h3>Compare Policies Instantly</h3>
          <p>View two policies side-by-side and
      choose the best value for your needs.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🎯</div>
          <h3>Personalized Insurance Planning</h3>
          <p> Find policies based on your age,
      lifestyle and financial goals.</p>
        </div>
      </div>
    </div>
  );
}

export default Home;