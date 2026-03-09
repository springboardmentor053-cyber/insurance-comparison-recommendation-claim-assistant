import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", confirmPassword: "", dob: "", gender: "",
    occupation: "", annual_income: "", phone: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) { alert("Passwords do not match"); return; }

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
      alert("Registration successful!");
      navigate("/login");
    } catch (error) {
      console.log(error.response?.data); 
      alert("Registration failed");
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2 className="auth-title">Create Account</h2>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required />
            <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="form-row">
            <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
            <input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required />
          </div>
          <div className="form-row">
            <input type="date" name="dob" value={formData.dob} onChange={handleChange} />
            <select name="gender" value={formData.gender} onChange={handleChange}>
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div className="form-row">
            <input type="text" name="occupation" placeholder="Occupation" value={formData.occupation} onChange={handleChange} />
            <input type="number" name="annual_income" placeholder="Annual Income" value={formData.annual_income} onChange={handleChange} />
          </div>
          <div className="form-row single">
            <input type="text" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} />
          </div>
          <button type="submit" className="auth-button">Register</button>
        </form>
        <div className="auth-footer">
          Already registered? <a href="/login">Login</a>
        </div>
      </div>
    </div>
  );
}

export default Register;
