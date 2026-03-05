import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/login", form);
      
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("user", JSON.stringify(res.data.user)); 
      
      navigate("/policies"); 
    } catch (err) { 
      if (err.response?.status === 422) {
        alert("Account Data Error: DOB is missing in the database. Run the SQL fix!");
      } else {
        alert("Invalid Email or Password.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e6edf5]">
      <div className="w-full max-w-sm bg-white/90 backdrop-blur-sm p-10 rounded-4xl border-2 border-yellow-400 shadow-2xl">
        <header className="mb-8 text-center">
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Covermate</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">2026 Insurance Portal</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Email</label>
            <input 
              type="email"
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-yellow-400 transition outline-none"
              placeholder="name@email.com" 
              onChange={(e)=>setForm({...form, email: e.target.value})} 
              required
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Password</label>
            <input 
              type="password"
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-yellow-400 transition outline-none"
              placeholder="••••••••" 
              onChange={(e)=>setForm({...form, password: e.target.value})} 
              required
            />
          </div>

          <button className="w-full bg-yellow-400 text-slate-900 font-black py-5 rounded-2xl hover:bg-yellow-500 transition-all uppercase tracking-widest mt-4 shadow-lg shadow-yellow-200 active:scale-95">
            Sign In
          </button>
        </form>

        <p className="mt-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
          New? <Link to="/register" className="text-yellow-600 border-b-2 border-yellow-200 ml-1">Register</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;