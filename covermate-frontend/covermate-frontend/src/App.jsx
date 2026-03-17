import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar";
import PolicyList from "./pages/PolicyList";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Recommendation from "./pages/Recommendation";
import Home from "./pages/Home";
import RecommendationSetup from "./pages/RecommendationSetup";
import MyPolicies from "./pages/MyPolicies";
import ClaimForm from "./pages/ClaimForm";
import ClaimStatus from "./pages/ClaimStatus";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* ── User routes ── */}
        <Route path="/" element={<Home />} />
        <Route path="/policies" element={<PolicyList />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/recommendationSetup" element={<RecommendationSetup />} />
        <Route path="/recommendations" element={<Recommendation />} />
        <Route path="/my-policies" element={<MyPolicies />} />
        <Route path="/claim/:userPolicyId" element={<ClaimForm />} />
        <Route path="/claim-status/:userPolicyId" element={<ClaimStatus />} />

        {/* ── Admin routes ── */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;