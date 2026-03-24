import { useState, useEffect } from 'react';
import API from '../api';

const AdminClaims = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadClaims = async () => {
      try {
        const res = await API.get('/admin/claims');
        setClaims(res.data);
      } catch (err) {
        console.error('Failed to load claims', err);
      } finally {
        setLoading(false);
      }
    };
    loadClaims();
  }, []);

  const updateStatus = async (claimId, newStatus) => {
    try {
      await API.put(`/admin/claims/${claimId}/status?status=${newStatus}`);
      alert(`Status updated to ${newStatus}`);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
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

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4">
      <h1 className="text-3xl font-black mb-8">All Claims (Admin)</h1>
      <div className="space-y-4">
        {claims.map(claim => (
          <div key={claim.id} className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className="flex justify-between items-start">
              <div>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(claim.status)}`}>
                  {claim.status.replace('_', ' ')}
                </span>
                <h3 className="text-xl font-black mt-2">Claim #{claim.claim_number}</h3>
                <p className="text-sm text-slate-400">
                  Filed by {claim.user_policy?.user?.name || 'Unknown'} ({claim.user_policy?.user?.email || 'No email'})
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">Amount</p>
                <p className="text-2xl font-black text-blue-600">₹{claim.amount_claimed.toLocaleString()}</p>
              </div>
            </div>
            <p className="text-slate-600 mt-2">{claim.description}</p>

            {/* Documents section */}
            <div className="mt-4">
              <h4 className="font-bold text-slate-700 mb-2">Documents</h4>
              {claim.documents && claim.documents.length > 0 ? (
                <div className="grid gap-2">
                  {claim.documents.map(doc => (
                    <a
                      key={doc.id}
                      href={doc.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    >
                      <span>📄</span> {doc.doc_type || 'Document'} – View
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No documents uploaded.</p>
              )}
            </div>

            {/* Status buttons */}
            <div className="mt-4 flex gap-3">
              <button onClick={() => updateStatus(claim.id, 'under_review')} className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-sm">Under Review</button>
              <button onClick={() => updateStatus(claim.id, 'approved')} className="px-3 py-1 bg-green-100 text-green-600 rounded-lg text-sm">Approve</button>
              <button onClick={() => updateStatus(claim.id, 'rejected')} className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-sm">Reject</button>
              <button onClick={() => updateStatus(claim.id, 'paid')} className="px-3 py-1 bg-purple-100 text-purple-600 rounded-lg text-sm">Mark Paid</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminClaims;