import { useNavigate } from "react-router-dom";
import "../styles/Home.css";

function Home() {
  const navigate = useNavigate();

  const handleRecommendationClick = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Please login first to get recommendations");
    navigate("/login");
    return;
  }

  // navigate("/recommendation-setup");

  const savedRecommendations = localStorage.getItem("recommendations");

  if (savedRecommendations) {
    navigate("/recommendations");
  } else {
    navigate("/recommendation-setup");
  }
};

  return (
    <div className="home-container">
      
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

          {/* <button onClick={() => navigate("/recommendations")}>
            Get Recommendations
          </button> */}
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