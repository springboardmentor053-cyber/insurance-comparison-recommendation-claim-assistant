import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function AdminLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      params.append("username", formData.email);
      params.append("password", formData.password);

      const response = await axios.post(
        "http://127.0.0.1:8000/auth/admin-login",
        params,
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      // ✅ Save as admin_token — never overwrites user token
      localStorage.setItem("admin_token", response.data.access_token);
      // localStorage.removeItem("token");
      window.dispatchEvent(new Event("storage"));
      navigate("/admin");
      window.location.reload();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(detail || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "calc(100vh - 62px)",
      display: "flex", justifyContent: "center", alignItems: "center",
      background: "linear-gradient(135deg, #1e293b, #334155)",
      padding: "40px 20px", fontFamily: "'Segoe UI', sans-serif",
    }}>
      <div style={{
        background: "white", borderRadius: "18px",
        padding: "44px 48px", width: "100%", maxWidth: "420px",
        boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
      }}>

        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <span style={{
            background: "#1e293b", color: "white", fontSize: "11px",
            fontWeight: "700", padding: "5px 14px", borderRadius: "20px",
            letterSpacing: "1.5px", textTransform: "uppercase",
          }}>
            Admin Portal
          </span>
        </div>

        <div style={{ textAlign: "center", marginBottom: "10px", fontSize: "36px" }}>🛡️</div>

        <h2 style={{ textAlign: "center", fontSize: "22px", fontWeight: "700", color: "#1e293b", margin: "0 0 4px" }}>
          CoverMate Administration
        </h2>
        <p style={{ textAlign: "center", fontSize: "13px", color: "#94a3b8", margin: "0 0 28px" }}>
          Restricted access — authorized personnel only
        </p>

        {error && (
          <div style={{
            background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca",
            borderRadius: "10px", padding: "10px 14px", fontSize: "13px",
            marginBottom: "18px", textAlign: "center",
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <input
            type="email" name="email" placeholder="Admin Email"
            value={formData.email} onChange={handleChange} required
            style={{
              padding: "12px 16px", borderRadius: "10px",
              border: "1px solid #e2e8f0", fontSize: "14px",
              background: "#f8fafc", outline: "none",
              width: "100%", boxSizing: "border-box",
            }}
          />

          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <input
              type={showPassword ? "text" : "password"}
              name="password" placeholder="Admin Password"
              value={formData.password} onChange={handleChange} required
              style={{
                padding: "12px 56px 12px 16px", borderRadius: "10px",
                border: "1px solid #e2e8f0", fontSize: "14px",
                background: "#f8fafc", outline: "none",
                width: "100%", boxSizing: "border-box",
              }}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute", right: "12px", background: "none",
                border: "none", color: "#475569", fontSize: "12px",
                fontWeight: "600", cursor: "pointer",
              }}>
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button type="submit" disabled={loading}
            style={{
              marginTop: "6px", padding: "14px", border: "none", borderRadius: "12px",
              background: loading ? "#94a3b8" : "linear-gradient(135deg, #1e293b, #334155)",
              color: "white", fontWeight: "700", fontSize: "15px",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", minHeight: "50px",
            }}>
            {loading ? (
              <span style={{
                width: "18px", height: "18px",
                border: "2px solid rgba(255,255,255,0.4)",
                borderTopColor: "white", borderRadius: "50%",
                animation: "spin 0.7s linear infinite", display: "inline-block",
              }} />
            ) : "Access Dashboard"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "22px", fontSize: "13px", color: "#94a3b8" }}>
          Not an admin?{" "}
          <a href="/login" style={{ color: "#475569", fontWeight: "600", textDecoration: "none" }}>
            Go to user login
          </a>
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default AdminLogin;