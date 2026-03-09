import { BrowserRouter, Routes, Route } from "react-router-dom"; 
import Navbar from "./components/navbar";
import PolicyList from "./pages/PolicyList";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Recommendation from "./pages/Recommendation";
import Home from "./pages/Home";
import RecommendationSetup from "./pages/RecommendationSetup";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/policies" element={<PolicyList />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/recommendationSetup" element={<RecommendationSetup />} />
        <Route path="/recommendations" element={<Recommendation />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
