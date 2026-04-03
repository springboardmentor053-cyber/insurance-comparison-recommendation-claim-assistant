import { useState, useEffect } from 'react';
import API from '../api';
import FraudAlertModal from '../components/FraudAlertModal';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [allClaims, setAllClaims] = useState([]);
  const [filteredClaims, setFilteredClaims] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedClaimId, setSelectedClaimId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, claimsRes] = await Promise.all([
          API.get('/admin/dashboard'),
          API.get('/admin/claims')
        ]);
        setStats(statsRes.data);
        setAllClaims(claimsRes.data);
        setFilteredClaims(claimsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter claims when status or search changes
  useEffect(() => {
    let filtered = [...allClaims];
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(c => c.status === selectedStatus);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.claim_number.toLowerCase().includes(term) ||
        c.user_policy?.user?.name?.toLowerCase().includes(term) ||
        c.user_policy?.user?.email?.toLowerCase().includes(term)
      );
    }
    setFilteredClaims(filtered);
  }, [selectedStatus, searchTerm, allClaims]);

  const updateStatus = async (claimId, newStatus) => {
    try {
      await API.put(`/admin/claims/${claimId}/status?status=${newStatus}`);
      // Reload claims to reflect change
      const claimsRes = await API.get('/admin/claims');
      setAllClaims(claimsRes.data);
      alert(`Claim status updated to ${newStatus}`);
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };
const exportClaims = async () => {
  try {
    const response = await API.get('/admin/export/claims', {
      responseType: 'blob'  // important for file download
    });
    // Create a blob URL and trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'claims.csv';
    if (contentDisposition) {
      const match = contentDisposition.match(/filename=(.+)/);
      if (match && match[1]) filename = match[1];
    }
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Export failed', err);
    alert('Failed to export claims. Check console for details.');
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

  const getFraudCount = (claim) => claim.fraud_flags?.length || 0;
  const hasFraud = (claim) => getFraudCount(claim) > 0;

  const openFraudModal = (claimId) => {
    setSelectedClaimId(claimId);
    setModalOpen(true);
  };

  if (loading) return <div className="text-center py-12">Loading dashboard...</div>;

  const statusTabs = [
    { value: 'all', label: 'All', count: allClaims.length },
    { value: 'draft', label: 'Draft', count: allClaims.filter(c => c.status === 'draft').length },
    { value: 'submitted', label: 'Submitted', count: allClaims.filter(c => c.status === 'submitted').length },
    { value: 'under_review', label: 'Under Review', count: allClaims.filter(c => c.status === 'under_review').length },
    { value: 'approved', label: 'Approved', count: allClaims.filter(c => c.status === 'approved').length },
    { value: 'rejected', label: 'Rejected', count: allClaims.filter(c => c.status === 'rejected').length },
    { value: 'paid', label: 'Paid', count: allClaims.filter(c => c.status === 'paid').length },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black">Admin Dashboard</h1>
        <button
          onClick={exportClaims}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow hover:bg-blue-700"
        >
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-400">Total Claims</p>
          <p className="text-2xl font-black">{stats?.total_claims || 0}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-400">Flagged Claims</p>
          <p className="text-2xl font-black text-red-600">{stats?.flagged_claims || 0}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-400">Approved</p>
          <p className="text-2xl font-black text-green-600">{stats?.approved_claims || 0}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-400">Rejected</p>
          <p className="text-2xl font-black text-red-500">{stats?.rejected_claims || 0}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-400">Under Review</p>
          <p className="text-2xl font-black text-blue-600">{stats?.under_review || 0}</p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 pb-2">
        {statusTabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setSelectedStatus(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
              selectedStatus === tab.value
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by claim number, user name, or email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full max-w-md p-3 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Claims Table */}
      <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Claim #</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Claimant</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Policy</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Fraud Flags</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredClaims.map(claim => (
              <tr key={claim.id} className="hover:bg-slate-50 transition">
                <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{claim.claim_number}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium">{claim.user_policy?.user?.name || 'Unknown'}</div>
                  <div className="text-sm text-slate-400">{claim.user_policy?.user?.email || ''}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{claim.user_policy?.policy?.title || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">₹{claim.amount_claimed.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(claim.status)}`}>
                    {claim.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {hasFraud(claim) ? (
                    <button
                      onClick={() => openFraudModal(claim.id)}
                      className="text-red-600 hover:text-red-800 font-bold flex items-center gap-1"
                    >
                      <span>⚠️</span> {getFraudCount(claim)} alert(s)
                    </button>
                  ) : (
                    <span className="text-green-600">✓ Clean</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                  {new Date(claim.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={claim.status}
                    onChange={e => updateStatus(claim.id, e.target.value)}
                    className="text-sm border rounded-lg p-1 bg-white focus:ring-1 focus:ring-blue-400"
                  >
                    <option value="draft">Draft</option>
                    <option value="submitted">Submitted</option>
                    <option value="under_review">Under Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="paid">Paid</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredClaims.length === 0 && (
          <div className="text-center py-12 text-slate-400">No claims match the filter.</div>
        )}
      </div>

      {/* Fraud Alert Modal */}
      <FraudAlertModal
        claimId={selectedClaimId}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};

export default AdminDashboard;