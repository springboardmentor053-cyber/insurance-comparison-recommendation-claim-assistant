import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

const MyPolicies = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      const res = await API.get('/claims/my-policies');
      setPolicies(res.data);
    } catch (err) {
      console.error('Failed to load policies', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-600';
      case 'expired': return 'bg-slate-100 text-slate-600';
      case 'cancelled': return 'bg-red-100 text-red-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      <h1 className="text-3xl font-black text-slate-900 mb-8">My Policies</h1>
      {policies.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl">
          <p className="text-slate-400 mb-4">You haven't purchased any policies yet.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold"
          >
            Browse Policies
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {policies.map(policy => (
            <div
              key={policy.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(policy.status)}`}>
                    {policy.status}
                  </span>
                  <h3 className="text-xl font-black mt-2">{policy.policy.title}</h3>
                  <p className="text-sm text-slate-400">{policy.policy.provider_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400">Policy #</p>
                  <p className="font-mono text-sm">{policy.policy_number}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Start Date</p>
                  <p className="font-bold">{new Date(policy.start_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-slate-400">End Date</p>
                  <p className="font-bold">{new Date(policy.end_date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => {
                    localStorage.setItem('claimPolicyId', policy.policy.id);
                    navigate('/claims/new');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold"
                >
                  File Claim
                </button>
                <button
                  onClick={() => navigate(`/policies/${policy.policy.id}`)}
                  className="px-4 py-2 bg-slate-100 rounded-xl text-sm font-bold"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyPolicies;