import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Mono:wght@400;500&display=swap');`;

const styles = `
  ${FONTS}

  .fcwiz__root *, .fcwiz__root *::before, .fcwiz__root *::after {
    box-sizing: border-box; margin: 0; padding: 0;
  }

  .fcwiz__root {
    font-family: 'DM Sans', sans-serif !important;
    min-height: 100vh;
    background: #07090f !important;
    color: #f0f4ff !important;
    padding: 48px 24px 100px;
    position: relative;
    overflow-x: hidden;
  }

  .fcwiz__bg {
    position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden;
  }

  .fcwiz__bg::before {
    content: '';
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
    background-size: 56px 56px;
  }

  .fcwiz__orb {
    position: absolute; top: -220px; right: -150px;
    width: 620px; height: 620px; border-radius: 50%;
    background: radial-gradient(circle at center, rgba(232,160,32,0.06) 0%, transparent 65%);
  }

  .fcwiz__wrap {
    position: relative; z-index: 1;
    max-width: 600px; margin: 0 auto;
  }

  .fcwiz__back {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 8px 14px; margin-bottom: 32px;
    background: transparent;
    border: 1px solid rgba(255,255,255,0.08) !important;
    border-radius: 8px;
    color: #7a8899 !important; font-family: 'DM Sans', sans-serif !important;
    font-size: 13px; font-weight: 500;
    cursor: pointer; transition: all 0.2s;
  }
  .fcwiz__back:hover { border-color: rgba(255,255,255,0.14) !important; color: #f0f4ff !important; }

  .fcwiz__tag {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 5px 13px; margin-bottom: 14px;
    background: rgba(232,160,32,0.1);
    border: 1px solid rgba(232,160,32,0.22);
    border-radius: 6px;
    font-size: 10px; font-weight: 600; letter-spacing: 0.12em;
    text-transform: uppercase; color: #e8a020;
  }

  .fcwiz__h1 {
    font-size: 28px; font-weight: 700;
    letter-spacing: -0.03em; color: #f0f4ff !important;
    margin-bottom: 8px; line-height: 1.15;
  }

  .fcwiz__lead { font-size: 13.5px; color: #7a8899; margin-bottom: 32px; line-height: 1.6; }

  .fcwiz__stepper {
    display: flex; align-items: center;
    gap: 0; margin-bottom: 32px;
    padding: 18px 22px;
    background: #0d1117;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px;
  }

  .fcwiz__step { display: flex; flex-direction: column; align-items: center; gap: 7px; flex-shrink: 0; }

  .fcwiz__node {
    width: 34px; height: 34px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-family: 'DM Mono', monospace !important;
    font-size: 13px; font-weight: 500;
    border: 1.5px solid rgba(255,255,255,0.07);
    background: #07090f; color: #3d4d5c;
    transition: all 0.3s;
  }
  .fcwiz__node--active { border-color: #e8a020 !important; background: rgba(232,160,32,0.1) !important; color: #e8a020 !important; box-shadow: 0 0 18px rgba(232,160,32,0.22); }
  .fcwiz__node--done   { border-color: #6d7ff5 !important; background: rgba(109,127,245,0.1) !important; color: #6d7ff5 !important; }

  .fcwiz__steplabel { font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.09em; color: #3d4d5c; text-align: center; }
  .fcwiz__steplabel--active { color: #e8a020 !important; }
  .fcwiz__steplabel--done   { color: #6d7ff5 !important; }

  .fcwiz__rail { flex: 1; height: 1px; min-width: 24px; background: rgba(255,255,255,0.07); margin-bottom: 22px; transition: background 0.3s; }
  .fcwiz__rail--done { background: rgba(109,127,245,0.35) !important; }

  .fcwiz__card {
    background: #0d1117;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px; padding: 30px 32px;
    animation: fcwiz_rise 0.32s cubic-bezier(.2,.8,.4,1) both;
  }

  @keyframes fcwiz_rise {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .fcwiz__cardh   { font-size: 16px; font-weight: 700; color: #f0f4ff !important; margin-bottom: 5px; }
  .fcwiz__cardsub { font-size: 12.5px; color: #7a8899; margin-bottom: 26px; line-height: 1.6; }

  .fcwiz__field { margin-bottom: 18px; }

  .fcwiz__label {
    display: block; font-size: 11px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.1em; color: #3d4d5c; margin-bottom: 8px;
  }

  .fcwiz__select, .fcwiz__input {
    width: 100%; padding: 12px 15px;
    background: #07090f !important;
    border: 1px solid rgba(255,255,255,0.07) !important;
    border-radius: 10px;
    color: #f0f4ff !important; font-family: 'DM Sans', sans-serif !important;
    font-size: 14px; outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    -webkit-appearance: none; appearance: none;
  }
  .fcwiz__select:focus, .fcwiz__input:focus {
    border-color: rgba(232,160,32,0.35) !important;
    box-shadow: 0 0 0 3px rgba(232,160,32,0.07);
  }
  .fcwiz__select option { background: #0d1117 !important; color: #f0f4ff !important; }

  .fcwiz__preview {
    padding: 13px 16px; margin-bottom: 4px;
    background: rgba(109,127,245,0.08);
    border: 1px solid rgba(109,127,245,0.18);
    border-radius: 10px;
    font-size: 13px; color: #7a8899; line-height: 1.7;
  }

  /* DROP ZONE */
  .fcwiz__dropzone {
    border: 1.5px dashed rgba(109,127,245,0.2);
    border-radius: 14px; padding: 36px 24px;
    text-align: center; cursor: pointer;
    transition: all 0.2s;
    background: rgba(109,127,245,0.03); margin-bottom: 18px;
  }
  .fcwiz__dropzone:hover { border-color: rgba(232,160,32,0.35); background: rgba(232,160,32,0.04); }

  .fcwiz__dzicon {
    width: 48px; height: 48px; border-radius: 12px;
    background: #131920; border: 1px solid rgba(255,255,255,0.07);
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; margin: 0 auto 14px;
  }
  .fcwiz__dztitle { font-size: 15px; font-weight: 600; color: #f0f4ff; margin-bottom: 5px; }
  .fcwiz__dzhint  { font-size: 12px; color: #3d4d5c; }
  .fcwiz__dzhint span { color: #e8a020; font-weight: 600; }

  /* FILE LIST */
  .fcwiz__filelist { display: flex; flex-direction: column; gap: 9px; margin-bottom: 18px; }

  .fcwiz__filerow {
    display: flex; align-items: center; gap: 11px;
    padding: 11px 14px; background: #07090f;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 10px; transition: border-color 0.2s;
    flex-wrap: wrap;
  }
  .fcwiz__filerow:hover { border-color: rgba(255,255,255,0.13); }

  .fcwiz__filethumb {
    width: 34px; height: 34px; border-radius: 8px;
    background: rgba(109,127,245,0.1); border: 1px solid rgba(109,127,245,0.15);
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; flex-shrink: 0;
  }

  .fcwiz__filename { flex: 1; font-size: 13px; font-weight: 500; color: #f0f4ff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
  .fcwiz__filesz   { font-size: 11px; color: #3d4d5c; flex-shrink: 0; }
  .fcwiz__filest   { font-size: 11px; font-weight: 700; flex-shrink: 0; }
  .fcwiz__filest--uploading { color: #e8a020; }
  .fcwiz__filest--done      { color: #3ecf8e; }
  .fcwiz__filest--error     { color: #f06060; }

  /* doc type selector inside file row */
  .fcwiz__doctype {
    padding: 5px 9px;
    background: #0d1117;
    border: 1px solid rgba(255,255,255,0.09) !important;
    border-radius: 7px;
    color: #94a3b8 !important; font-family: 'DM Sans', sans-serif !important;
    font-size: 11px; outline: none; cursor: pointer;
    -webkit-appearance: none; appearance: none;
    flex-shrink: 0;
  }
  .fcwiz__doctype:focus { border-color: rgba(232,160,32,0.3) !important; }
  .fcwiz__doctype option { background: #0d1117; }

  .fcwiz__filebtn {
    background: transparent; border: none;
    cursor: pointer; padding: 4px 6px; border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s;
  }
  .fcwiz__filebtn--view { color: #6d7ff5; }
  .fcwiz__filebtn--view:hover { background: rgba(109,127,245,0.12); }
  .fcwiz__filebtn--rm   { color: #3d4d5c; font-size: 15px; }
  .fcwiz__filebtn--rm:hover { color: #f06060; background: rgba(240,96,96,0.08); }

  /* upload btn inside row */
  .fcwiz__filebtn--upload {
    font-size: 11px; font-weight: 700; color: #e8a020;
    background: rgba(232,160,32,0.08);
    border: 1px solid rgba(232,160,32,0.2) !important;
    border-radius: 7px; padding: 5px 10px;
    cursor: pointer; transition: all 0.2s; white-space: nowrap;
    font-family: 'DM Sans', sans-serif;
  }
  .fcwiz__filebtn--upload:hover { background: rgba(232,160,32,0.15); }
  .fcwiz__filebtn--upload:disabled { opacity: 0.4; cursor: not-allowed; }

  /* REVIEW */
  .fcwiz__reviewrow {
    display: flex; justify-content: space-between; align-items: center;
    padding: 13px 0; border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .fcwiz__reviewrow:last-child { border-bottom: none; }
  .fcwiz__rk { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #3d4d5c; }
  .fcwiz__rv { font-family: 'DM Mono', monospace !important; font-size: 13px; font-weight: 500; color: #f0f4ff; text-align: right; }

  .fcwiz__warn {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 13px 16px; margin-top: 20px;
    background: rgba(232,160,32,0.07);
    border: 1px solid rgba(232,160,32,0.18);
    border-radius: 10px;
    font-size: 12.5px; color: rgba(232,160,32,0.85); line-height: 1.6;
  }

  .fcwiz__btns { display: flex; gap: 10px; margin-top: 26px; }

  .fcwiz__btnback {
    flex: 1; padding: 13px; background: transparent;
    border: 1px solid rgba(255,255,255,0.07) !important;
    border-radius: 10px; color: #7a8899 !important;
    font-family: 'DM Sans', sans-serif !important; font-size: 14px; font-weight: 600;
    cursor: pointer; transition: all 0.2s;
  }
  .fcwiz__btnback:hover { border-color: rgba(255,255,255,0.14) !important; color: #f0f4ff !important; }

  .fcwiz__btnnext {
    flex: 2; padding: 13px;
    background: #e8a020 !important; border: none !important; border-radius: 10px;
    color: #1a0e00 !important;
    font-family: 'DM Sans', sans-serif !important; font-size: 14px; font-weight: 700;
    cursor: pointer; transition: transform 0.18s, box-shadow 0.18s, filter 0.18s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    box-shadow: 0 4px 20px rgba(232,160,32,0.25);
  }
  .fcwiz__btnnext:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(232,160,32,0.35); filter: brightness(1.05); }
  .fcwiz__btnnext:disabled { opacity: 0.4 !important; cursor: not-allowed; transform: none !important; box-shadow: none !important; }

  .fcwiz__btnsubmit {
    flex: 2; padding: 13px;
    background: linear-gradient(135deg, #2cbb78, #1ea666) !important;
    border: none !important; border-radius: 10px; color: #fff !important;
    font-family: 'DM Sans', sans-serif !important; font-size: 14px; font-weight: 700;
    cursor: pointer; transition: all 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    box-shadow: 0 4px 20px rgba(44,187,120,0.25);
  }
  .fcwiz__btnsubmit:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-1px); box-shadow: 0 8px 28px rgba(44,187,120,0.32); }
  .fcwiz__btnsubmit:disabled { opacity: 0.4 !important; cursor: not-allowed; }

  .fcwiz__success {
    text-align: center; padding: 52px 32px;
    background: #0d1117;
    border: 1px solid rgba(62,207,142,0.2);
    border-radius: 18px;
    animation: fcwiz_rise 0.4s ease both;
  }
  .fcwiz__successring {
    width: 72px; height: 72px; border-radius: 50%;
    background: rgba(62,207,142,0.1); border: 1.5px solid rgba(62,207,142,0.3);
    display: flex; align-items: center; justify-content: center;
    font-size: 30px; margin: 0 auto 24px; color: #3ecf8e;
  }
  .fcwiz__successh  { font-size: 23px; font-weight: 700; color: #3ecf8e !important; letter-spacing: -0.02em; margin-bottom: 10px; }
  .fcwiz__successp  { font-size: 14px; color: #7a8899; margin-bottom: 10px; line-height: 1.7; }
  .fcwiz__successnum {
    font-family: 'DM Mono', monospace !important;
    font-size: 15px; font-weight: 500; color: #f0f4ff !important;
    background: #07090f; border: 1px solid rgba(255,255,255,0.07);
    border-radius: 8px; padding: 10px 20px;
    display: inline-block; margin: 14px 0 28px; letter-spacing: 0.03em;
  }
  .fcwiz__successbtn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 22px;
    background: rgba(109,127,245,0.1);
    border: 1px solid rgba(109,127,245,0.25) !important;
    border-radius: 10px; color: #6d7ff5 !important;
    font-family: 'DM Sans', sans-serif !important; font-size: 14px; font-weight: 700;
    cursor: pointer; transition: all 0.2s;
  }
  .fcwiz__successbtn:hover { background: rgba(109,127,245,0.18); border-color: rgba(109,127,245,0.45) !important; transform: translateY(-1px); }

  .fcwiz__toast {
    position: fixed; top: 24px; right: 24px; z-index: 9999;
    padding: 12px 18px; border-radius: 10px;
    display: flex; align-items: center; gap: 10px;
    font-size: 13.5px; font-weight: 500; font-family: 'DM Sans', sans-serif !important;
    animation: fcwiz_toastin 0.28s ease;
    box-shadow: 0 16px 40px rgba(0,0,0,0.5);
  }
  .fcwiz__toast--error   { background: rgba(240,96,96,0.12);   border: 1px solid rgba(240,96,96,0.28) !important;   color: #f06060 !important; }
  .fcwiz__toast--success { background: rgba(62,207,142,0.1);   border: 1px solid rgba(62,207,142,0.28) !important;  color: #3ecf8e !important; }

  @keyframes fcwiz_toastin {
    from { opacity: 0; transform: translateX(16px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  .fcwiz__spin { animation: fcwiz_spin 0.8s linear infinite; display: inline-block; }
  @keyframes fcwiz_spin { to { transform: rotate(360deg); } }

  @media (max-width: 540px) {
    .fcwiz__card { padding: 22px 20px; }
    .fcwiz__h1   { font-size: 22px; }
  }
`;

// ── doc type options (matches your backend's allowed types) ────────────────
const DOC_TYPE_OPTIONS = [
  { value: 'accident_photo',  label: '📸 Accident Photo'   },
  { value: 'police_report',   label: '🚔 Police Report'    },
  { value: 'repair_bill',     label: '🧾 Repair Bill'      },
  { value: 'medical_report',  label: '🏥 Medical Report'   },
  { value: 'driving_licence', label: '🪪 Driving Licence'  },
  { value: 'invoice',         label: '📋 Invoice'          },
  { value: 'other',           label: '📎 Other'            },
];

const STEPS = ['Select Policy', 'Incident Details', 'Upload Docs', 'Review & Submit'];

const fmtSize = (b) => {
  if (!b) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
};

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const Spinner = () => (
  <span className="fcwiz__spin">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  </span>
);

export default function FileClaim() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const existingClaimId = searchParams.get('claim_id');

  const [step,          setStep]          = useState(0);
  const [policies,      setPolicies]      = useState([]);
  const [claimId,       setClaimId]       = useState(existingClaimId || null);
  const [submitting,    setSubmitting]    = useState(false);
  const [submitted,     setSubmitted]     = useState(false);
  const [claimNumber,   setClaimNumber]   = useState('');
  const [toast,         setToast]         = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const [form, setForm] = useState({
    user_policy_id: '',
    claim_type:     '',
    incident_date:  '',
    amount_claimed: '',
  });

  const token   = localStorage.getItem('access_token');
  const headers = { Authorization: `Bearer ${token}` };

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/policies/my', { headers })
      .then((r) => setPolicies(r.data.filter((p) => p.status === 'active')))
      .catch(() => showToast('error', 'Could not load your policies.'));
  }, []);

  useEffect(() => {
    if (!existingClaimId) return;
    axios.get(`http://127.0.0.1:8000/claims/${existingClaimId}`, { headers })
      .then((r) => {
        const c = r.data;
        setForm({
          user_policy_id: c.user_policy_id,
          claim_type:     c.claim_type     || '',
          incident_date:  c.incident_date  || '',
          amount_claimed: c.amount_claimed || '',
        });
        setUploadedFiles((c.documents || []).map((d) => ({
          name:     d.doc_type,
          size:     0,
          status:   'done',
          doc_type: d.doc_type,
          url:      d.file_url || null,
          docId:    d.id,           // ← needed for the View button presigned URL
        })));
        setStep(1);
      })
      .catch(() => {});
  }, [existingClaimId]);

  // ── Step 0: create draft claim ──────────────────────────────────────────
  const handleCreateClaim = async () => {
    if (!form.user_policy_id) { showToast('error', 'Please select a policy first.'); return; }
    try {
      setSubmitting(true);
      const r = await axios.post(
        'http://127.0.0.1:8000/claims',
        { user_policy_id: Number(form.user_policy_id) },
        { headers }
      );
      setClaimId(r.data.id);
      setClaimNumber(r.data.claim_number);
      setStep(1);
    } catch { showToast('error', 'Failed to create claim. Please try again.'); }
    finally  { setSubmitting(false); }
  };

  // ── Step 1: save incident details ───────────────────────────────────────
  const handleSaveDetails = async () => {
    try {
      setSubmitting(true);
      await axios.put(
        `http://127.0.0.1:8000/claims/${claimId}`,
        {
          claim_type:     form.claim_type,
          incident_date:  form.incident_date  || null,
          amount_claimed: form.amount_claimed ? Number(form.amount_claimed) : null,
        },
        { headers }
      );
      setStep(2);
    } catch { showToast('error', 'Failed to save details. Please try again.'); }
    finally  { setSubmitting(false); }
  };

  // ── Step 2: add file to queue (not uploaded yet) ─────────────────────────
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    const MAX     = 10 * 1024 * 1024;

    for (const file of files) {
      if (uploadedFiles.some((f) => f.name === file.name)) {
        showToast('error', `${file.name} already added.`); continue;
      }
      if (!allowed.includes(file.type)) {
        showToast('error', 'Only JPG, PNG, or PDF files are allowed.'); continue;
      }
      if (file.size > MAX) {
        showToast('error', 'File size must be less than 10 MB.'); continue;
      }
      // add to list as "pending" — user picks doc_type then clicks Upload
      setUploadedFiles((prev) => [
        ...prev,
        { name: file.name, size: file.size, status: 'pending', doc_type: 'accident_photo', file, url: null },
      ]);
    }
    e.target.value = null;
  };

  // ── Upload a single queued file ──────────────────────────────────────────
  // Backend: POST /claims/{claim_id}/documents?doc_type=accident_photo
  // doc_type is a query param, file is multipart form body
  const uploadFile = async (fileEntry) => {
    setUploadedFiles((prev) =>
      prev.map((f) => f.name === fileEntry.name ? { ...f, status: 'uploading', progress: 0 } : f)
    );

    try {
      const fd = new FormData();
      fd.append('file', fileEntry.file);

      const r = await axios.post(
        `http://127.0.0.1:8000/claims/${claimId}/documents?doc_type=${fileEntry.doc_type}`,
        fd,
        {
          headers: { ...headers, 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (ev) => {
            const pct = Math.round((ev.loaded * 100) / ev.total);
            setUploadedFiles((prev) =>
              prev.map((f) => f.name === fileEntry.name ? { ...f, progress: pct } : f)
            );
          },
        }
      );

      // Backend returns ClaimDocumentResponse: { id, claim_id, doc_type, file_url, ... }
      const fileUrl = r.data?.file_url || null;
      const docId   = r.data?.id       || null;

      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.name === fileEntry.name
            ? { ...f, status: 'done', url: fileUrl, docId, progress: 100 }
            : f
        )
      );
      showToast('success', `${fileEntry.name} uploaded successfully.`);
    } catch {
      setUploadedFiles((prev) =>
        prev.map((f) => f.name === fileEntry.name ? { ...f, status: 'error' } : f)
      );
      showToast('error', `Failed to upload ${fileEntry.name}`);
    }
  };

  const updateDocType = (name, doc_type) => {
    setUploadedFiles((prev) =>
      prev.map((f) => f.name === name ? { ...f, doc_type } : f)
    );
  };

  const removeFile = (name) =>
    setUploadedFiles((prev) => prev.filter((f) => f.name !== name));

  // ── Step 3: submit claim ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const r = await axios.post(
        `http://127.0.0.1:8000/claims/${claimId}/submit`,
        {},
        { headers }
      );
      setClaimNumber(r.data.claim_number);
      setSubmitted(true);
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Submission failed. Please try again.');
    } finally { setSubmitting(false); }
  };

  const selectedPolicy    = policies.find((p) => p.id === Number(form.user_policy_id));
  const doneFiles         = uploadedFiles.filter((f) => f.status === 'done');
  const hasPendingUploads = uploadedFiles.some((f) => f.status === 'pending' || f.status === 'uploading');

  // ── Success screen ──────────────────────────────────────────────────────
  if (submitted) {
    return (
      <>
        <style>{styles}</style>
        <div className="fcwiz__root">
          <div className="fcwiz__bg"><div className="fcwiz__orb" /></div>
          <div className="fcwiz__wrap">
            <div className="fcwiz__success">
              <div className="fcwiz__successring">✓</div>
              <div className="fcwiz__successh">Claim Submitted</div>
              <p className="fcwiz__successp">
                Your claim has been submitted successfully.<br />
                Our team will review it within 2–3 business days.
              </p>
              <div className="fcwiz__successnum">{claimNumber}</div>
              <br />
              <button className="fcwiz__successbtn" onClick={() => navigate('/claims')}>
                View My Claims
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>

      {toast && (
        <div className={`fcwiz__toast fcwiz__toast--${toast.type}`}>
          {toast.type === 'error'
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          }
          {toast.msg}
        </div>
      )}

      <div className="fcwiz__root">
        <div className="fcwiz__bg"><div className="fcwiz__orb" /></div>
        <div className="fcwiz__wrap">

          <button className="fcwiz__back" onClick={() => navigate('/claims')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            My Claims
          </button>

          <div className="fcwiz__tag">Claim Wizard</div>
          <h1 className="fcwiz__h1">File a New Claim</h1>
          <p className="fcwiz__lead">Complete each step to submit your insurance claim.</p>

          {/* Stepper */}
          <div className="fcwiz__stepper">
            {STEPS.map((label, i) => {
              const isDone = i < step, isCurrent = i === step, isLast = i === STEPS.length - 1;
              return (
                <div key={label} style={{ display: 'flex', alignItems: 'center', flex: isLast ? '0' : '1' }}>
                  <div className="fcwiz__step">
                    <div className={`fcwiz__node${isDone ? ' fcwiz__node--done' : isCurrent ? ' fcwiz__node--active' : ''}`}>
                      {isDone ? '✓' : i + 1}
                    </div>
                    <div className={`fcwiz__steplabel${isDone ? ' fcwiz__steplabel--done' : isCurrent ? ' fcwiz__steplabel--active' : ''}`}>
                      {label}
                    </div>
                  </div>
                  {!isLast && <div className={`fcwiz__rail${isDone ? ' fcwiz__rail--done' : ''}`} />}
                </div>
              );
            })}
          </div>

          {/* ── STEP 0: Select Policy ── */}
          {step === 0 && (
            <div className="fcwiz__card">
              <div className="fcwiz__cardh">Select Your Policy</div>
              <div className="fcwiz__cardsub">Which active policy is this claim against?</div>
              <div className="fcwiz__field">
                <label className="fcwiz__label">Active Policy</label>
                <select
                  className="fcwiz__select"
                  value={form.user_policy_id}
                  onChange={(e) => setForm({ ...form, user_policy_id: e.target.value })}
                >
                  <option value="">— Select a policy —</option>
                  {policies.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.policy?.title || `Policy #${p.id}`} · {p.policy_number}
                    </option>
                  ))}
                </select>
              </div>
              {selectedPolicy && (
                <div className="fcwiz__preview">
                  <span style={{ color: '#6d7ff5', fontWeight: 700 }}>{selectedPolicy.policy?.title}</span><br />
                  Premium: ₹{Number(selectedPolicy.premium).toLocaleString('en-IN')} · Expires: {fmtDate(selectedPolicy.end_date)}
                </div>
              )}
              <div className="fcwiz__btns">
                <button
                  className="fcwiz__btnnext"
                  onClick={handleCreateClaim}
                  disabled={!form.user_policy_id || submitting}
                >
                  {submitting ? <><Spinner /> Saving...</> : 'Next — Enter Details →'}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 1: Incident Details ── */}
          {step === 1 && (
            <div className="fcwiz__card">
              <div className="fcwiz__cardh">Incident Details</div>
              <div className="fcwiz__cardsub">Your claim is saved as a draft — you can come back anytime.</div>
              <div className="fcwiz__field">
                <label className="fcwiz__label">Claim Type</label>
                <select
                  className="fcwiz__select"
                  value={form.claim_type}
                  onChange={(e) => setForm({ ...form, claim_type: e.target.value })}
                >
                  <option value="">— Select type —</option>
                  <option value="accident">Accident</option>
                  <option value="medical">Medical</option>
                  <option value="theft">Theft</option>
                  <option value="fire">Fire Damage</option>
                  <option value="natural_disaster">Natural Disaster</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="fcwiz__field">
                <label className="fcwiz__label">Date of Incident</label>
                <input
                  type="date" className="fcwiz__input"
                  value={form.incident_date}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setForm({ ...form, incident_date: e.target.value })}
                />
              </div>
              <div className="fcwiz__field">
                <label className="fcwiz__label">Amount Claimed (₹)</label>
                <input
                  type="number" className="fcwiz__input"
                  placeholder="e.g. 50000"
                  value={form.amount_claimed}
                  onChange={(e) => setForm({ ...form, amount_claimed: e.target.value })}
                />
              </div>
              <div className="fcwiz__btns">
                <button className="fcwiz__btnback" onClick={() => setStep(0)}>← Back</button>
                <button
                  className="fcwiz__btnnext"
                  onClick={handleSaveDetails}
                  disabled={submitting}
                >
                  {submitting ? <><Spinner /> Saving...</> : 'Next — Upload Documents →'}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Upload Documents ── */}
          {step === 2 && (
            <div className="fcwiz__card">
              <div className="fcwiz__cardh">Upload Supporting Documents</div>
              <div className="fcwiz__cardsub">
                Select your files, choose the document type for each, then click Upload. At least one uploaded document is required.
              </div>

              {/* Hidden file input */}
              <input
                id="fcwiz-file-input"
                type="file" multiple accept=".jpg,.jpeg,.png,.pdf"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />

              {/* Dropzone */}
              <div
                className="fcwiz__dropzone"
                onClick={() => document.getElementById('fcwiz-file-input').click()}
              >
                <div className="fcwiz__dzicon">📎</div>
                <div className="fcwiz__dztitle">Click to select files</div>
                <div className="fcwiz__dzhint">
                  <span>Browse</span> · JPG, PNG, PDF (Max 10 MB each)
                </div>
              </div>

              {/* File list */}
              {uploadedFiles.length > 0 && (
                <div className="fcwiz__filelist">
                  {uploadedFiles.map((f, i) => (
                    <div key={i} className="fcwiz__filerow">
                      {/* thumb */}
                      <div className="fcwiz__filethumb">
                        {f.name.match(/\.(jpg|jpeg|png)$/i) ? '🖼️' : '📄'}
                      </div>

                      {/* name + size */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="fcwiz__filename">{f.name}</div>
                        {f.size > 0 && <div className="fcwiz__filesz">{fmtSize(f.size)}</div>}
                      </div>

                      {/* doc type selector — only show when pending or error */}
                      {(f.status === 'pending' || f.status === 'error') && (
                        <select
                          className="fcwiz__doctype"
                          value={f.doc_type}
                          onChange={(e) => updateDocType(f.name, e.target.value)}
                        >
                          {DOC_TYPE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      )}

                      {/* status */}
                      <div className={`fcwiz__filest fcwiz__filest--${f.status === 'pending' ? 'uploading' : f.status}`}>
                        {f.status === 'pending'   && 'Ready'}
                        {f.status === 'uploading' && `${f.progress || 0}%`}
                        {f.status === 'done'      && '✓ Uploaded'}
                        {f.status === 'error'     && '✕ Failed'}
                      </div>

                      {/* upload button — only when pending or error */}
                      {(f.status === 'pending' || f.status === 'error') && (
                        <button
                          type="button"
                          className="fcwiz__filebtn--upload"
                          onClick={(e) => { e.stopPropagation(); uploadFile(f); }}
                        >
                          ↑ Upload
                        </button>
                      )}

                      {/* view button — fetches presigned URL then opens file */}
                      {f.status === 'done' && f.docId && (
                        <button
                          type="button"
                          className="fcwiz__filebtn fcwiz__filebtn--view"
                          title="View file"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const r = await axios.get(
                                `http://127.0.0.1:8000/claims/documents/${f.docId}/view`,
                                { headers }
                              );
                              window.open(r.data.url, '_blank', 'noopener,noreferrer');
                            } catch {
                              showToast('error', 'Could not open file. Please try again.');
                            }
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                          </svg>
                        </button>
                      )}

                      {/* remove button */}
                      {f.status !== 'uploading' && (
                        <button
                          className="fcwiz__filebtn fcwiz__filebtn--rm"
                          type="button"
                          title="Remove"
                          onClick={(e) => { e.stopPropagation(); removeFile(f.name); }}
                        >✕</button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="fcwiz__btns">
                <button className="fcwiz__btnback" onClick={() => setStep(1)}>← Back</button>
                <button
                  className="fcwiz__btnnext"
                  onClick={() => setStep(3)}
                  disabled={doneFiles.length === 0 || hasPendingUploads}
                  title={hasPendingUploads ? 'Upload all pending files first' : ''}
                >
                  {hasPendingUploads
                    ? 'Upload all files first'
                    : `Next — Review Claim →`}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Review & Submit ── */}
          {step === 3 && (
            <div className="fcwiz__card">
              <div className="fcwiz__cardh">Review Your Claim</div>
              <div className="fcwiz__cardsub">Check everything before submitting. Once submitted, the claim cannot be edited.</div>
              <div style={{ marginBottom: 8 }}>
                {[
                  ['Claim Number',   claimNumber],
                  ['Policy',         selectedPolicy?.policy?.title || '—'],
                  ['Claim Type',     form.claim_type || '—'],
                  ['Incident Date',  fmtDate(form.incident_date)],
                  ['Amount Claimed', form.amount_claimed ? `₹${Number(form.amount_claimed).toLocaleString('en-IN')}` : '—'],
                  ['Documents',      `${doneFiles.length} uploaded`],
                ].map(([k, v]) => (
                  <div key={k} className="fcwiz__reviewrow">
                    <div className="fcwiz__rk">{k}</div>
                    <div className="fcwiz__rv" style={{ textTransform: k === 'Claim Type' ? 'capitalize' : undefined }}>{v}</div>
                  </div>
                ))}
              </div>
              <div className="fcwiz__warn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Once submitted, your claim cannot be edited. Make sure all details are correct.
              </div>
              <div className="fcwiz__btns">
                <button className="fcwiz__btnback" onClick={() => setStep(2)}>← Back</button>
                <button
                  className="fcwiz__btnsubmit"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? <><Spinner /> Submitting...</> : '✓ Submit Claim'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}