import { useState, useEffect } from 'react';
import API from '../api';

const FraudAlertModal = ({ claimId, isOpen, onClose }) => {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && claimId) {
      setLoading(true);
      API.get(`/admin/claims/${claimId}/fraud-flags`)
        .then(res => setFlags(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [claimId, isOpen]);

  if (!isOpen) return null;

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-black">Fraud Alerts Detected</h2>
          <button onClick={onClose} className="text-3xl text-slate-400 hover:text-slate-600">&times;</button>
        </div>
        {loading ? (
          <p className="text-center py-4">Loading alerts...</p>
        ) : flags.length === 0 ? (
          <p className="text-center text-green-600 py-4">No fraud flags for this claim.</p>
        ) : (
          <div className="space-y-4">
            {flags.map(flag => (
              <div key={flag.id} className="border-l-4 border-red-500 pl-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getSeverityIcon(flag.severity)}</span>
                  <span className="font-black">{flag.rule_code}</span>
                  <span className="text-xs text-slate-400">({flag.severity})</span>
                </div>
                <p className="text-sm text-slate-600 mt-1">{flag.details}</p>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={onClose}
          className="mt-6 w-full bg-slate-100 py-2 rounded-xl font-bold"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default FraudAlertModal;