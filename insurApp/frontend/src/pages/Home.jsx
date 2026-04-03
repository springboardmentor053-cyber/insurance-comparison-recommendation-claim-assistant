import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Zap, Lock, ChevronRight } from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="glass p-6 text-center">
    <div className="flex justify-center mb-4">
      <div className="p-4 rounded-full bg-indigo-500/10 text-indigo-400">
        <Icon size={32} />
      </div>
    </div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-muted">{description}</p>
  </div>
);

const Home = () => {
  return (
    <div className="max-w-7xl relative">
      {/* Hero Section */}
      <div className="text-center py-20 relative z-10">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
          Insurance Reimagined for the <br />
          <span className="gradient-text">Digital Era</span>
        </h1>
        <p className="text-xl text-muted max-w-2xl mx-auto mb-10">
          Experience lightning-fast claims, AI-curated personalized policies, and a breathtakingly smooth dashboard. It's time to upgrade your peace of mind.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to="/signup" className="btn btn-primary text-xl px-8 py-4">
            Get Started Now <ChevronRight />
          </Link>
          <Link to="/login" className="btn btn-secondary text-xl px-8 py-4">
            Login to Account
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
        <FeatureCard 
          icon={Zap} 
          title="Instant Recommendations" 
          description="Our intelligent engine analyzes your profile to suggest the perfect coverage implicitly tailored for your lifestyle." 
        />
        <FeatureCard 
          icon={ShieldAlert} 
          title="Automated Claims" 
          description="File claims in minutes not hours. Our streamlined wizard processes your details directly into our approval queue." 
        />
        <FeatureCard 
          icon={Lock} 
          title="Unbreakable Security" 
          description="Your sensitive documents and data are fortified behind advanced encryption and rigorous digital barriers." 
        />
      </div>
    </div>
  );
};

export default Home;
