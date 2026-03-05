import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", dob: "",
    healthInput: "",
    lifestyleInput: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const birthDate = new Date(formData.dob);
    const age = new Date().getFullYear() - birthDate.getFullYear();
    const ageRisk = age > 50 ? "High" : age > 30 ? "Standard" : "Low";

    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      dob: formData.dob,
      risk_profile: {
        health_declarations: formData.healthInput || "None",
        lifestyle_activities: formData.lifestyleInput || "None",
        age_at_registration: age,
        level: ageRisk,
        status: "Pending Review" 
      }
    };

    try {
      await API.post("/auth/register", payload);
      alert("Registration Successful! Profile set to " + ageRisk + " risk.");
      navigate("/login");
    } catch (err) {
      alert("Registration failed. Please check your details.");
    }
  };

  return (
    <div className="min-h-screen bg-[#e6edf5] flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-white/90 backdrop-blur-sm rounded-[40px] p-12 shadow-2xl border border-slate-100">
        <header className="mb-10">
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">CREATE PROFILE</h2>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">Covermate Insurance Systems v2.6</p>
        </header>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Full Name</label>
              <input type="text" placeholder="John Doe" className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500" 
                onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Date of Birth</label>
              <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500" 
                onChange={e => setFormData({...formData, dob: e.target.value})} required />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Email</label>
            <input type="email" placeholder="name@company.com" className="w-full p-4 bg-slate-50 rounded-2xl border-none" 
              onChange={e => setFormData({...formData, email: e.target.value})} required />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Password</label>
            <input type="password" placeholder="••••••••" className="w-full p-4 bg-slate-50 rounded-2xl border-none" 
              onChange={e => setFormData({...formData, password: e.target.value})} required />
          </div>

          <hr className="border-slate-100 my-4" />

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Health Issues / Recent Accidents</label>
            <textarea 
              placeholder="E.g. Mild asthma, minor accident, or write 'None'" 
              className="w-full p-4 bg-slate-50 rounded-2xl border-none h-24 resize-none text-sm"
              onChange={e => setFormData({...formData, healthInput: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Travels / Vehicle / Lifestyle</label>
            <textarea 
              placeholder="E.g. Frequent travel, Drive SUV, Skydiver, or write 'Other/None'" 
              className="w-full p-4 bg-slate-50 rounded-2xl border-none h-24 resize-none text-sm"
              onChange={e => setFormData({...formData, lifestyleInput: e.target.value})}
            />
          </div>

          <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-blue-900/20 active:scale-[0.98]">
            Complete Registration
          </button>
        </form>
      </div>
    </div>
  );
}

export default Register;