import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Shield } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login({ email, password });
      if (user && user.is_admin) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password');
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
        <h2 className="text-3xl font-bold text-center mb-6">Welcome Back</h2>
        
        {error && <div className="p-3 mb-4 rounded bg-red-500/10 border border-red-500/50 text-red-400 text-sm">{error}</div>}
        
        <form onSubmit={handleSubmit} className="flex-col gap-4 flex cursor-pointer">
          <div className="flex-col flex gap-2">
            <label className="text-sm font-medium text-muted">Email address</label>
            <input 
              type="email" 
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex-col flex gap-2">
            <label className="text-sm font-medium text-muted">Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary w-full mt-4">
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-6 text-muted">
          Don't have an account? <Link to="/signup" className="text-primary-glow font-medium hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
