import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isAdminError, setIsAdminError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setIsAdminError(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setIsAdminError(false);

    try {
      const params = new URLSearchParams();
      params.append("username", formData.email);
      params.append("password", formData.password);

      const response = await axios.post(
        "http://127.0.0.1:8000/auth/login",
        params,
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      localStorage.setItem("token", response.data.access_token);
    
      window.dispatchEvent(new Event("storage"));
      navigate("/profile");
      
    } catch (err) {
      const detail = err.response?.data?.detail || "";
      if (detail.includes("Admin accounts must use")) {
        setIsAdminError(true);
      } else {
        setError("Invalid email or password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2 className="auth-title">Welcome Back</h2>

        {error && <div className="auth-error">{error}</div>}

        {isAdminError && (
          <div style={{
            background: "#1e293b", color: "white", borderRadius: "10px",
            padding: "12px 16px", fontSize: "13px",
            marginBottom: "16px", textAlign: "center", lineHeight: "1.6",
          }}>
            This is an admin account. Please use the{" "}
            <a href="/admin/login" style={{ color: "#93c5fd", fontWeight: "700", textDecoration: "underline" }}>
              Admin Portal
            </a>{" "}
            to login.
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-row single">
            <input
              type="email" name="email"
              placeholder="Enter Email"
              value={formData.email}
              onChange={handleChange} required
            />
          </div>

          <div className="form-row single password-row">
            <input
              type={showPassword ? "text" : "password"}
              name="password" placeholder="Enter Password"
              value={formData.password}
              onChange={handleChange} required
            />
            <button type="button" className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? <span className="btn-spinner"></span> : "Login"}
          </button>
        </form>

        <div className="auth-footer">
          Not registered? <a href="/register">Register here</a>
        </div>
      </div>
    </div>
  );
}

export default Login;