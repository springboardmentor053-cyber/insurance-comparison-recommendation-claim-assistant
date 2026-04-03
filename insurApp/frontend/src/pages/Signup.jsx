import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Shield } from 'lucide-react';

const Signup = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass p-8 max-w-md w-full">
        <div className="flex justify-center mb-6">
          <Shield size={48} className="text-primary" />
        </div>
        <h2 className="text-3xl font-bold text-center mb-6">Create Account</h2>
        
        {error && <div className="p-3 mb-4 rounded bg-red-500/10 border border-red-500/50 text-red-400 text-sm">{error}</div>}
        
        <form onSubmit={handleSubmit} className="flex-col flex gap-4">
          <div className="flex-col flex gap-2">
            <label className="text-sm font-medium text-muted">Full Name</label>
            <input 
              name="full_name"
              type="text" 
              placeholder="John Doe"
              value={formData.full_name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="flex-col flex gap-2">
            <label className="text-sm font-medium text-muted">Email address</label>
            <input 
              name="email"
              type="email" 
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="flex-col flex gap-2">
            <label className="text-sm font-medium text-muted">Phone Number</label>
            <input 
              name="phone"
              type="tel" 
              placeholder="+1 234 567 8900"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
          <div className="flex-col flex gap-2">
            <label className="text-sm font-medium text-muted">Password</label>
            <input 
              name="password"
              type="password" 
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary w-full mt-4">
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center mt-6 text-muted">
          Already have an account? <Link to="/login" className="text-primary-glow font-medium hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
