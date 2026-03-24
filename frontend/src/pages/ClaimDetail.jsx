import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';

const ClaimDetail = () => {
  const { id } = useParams();
  const [claim, setClaim] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      API.get(`/claims/${id}`),
      API.get(`/claims/${id}/documents`)
    ])
      .then(([claimRes, docsRes]) => {
        setClaim(claimRes.data);
        setDocuments(docsRes.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

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
  if (!claim) return <div className="text-center py-12">Claim not found</div>;

  return (
    <div className="max-w-3xl mx-auto px-4">
      <button onClick={() => navigate(-1)} className="mb-4 text-blue-600">← Back</button>
      <div className="bg-white rounded-3xl p-8 shadow-xl">
        <div className="flex justify-between items-start">
          <h1 className="text-3xl font-black">Claim #{claim.claim_number}</h1>
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(claim.status)}`}>
            {claim.status.replace('_', ' ')}
          </span>
        </div>
        <p className="text-slate-400 mt-1">Filed on {new Date(claim.created_at).toLocaleDateString()}</p>

        <div className="mt-6 space-y-4">
          <p><span className="font-bold">Policy:</span> {claim.user_policy?.policy?.title || claim.user_policy_id}</p>
          <p><span className="font-bold">Claim Type:</span> {claim.claim_type}</p>
          <p><span className="font-bold">Incident Date:</span> {claim.incident_date}</p>
          <p><span className="font-bold">Amount Claimed:</span> ₹{claim.amount_claimed.toLocaleString()}</p>
          <p><span className="font-bold">Description:</span> {claim.description}</p>
        </div>

        <h2 className="text-xl font-bold mt-8 mb-4">Documents</h2>
        {documents.length === 0 ? (
          <p className="text-slate-400">No documents uploaded.</p>
        ) : (
          <div className="grid gap-3">
            {documents.map(doc => (
              <a
                key={doc.id}
                href={doc.file_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3 border rounded-xl hover:bg-slate-50"
              >
                <span className="text-2xl">📄</span>
                <span className="flex-1">{doc.doc_type || 'Document'}</span>
                <span className="text-blue-600">View →</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClaimDetail;