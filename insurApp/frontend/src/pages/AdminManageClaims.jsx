import React, { useState, useEffect } from 'react';
import api from '../api';
import { ShieldCheck, XCircle, FileText, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminManageClaims = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      // Assuming GET /admin/claims returns all claims by users
      const res = await api.get('/admin/claims');
      setClaims(res.data);
    } catch (err) {
      console.error('Failed to load claims', err);
      // Mock data in case endpoint isn't fully ready yet
      setClaims([
        { id: 101, claim_number: 'CLM-2026-0001', user_id: 1, user_name: 'Jc Krishna', claim_amount: 5000, status: 'approved' },
        { id: 102, claim_number: 'CLM-2026-0002', user_id: 2, user_name: 'D Ramanan', claim_amount: 12000, status: 'under_review' },
        { id: 103, claim_number: 'CLM-2026-0003', user_id: 3, user_name: 'D Ramanan', claim_amount: 1000000, status: 'under_review' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      // Assuming changing status works like this:
      await api.put(`/admin/claims/${id}/status`, { status });
      // Update locally
      setClaims(claims.map(c => c.id === id ? { ...c, status } : c));
    } catch (err) {
      console.error('Failed to update status', err);
      // Update locally anyway for demo if backend isn't ready
      setClaims(claims.map(c => c.id === id ? { ...c, status } : c));
    }
  };

  if (loading) return <div className="p-10 text-center text-xl">Loading claims...</div>;

  return (
    <div className="max-w-7xl mx-auto py-12 px-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <FileText className="text-primary" size={32} />
            Manage <span className="gradient-text">Claims</span>
          </h1>
          <p className="text-muted">Review, accept, or reject user claims.</p>
        </div>
        <Link to="/admin" className="btn btn-secondary">
          Back to Dashboard
        </Link>
      </div>

      <div className="glass p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] text-muted text-sm uppercase tracking-wider">
                <th className="p-4 font-medium">Claim ID</th>
                <th className="p-4 font-medium">User</th>
                <th className="p-4 font-medium">Amount</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {claims.length === 0 ? (
                <tr><td colSpan="5" className="p-4 text-center text-muted">No claims found.</td></tr>
              ) : (
                claims.map(claim => (
                  <tr key={claim.id} className="border-b border-[var(--border)] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                    <td className="p-4 font-mono font-bold text-primary-glow text-sm">{claim.claim_number || claim.id}</td>
                    <td className="p-4 text-sm">{claim.user_name || `User ID: ${claim.user_id}`}</td>
                    <td className="p-4 font-bold text-emerald-400">
                      ${claim.claim_amount?.toLocaleString() || 0}
                    </td>
                    <td className="p-4">
                      <span className={`badge badge-${claim.status || 'under_review'}`}>
                        {(claim.status || 'under_review').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 flex justify-end gap-3">
                      {claim.status === 'under_review' ? (
                        <>
                          <button
                            onClick={() => handleStatusChange(claim.id, 'approved')}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                          >
                            <CheckCircle size={18} /> Accept
                          </button>
                          <button
                            onClick={() => handleStatusChange(claim.id, 'rejected')}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                          >
                            <XCircle size={18} /> Reject
                          </button>
                        </>
                      ) : (
                        <span className="text-muted text-sm italic">
                          Action taken
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminManageClaims;
