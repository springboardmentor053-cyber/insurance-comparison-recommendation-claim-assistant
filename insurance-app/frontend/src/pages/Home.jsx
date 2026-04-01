import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="flex flex-col items-center py-20 animate-fade-in">
      {/* Hero Section */}
      <div className="relative w-full max-w-5xl mx-auto text-center mb-24 px-6">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl -z-10 animate-pulse"></div>
        <div className="absolute top-0 -right-20 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl -z-10 animate-pulse delay-700"></div>
        
        <h1 className="text-6xl md:text-7xl font-extrabold text-slate-900 leading-tight mb-8">
          The Smarter Way to <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">Secure Your Future</span>
        </h1>
        
        <p className="text-xl text-slate-500 max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
          Leverage AI-driven insights to compare policies, get tailored recommendations, 
          and file claims with unprecedented ease. Your peace of mind, automated.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-5 justify-center">
          <Link to="/policies" className="btn-secondary group">
            Browse Policies
            <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
          </Link>
          <Link to="/login?signup=true" className="btn-primary">
            Get Started Now
          </Link>
        </div>
      </div>

      {/* Feature grid */}
      <div className="grid md:grid-cols-3 gap-8 w-full max-w-7xl px-6">
        <div className="card-premium group">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-transform">📊</div>
          <h3 className="text-2xl font-bold mb-4 text-slate-900">Compare Easily</h3>
          <p className="text-slate-500 leading-relaxed font-medium">View side-by-side comparisons of auto, health, life, and home policies from top-tier providers.</p>
        </div>
        
        <div className="card-premium group">
          <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-transform">✨</div>
          <h3 className="text-2xl font-bold mb-4 text-slate-900">AI Recommendations</h3>
          <p className="text-slate-500 leading-relaxed font-medium">Our neural engine analyzes your profile and budget to suggest the absolute best coverage options.</p>
        </div>
        
        <div className="card-premium group">
          <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-transform">🤖</div>
          <h3 className="text-2xl font-bold mb-4 text-slate-900">Claims Assistant</h3>
          <p className="text-slate-500 leading-relaxed font-medium">Filing a claim? Our intelligent chatbot guides you through every step for instant approval.</p>
        </div>
      </div>
      
      {/* Trust section */}
      <div className="mt-32 text-center">
        <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-8">Trusted by industry leaders</p>
        <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale">
          <span className="text-2xl font-black text-slate-900 italic">SECUREWAY</span>
          <span className="text-2xl font-black text-slate-900 italic">INSUREPRO</span>
          <span className="text-2xl font-black text-slate-900 italic">SAFEHAVEN</span>
          <span className="text-2xl font-black text-slate-900 italic">GUARDIAN</span>
        </div>
      </div>
    </div>
  );
}

export default Home;
