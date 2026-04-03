import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

const MyClaims = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadClaims();
  }, []);

  const loadClaims = async () => {
    try {
      const res = await API.get('/claims');
      setClaims(res.data);
    } catch (err) {
      console.error('Failed to load claims', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-slate-100 text-slate-600';
      case 'submitted': return 'bg-yellow-100 text-yellow-600';
      case 'under_review': return 'bg-blue-100 text-blue-600';
      case 'approved': return 'bg-green-100 text-green-600';
      case 'rejected': return 'bg-red-100 text-red-600';
      case 'paid': return 'bg-purple-100 text-purple-600';
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
      <h1 className="text-3xl font-black text-slate-900 mb-8">My Claims</h1>
      {claims.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl">
          <p className="text-slate-400">You haven't filed any claims yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map(claim => (
            <div
              key={claim.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition cursor-pointer"
              onClick={() => navigate(`/claims/${claim.id}`)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(claim.status)}`}>
                    {claim.status.replace('_', ' ')}
                  </span>
                  <h3 className="text-xl font-black mt-2">Claim #{claim.claim_number}</h3>
                  <p className="text-sm text-slate-400">{new Date(claim.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400">Amount</p>
                  <p className="text-2xl font-black text-blue-600">₹{claim.amount_claimed.toLocaleString()}</p>
                </div>
              </div>
              <p className="text-slate-600 mt-2">{claim.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyClaims;