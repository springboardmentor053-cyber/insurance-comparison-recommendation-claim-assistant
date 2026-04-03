import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';
import PremiumCalculator from '../components/PremiumCalculator';

const PolicyDetail = () => {
  const { id } = useParams();
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({ dob: "1996-01-01", risk_profile: {} });
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));

    API.get(`/policies/${id}`)
      .then(res => setPolicy(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (!policy) return <div className="text-center py-12">Policy not found</div>;

  return (
    <div className="max-w-3xl mx-auto px-4">
      <button onClick={() => navigate(-1)} className="mb-4 text-blue-600">← Back</button>
      <div className="bg-white rounded-3xl p-8 shadow-xl">
        <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-600 uppercase">
          {policy.policy_type}
        </span>
        <h1 className="text-3xl font-black mt-2">{policy.title}</h1>
        <p className="text-sm text-slate-400">{policy.provider_name}</p>
        <p className="text-slate-500 mt-4">{policy.description}</p>

        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-slate-400">Premium:</span> <span className="font-bold">₹{policy.premium.toLocaleString()}/year</span></div>
          <div><span className="text-slate-400">Deductible:</span> <span className="font-bold">₹{policy.deductible.toLocaleString()}</span></div>
          <div><span className="text-slate-400">Term:</span> <span className="font-bold">{policy.term_months} months</span></div>
        </div>

        <div className="mt-8">
          <PremiumCalculator
            basePremium={policy.premium}
            userDob={user.dob}
            userRiskProfile={user.risk_profile}
            policyType={policy.policy_type}
          />
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={() => {
              localStorage.setItem('claimPolicyId', policy.id);
              navigate('/claims/new');
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold"
          >
            File a Claim
          </button>
        </div>
      </div>
    </div>
  );
};

export default PolicyDetail;