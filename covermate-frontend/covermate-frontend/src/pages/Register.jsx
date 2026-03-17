import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    dob: "", gender: "", occupation: "", annual_income: "", phone: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordMismatch, setPasswordMismatch] = useState(false);

  const handleChange = (e) => {
    const updated = { ...formData, [e.target.name]: e.target.value };
    setFormData(updated);
    setError("");

    if (e.target.name === "confirmPassword" || e.target.name === "password") {
      const pw = e.target.name === "password" ? e.target.value : updated.password;
      const cpw = e.target.name === "confirmPassword" ? e.target.value : updated.confirmPassword;
      setPasswordMismatch(cpw.length > 0 && pw !== cpw);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      dob: formData.dob,
      gender: formData.gender,
      occupation: formData.occupation,
      annual_income: formData.annual_income,
      phone: formData.phone,
      risk_profile: null
    };

    try {
      await axios.post("http://127.0.0.1:8000/auth/register", payload);
      setSuccess("Account created successfully! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2 className="auth-title">Create Account</h2>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required />
            <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="form-row">
            <div className="password-row">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <div className="password-row">
              <input
                type={showConfirm ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                style={{ borderColor: passwordMismatch ? "#dc2626" : "" }}
              />
              <button type="button" className="toggle-password" onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {passwordMismatch && (
            <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "-10px" }}>
              Passwords do not match
            </p>
          )}

          <div className="form-row">
            <div className="input-group">
              <label className="input-label">Date of Birth</label>
              <input type="date" name="dob" value={formData.dob} onChange={handleChange} />
            </div>

            <div className="input-group">
              <label className="input-label">Gender</label>
            <select name="gender" value={formData.gender} onChange={handleChange}>
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            </div>
          </div>

          <div className="form-row">
            <input type="text" name="occupation" placeholder="Occupation" value={formData.occupation} onChange={handleChange} />
            <input type="number" name="annual_income" placeholder="Annual Income (₹)" value={formData.annual_income} onChange={handleChange} />
          </div>

          <div className="form-row single">
            <input type="text" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} />
          </div>

          <button type="submit" className="auth-button" disabled={loading || passwordMismatch}>
            {loading ? <span className="btn-spinner"></span> : "Create Account"}
          </button>
        </form>

        <div className="auth-footer">
          Already registered? <a href="/login">Login</a>
        </div>
      </div>
    </div>
  );
}

export default Register;
