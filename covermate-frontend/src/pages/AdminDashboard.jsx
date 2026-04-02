import { useState, useEffect, useCallback } from "react";
import axios from "axios";
const API = "http://127.0.0.1:8000";
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("access_token")}` });

const S = {
  active:       { c:"#4ade80", bg:"rgba(74,222,128,0.1)",  b:"rgba(74,222,128,0.25)",  l:"Active"       },
  expired:      { c:"#94a3b8", bg:"rgba(148,163,184,0.1)", b:"rgba(148,163,184,0.25)", l:"Expired"      },
  cancelled:    { c:"#f87171", bg:"rgba(248,113,113,0.1)", b:"rgba(248,113,113,0.25)", l:"Cancelled"    },
  draft:        { c:"#475569", bg:"rgba(71,85,105,0.1)",   b:"rgba(71,85,105,0.25)",   l:"Draft"        },
  submitted:    { c:"#60a5fa", bg:"rgba(96,165,250,0.1)",  b:"rgba(96,165,250,0.25)",  l:"Submitted"    },
  under_review: { c:"#e879f9", bg:"rgba(232,121,249,0.1)", b:"rgba(232,121,249,0.25)", l:"Under Review" },
  approved:     { c:"#4ade80", bg:"rgba(74,222,128,0.1)",  b:"rgba(74,222,128,0.25)",  l:"Approved"     },
  rejected:     { c:"#f87171", bg:"rgba(248,113,113,0.1)", b:"rgba(248,113,113,0.25)", l:"Rejected"     },
  paid:         { c:"#fbbf24", bg:"rgba(251,191,36,0.1)",  b:"rgba(251,191,36,0.25)",  l:"Paid"         },
};

const CLAIM_ST  = ["submitted","under_review","approved","rejected","paid"];
const POLICY_ST = ["active","expired","cancelled"];
const TL_STEPS  = ["submitted","under_review","approved","paid"];

const fd  = d => d ? new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "—";
const fdt = d => d ? new Date(d).toLocaleString("en-IN",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "—";
const fa  = n => n ? `₹${Number(n).toLocaleString("en-IN")}` : "—";

const css = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{background:#07090f!important;}
::-webkit-scrollbar{width:4px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:rgba(99,102,241,0.2);border-radius:2px;}
@keyframes fadeSlide{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
@keyframes toastUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
`;

function Badge({ status, lg }) {
  const m = S[status] || { c:"#64748b", bg:"rgba(100,116,139,0.1)", b:"rgba(100,116,139,0.25)", l:status };
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:lg?"6px 14px":"3px 10px", borderRadius:999, fontSize:lg?12:10.5, fontWeight:700, letterSpacing:"0.04em", border:`1px solid ${m.b}`, color:m.c, background:m.bg, whiteSpace:"nowrap", fontFamily:"'Sora',sans-serif" }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:m.c, flexShrink:0, animation:["submitted","under_review"].includes(status)?"pulse 2s infinite":"none" }} />
      {m.l}
    </span>
  );
}

function Avatar({ name, size=32 }) {
  const initials = (name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const colors = ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#3b82f6"];
  const color = colors[(name||"").charCodeAt(0) % colors.length];
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:`${color}20`, border:`1.5px solid ${color}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.35, fontWeight:700, color, flexShrink:0, fontFamily:"'Sora',sans-serif" }}>
      {initials}
    </div>
  );
}

function Sec({ title }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, margin:"20px 0 10px", fontFamily:"'Sora',sans-serif" }}>
      <span style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.12em", color:"#1e2a3a" }}>{title}</span>
      <div style={{ flex:1, height:1, background:"linear-gradient(90deg,rgba(30,42,58,0.8),transparent)" }} />
    </div>
  );
}

function InfoBox({ label, value, full, big, accent }) {
  return (
    <div style={{ gridColumn:full?"1 / -1":undefined, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:9, padding:"11px 14px" }}>
      <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"#1e2a3a", marginBottom:4, fontFamily:"'Sora',sans-serif" }}>{label}</div>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:big?20:12.5, fontWeight:600, color:accent||"#e2e8f0", lineHeight:1.3 }}>{value||"—"}</div>
    </div>
  );
}

function Timeline({ status }) {
  const isRej = status==="rejected";
  const cur = isRej ? TL_STEPS.indexOf("under_review") : TL_STEPS.indexOf(status);
  if (isRej) return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", background:"rgba(248,113,113,0.05)", border:"1px solid rgba(248,113,113,0.15)", borderRadius:9, fontSize:12, color:"#f87171", fontFamily:"'Sora',sans-serif" }}>
      <span>✕</span> Claim rejected after review.
    </div>
  );
  return (
    <div style={{ display:"flex", alignItems:"center", padding:"14px 18px", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:10, overflowX:"auto", gap:0 }}>
      {TL_STEPS.map((step,i) => {
        const done=i<cur, isCur=i===cur, last=i===TL_STEPS.length-1;
        return (
          <div key={step} style={{ display:"flex", alignItems:"center", flex:last?"0":"1" }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, flexShrink:0 }}>
              <div style={{ width:10, height:10, borderRadius:"50%", background:done?"#6366f1":isCur?"#f59e0b":"transparent", border:`2px solid ${done?"#6366f1":isCur?"#f59e0b":"rgba(30,42,58,0.8)"}`, boxShadow:isCur?"0 0 10px rgba(245,158,11,0.5)":done?"0 0 6px rgba(99,102,241,0.4)":"none", animation:isCur?"pulse 1.5s infinite":"none" }} />
              <div style={{ fontSize:8.5, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", textAlign:"center", color:done?"#6366f1":isCur?"#f59e0b":"#1e2a3a", fontFamily:"'Sora',sans-serif", whiteSpace:"nowrap" }}>{S[step]?.l}</div>
            </div>
            {!last && <div style={{ flex:1, height:2, minWidth:20, marginBottom:14, borderRadius:2, background:done?"linear-gradient(90deg,#6366f1,#8b5cf6)":"rgba(30,42,58,0.8)" }} />}
          </div>
        );
      })}
    </div>
  );
}

/* ── Claim Detail Panel ── */
function ClaimDetail({ claim, onUpdated, onClear }) {
  const [sel, setSel]   = useState(claim.status);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg]   = useState(null);

  useEffect(() => { setSel(claim.status); setNote(""); setMsg(null); }, [claim.id]);

  const user   = claim.user_policy?.user;
  const policy = claim.user_policy?.policy;
  const docs   = claim.documents || [];
  const hist   = claim.status_history || [];

  const toast = (type,text) => { setMsg({type,text}); setTimeout(()=>setMsg(null),4000); };

  const doUpdate = async (newSt) => {
    setBusy(true);
    try {
      const res = await axios.patch(`${API}/admin/claims/${claim.id}/status`,{ status:newSt, note:note||null },{ headers:authH() });
      toast("ok",`✓ Status → "${S[newSt]?.l}". Email sent to ${user?.name||"user"}.`);
      onUpdated(res.data);
      setSel(newSt);
    } catch(e) { toast("err", e.response?.data?.detail||"Failed to update"); }
    finally { setBusy(false); }
  };

  const viewDoc = async (docId) => {
    try {
      const r = await axios.get(`${API}/claims/documents/${docId}/view`,{ headers:authH() });
      window.open(r.data.url,"_blank","noopener,noreferrer");
    } catch { toast("err","Could not open document."); }
  };

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", animation:"fadeSlide 0.25s ease" }}>

      {/* Panel Header */}
      <div style={{ padding:"18px 24px", borderBottom:"1px solid rgba(255,255,255,0.05)", flexShrink:0, background:"linear-gradient(135deg,rgba(99,102,241,0.06) 0%,transparent 60%)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"#3d4f63", background:"rgba(99,102,241,0.08)", border:"1px solid rgba(99,102,241,0.15)", padding:"2px 8px", borderRadius:5 }}>{claim.claim_number}</span>
              <Badge status={claim.status} lg />
            </div>
            <div style={{ fontSize:22, fontWeight:800, color:"#f8fafc", letterSpacing:"-0.025em", textTransform:"capitalize", marginBottom:8 }}>
              {claim.claim_type?.replace(/_/g," ")||"General Claim"}
            </div>
            {user?.name && (
              <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                <Avatar name={user.name} size={28} />
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:"#cbd5e1" }}>{user.name}</div>
                  <div style={{ fontSize:11, color:"#3d4f63" }}>{user.email}</div>
                </div>
                <span style={{ fontSize:11, color:"#3d4f63", marginLeft:8 }}>· {fd(claim.created_at)}</span>
              </div>
            )}
          </div>
          <button onClick={onClear} style={{ padding:"5px 10px", borderRadius:7, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", cursor:"pointer", color:"#3d4f63", fontSize:12, fontWeight:600, fontFamily:"'Sora',sans-serif", whiteSpace:"nowrap" }}>✕ Close</button>
        </div>
      </div>

      {/* Panel Body */}
      <div style={{ flex:1, overflowY:"auto", padding:"4px 24px 24px" }}>

        <Sec title="Claim Progress" />
        <Timeline status={claim.status} />

        <Sec title="Claim Details" />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9 }}>
          <InfoBox label="Policy"         value={policy?.title} />
          <InfoBox label="Policy Number"  value={claim.user_policy?.policy_number} />
          <InfoBox label="Claim Type"     value={claim.claim_type} />
          <InfoBox label="Incident Date"  value={fd(claim.incident_date)} />
          <InfoBox label="Amount Claimed" value={fa(claim.amount_claimed)} full big accent="#fbbf24" />
        </div>
         {/* Fraud Alerts */}
{claim.fraud_flags && claim.fraud_flags.length > 0 && (
  <>
    <Sec title="Fraud Alerts" />

    <div style={{
      background:"rgba(248,113,113,0.06)",
      border:"1px solid rgba(248,113,113,0.25)",
      borderRadius:10,
      padding:"12px 14px",
      display:"flex",
      flexDirection:"column",
      gap:6
    }}>
      {claim.fraud_flags.map(flag => (
        <div
          key={flag.id}
          style={{
            fontSize:12,
            fontWeight:700,
            color:"#f87171",
            fontFamily:"'JetBrains Mono',monospace"
          }}
        >
          ⚠ {flag.rule_code}
        </div>
      ))}
    </div>
  </>
)}
        {/* Documents */}
        <Sec title={`Documents (${docs.length})`} />
        {docs.length===0
          ? <div style={{ padding:"14px", textAlign:"center", background:"rgba(255,255,255,0.01)", border:"1px dashed rgba(30,42,58,0.8)", borderRadius:9, color:"#1e2a3a", fontSize:12, fontFamily:"'Sora',sans-serif" }}>No documents uploaded</div>
          : <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
              {docs.map(doc => {
                const icon = doc.doc_type?.includes("photo")?"🖼️":doc.doc_type?.includes("report")?"📋":doc.doc_type?.includes("bill")||doc.doc_type?.includes("invoice")?"🧾":doc.doc_type?.includes("licence")?"🪪":"📄";
                return (
                  <div key={doc.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 14px", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:10, transition:"all 0.15s", cursor:"pointer" }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(99,102,241,0.3)";e.currentTarget.style.background="rgba(99,102,241,0.05)";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.05)";e.currentTarget.style.background="rgba(255,255,255,0.02)";}}>
                    <div style={{ width:36, height:36, borderRadius:9, background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{icon}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:"#e2e8f0", textTransform:"capitalize", marginBottom:2, fontFamily:"'Sora',sans-serif" }}>{doc.doc_type?.replace(/_/g," ")||"Document"}</div>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9.5, color:"#3d4f63" }}>Uploaded {fdt(doc.uploaded_at)}</div>
                    </div>
                    <button onClick={()=>viewDoc(doc.id)} style={{ padding:"7px 16px", borderRadius:7, border:"1px solid rgba(99,102,241,0.25)", background:"rgba(99,102,241,0.08)", color:"#818cf8", fontFamily:"'Sora',sans-serif", fontSize:12, fontWeight:700, cursor:"pointer", flexShrink:0, transition:"all 0.15s" }}
                      onMouseEnter={e=>{e.target.style.background="rgba(99,102,241,0.2)";}}
                      onMouseLeave={e=>{e.target.style.background="rgba(99,102,241,0.08)";}}>View ↗</button>
                  </div>
                );
              })}
            </div>
        }

        {/* History */}
        {hist.length > 0 && (
          <>
            <Sec title="Status History" />
            <div style={{ display:"flex", flexDirection:"column" }}>
              {hist.map((entry,i) => {
                const m = S[entry.status]||{ c:"#64748b", bg:"rgba(100,116,139,0.1)", b:"rgba(100,116,139,0.25)" };
                return (
                  <div key={entry.id||i} style={{ display:"flex", alignItems:"flex-start", gap:11, position:"relative" }}>
                    {i<hist.length-1 && <div style={{ position:"absolute", left:8, top:20, width:2, height:"calc(100% + 2px)", background:"rgba(30,42,58,0.6)" }} />}
                    <div style={{ width:18, height:18, borderRadius:"50%", flexShrink:0, marginTop:2, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, border:`2px solid ${m.b}`, background:m.bg, color:m.c, position:"relative", zIndex:1 }}>✓</div>
                    <div style={{ flex:1, paddingBottom:12 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:m.c, textTransform:"capitalize", marginBottom:2, fontFamily:"'Sora',sans-serif" }}>{entry.status.replace(/_/g," ")}</div>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9.5, color:"#3d4f63" }}>{fdt(entry.changed_at)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Admin Decision */}
        {claim.status !== "draft" && (
          <>
            <Sec title="Admin Decision" />
            <div style={{ background:"rgba(99,102,241,0.04)", border:"1px solid rgba(99,102,241,0.1)", borderRadius:12, padding:"18px 20px" }}>

              {(claim.status==="submitted"||claim.status==="under_review") && (
                <>
                  <div style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.12em", color:"#1e2a3a", marginBottom:9, fontFamily:"'Sora',sans-serif" }}>Quick Actions</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9, marginBottom:16 }}>
                    <button disabled={busy} onClick={()=>doUpdate("approved")} style={{ padding:"13px", borderRadius:10, border:"1px solid rgba(74,222,128,0.3)", background:"rgba(74,222,128,0.07)", color:"#4ade80", fontFamily:"'Sora',sans-serif", fontSize:13, fontWeight:700, cursor:"pointer", transition:"all 0.2s", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}
                      onMouseEnter={e=>{e.currentTarget.style.background="rgba(74,222,128,0.18)";e.currentTarget.style.transform="translateY(-1px)";}}
                      onMouseLeave={e=>{e.currentTarget.style.background="rgba(74,222,128,0.07)";e.currentTarget.style.transform="none";}}>
                      <span style={{ fontSize:16 }}>✓</span> Approve
                    </button>
                    <button disabled={busy} onClick={()=>doUpdate("rejected")} style={{ padding:"13px", borderRadius:10, border:"1px solid rgba(248,113,113,0.3)", background:"rgba(248,113,113,0.07)", color:"#f87171", fontFamily:"'Sora',sans-serif", fontSize:13, fontWeight:700, cursor:"pointer", transition:"all 0.2s", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}
                      onMouseEnter={e=>{e.currentTarget.style.background="rgba(248,113,113,0.18)";e.currentTarget.style.transform="translateY(-1px)";}}
                      onMouseLeave={e=>{e.currentTarget.style.background="rgba(248,113,113,0.07)";e.currentTarget.style.transform="none";}}>
                      <span style={{ fontSize:16 }}>✕</span> Reject
                    </button>
                  </div>
                  <div style={{ height:1, background:"rgba(99,102,241,0.1)", margin:"0 0 16px" }} />
                </>
              )}

              <div style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.12em", color:"#1e2a3a", marginBottom:9, fontFamily:"'Sora',sans-serif" }}>Set Status</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:16 }}>
                {CLAIM_ST.map(s => {
                  const m=S[s], on=sel===s;
                  return <button key={s} onClick={()=>setSel(s)} style={{ padding:"6px 13px", borderRadius:999, fontSize:11.5, fontWeight:700, cursor:"pointer", border:`1.5px solid ${on?m.b:"rgba(30,42,58,0.8)"}`, background:on?m.bg:"transparent", color:on?m.c:"#3d4f63", fontFamily:"'Sora',sans-serif", transition:"all 0.15s" }}>{m.l}</button>;
                })}
              </div>

              <div style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.12em", color:"#1e2a3a", marginBottom:7, fontFamily:"'Sora',sans-serif" }}>
                Note <span style={{ fontWeight:400, letterSpacing:0, textTransform:"none", color:"#3d4f63" }}>(sent in email)</span>
              </div>
              <textarea value={note} onChange={e=>setNote(e.target.value)} rows={3}
                placeholder="Reason, next steps, payment info…"
                style={{ width:"100%", padding:"11px 13px", borderRadius:9, border:"1px solid rgba(30,42,58,0.8)", background:"rgba(0,0,0,0.3)", color:"#e2e8f0", fontFamily:"'Sora',sans-serif", fontSize:12.5, outline:"none", resize:"vertical", marginBottom:12, transition:"border-color 0.2s", boxSizing:"border-box" }}
                onFocus={e=>e.target.style.borderColor="rgba(99,102,241,0.4)"}
                onBlur={e=>e.target.style.borderColor="rgba(30,42,58,0.8)"} />

              <button disabled={busy||sel===claim.status} onClick={()=>doUpdate(sel)} style={{
                width:"100%", padding:"13px", borderRadius:10, border:"none",
                background:busy||sel===claim.status?"rgba(99,102,241,0.15)":"linear-gradient(135deg,#6366f1,#8b5cf6)",
                color:busy||sel===claim.status?"#3d4f63":"#fff",
                fontFamily:"'Sora',sans-serif", fontSize:13.5, fontWeight:700,
                cursor:busy||sel===claim.status?"not-allowed":"pointer",
                transition:"all 0.2s", boxShadow:busy||sel===claim.status?"none":"0 4px 20px rgba(99,102,241,0.3)",
                display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              }}>
                {busy ? <span style={{ width:15, height:15, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.7s linear infinite", display:"inline-block" }} /> : "✉"}
                {busy ? "Saving…" : "Save & Notify User"}
              </button>

              {msg && (
                <div style={{ marginTop:12, padding:"11px 14px", borderRadius:9, fontSize:12.5, fontWeight:600, fontFamily:"'Sora',sans-serif", background:msg.type==="ok"?"rgba(74,222,128,0.08)":"rgba(248,113,113,0.08)", border:`1px solid ${msg.type==="ok"?"rgba(74,222,128,0.25)":"rgba(248,113,113,0.25)"}`, color:msg.type==="ok"?"#4ade80":"#f87171", animation:"toastUp 0.2s ease" }}>
                  {msg.text}
                </div>
              )}
            </div>
          </>
        )}
        <div style={{ height:24 }} />
      </div>
    </div>
  );
}

/* ── Policy Detail Panel ── */
function PolicyDetail({ policy, onUpdated, onClear }) {
  const [sel, setSel] = useState(policy.status);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg]   = useState(null);

  useEffect(() => { setSel(policy.status); setMsg(null); }, [policy.id]);

  const toast = (type,text) => { setMsg({type,text}); setTimeout(()=>setMsg(null),3500); };

  const save = async () => {
    if (sel===policy.status) return;
    setBusy(true);
    try {
      const res = await axios.patch(`${API}/admin/user-policies/${policy.id}/status`,{ status:sel },{ headers:authH() });
      toast("ok","Policy updated. Email sent ✉");
      onUpdated(res.data);
      setSel(sel);
    } catch(e) { toast("err", e.response?.data?.detail||"Failed"); }
    finally { setBusy(false); }
  };

  const u=policy.user, p=policy.policy;

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", animation:"fadeSlide 0.25s ease" }}>
      <div style={{ padding:"18px 24px", borderBottom:"1px solid rgba(255,255,255,0.05)", flexShrink:0, background:"linear-gradient(135deg,rgba(99,102,241,0.06) 0%,transparent 60%)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"#3d4f63", marginBottom:7, background:"rgba(99,102,241,0.08)", border:"1px solid rgba(99,102,241,0.15)", padding:"2px 8px", borderRadius:5, display:"inline-block" }}>#{policy.policy_number||policy.id}</div>
            <div style={{ fontSize:20, fontWeight:800, color:"#f8fafc", letterSpacing:"-0.02em", marginBottom:9 }}>{p?.title}</div>
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              {u?.name && <><Avatar name={u.name} size={26} /><div><div style={{ fontSize:13, fontWeight:600, color:"#cbd5e1", fontFamily:"'Sora',sans-serif" }}>{u.name}</div><div style={{ fontSize:11, color:"#3d4f63", fontFamily:"'Sora',sans-serif" }}>{u.email}</div></div></>}
              <Badge status={policy.status} lg />
            </div>
          </div>
          <button onClick={onClear} style={{ padding:"5px 10px", borderRadius:7, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", cursor:"pointer", color:"#3d4f63", fontSize:12, fontWeight:600, fontFamily:"'Sora',sans-serif" }}>✕ Close</button>
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"4px 24px 24px" }}>
        <Sec title="Policy Details" />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9 }}>
          <InfoBox label="Type"       value={p?.policy_type} />
          <InfoBox label="Provider"   value={p?.provider?.name||"—"} />
          <InfoBox label="Premium"    value={`${fa(policy.premium)}/mo`} />
          <InfoBox label="Auto Renew" value={policy.auto_renew?"Yes":"No"} />
          <InfoBox label="Start Date" value={fd(policy.start_date)} />
          <InfoBox label="End Date"   value={fd(policy.end_date)} />
        </div>

        <Sec title="Change Status" />
        <div style={{ background:"rgba(99,102,241,0.04)", border:"1px solid rgba(99,102,241,0.1)", borderRadius:12, padding:"18px 20px" }}>
          <div style={{ display:"flex", gap:7, marginBottom:16, flexWrap:"wrap" }}>
            {POLICY_ST.map(s => {
              const m=S[s], on=sel===s;
              return <button key={s} onClick={()=>setSel(s)} style={{ padding:"9px 20px", borderRadius:999, fontSize:13, fontWeight:700, cursor:"pointer", border:`1.5px solid ${on?m.b:"rgba(30,42,58,0.8)"}`, background:on?m.bg:"transparent", color:on?m.c:"#3d4f63", fontFamily:"'Sora',sans-serif", transition:"all 0.15s" }}>{m.l}</button>;
            })}
          </div>
          <button disabled={busy||sel===policy.status} onClick={save} style={{ width:"100%", padding:"13px", borderRadius:10, border:"none", background:busy||sel===policy.status?"rgba(99,102,241,0.15)":"linear-gradient(135deg,#6366f1,#8b5cf6)", color:busy||sel===policy.status?"#3d4f63":"#fff", fontFamily:"'Sora',sans-serif", fontSize:13.5, fontWeight:700, cursor:busy||sel===policy.status?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:busy||sel===policy.status?"none":"0 4px 20px rgba(99,102,241,0.3)" }}>
            {busy?<span style={{ width:15,height:15,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.7s linear infinite",display:"inline-block" }} />:"✉"}
            {busy?"Saving…":"Save & Notify User"}
          </button>
          {msg && <div style={{ marginTop:12, padding:"11px 14px", borderRadius:9, fontSize:12.5, fontWeight:600, fontFamily:"'Sora',sans-serif", background:msg.type==="ok"?"rgba(74,222,128,0.08)":"rgba(248,113,113,0.08)", border:`1px solid ${msg.type==="ok"?"rgba(74,222,128,0.25)":"rgba(248,113,113,0.25)"}`, color:msg.type==="ok"?"#4ade80":"#f87171", animation:"toastUp 0.2s ease" }}>{msg.text}</div>}
        </div>
      </div>
    </div>
  );
}

/* ── Empty State ── */
function EmptyDetail({ tab }) {
  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:40, textAlign:"center" }}>
      <div style={{ fontSize:48, marginBottom:20, opacity:0.3 }}>{tab==="claims"?"📋":"🛡️"}</div>
      <div style={{ fontSize:16, fontWeight:700, color:"#1e2a3a", marginBottom:8, fontFamily:"'Sora',sans-serif" }}>Select a {tab==="claims"?"claim":"policy"} to review</div>
      <div style={{ fontSize:13, color:"#1e2a3a", fontFamily:"'Sora',sans-serif", lineHeight:1.6 }}>Click any row on the left<br/>to view full details here</div>
    </div>
  );
}

/* ── MAIN ── */
export default function AdminDashboard() {
  const [tab, setTab]           = useState("claims");
  const [stats, setStats]       = useState(null);
  const [fraudStats, setFraudStats] = useState(null);
  const [claims, setClaims]     = useState([]);
  const [policies, setPolicies] = useState([]);
  const [filter, setFilter]     = useState("");
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [selClaim, setSelClaim]   = useState(null);
  const [selPolicy, setSelPolicy] = useState(null);
  const [toast, setToast]         = useState(null);
  const showToast = (type,text) => { setToast({type,text}); setTimeout(()=>setToast(null),3500); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const pUrl = `${API}/admin/user-policies${filter&&tab==="policies"?`?status=${filter}`:""}`;
      const cUrl = `${API}/admin/claims${filter&&tab==="claims"?`?status=${filter}`:""}`;
      const [s,p,c,f] = await Promise.all([
        axios.get(`${API}/admin/dashboard`,{ headers:authH() }),
        axios.get(pUrl,{ headers:authH() }),
        axios.get(cUrl,{ headers:authH() }),
        axios.get(`${API}/admin/fraud-analytics`,{ headers:authH() }),
      ]);
      setStats(s.data); setPolicies(p.data); setClaims(c.data);
      setFraudStats(f.data);
    } catch { showToast("err","Failed to load data"); }
    finally { setLoading(false); }
  }, [filter, tab]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setFilter(""); setSearch(""); setSelClaim(null); setSelPolicy(null); }, [tab]);

  const fOpts = tab==="claims" ? CLAIM_ST : POLICY_ST;
  const fC = claims.filter(c=>[c.claim_number,c.user_policy?.user?.name,c.user_policy?.user?.email,c.claim_type].some(v=>(v||"").toLowerCase().includes(search.toLowerCase())));
  const fP = policies.filter(p=>[p.policy_number,p.user?.name,p.user?.email,p.policy?.title].some(v=>(v||"").toLowerCase().includes(search.toLowerCase())));

  const hasDetail = tab==="claims" ? !!selClaim : !!selPolicy;

  const TH = ({ch}) => <th style={{ padding:"10px 14px", textAlign:"left", fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.12em", color:"#1e2a3a", whiteSpace:"nowrap", fontFamily:"'Sora',sans-serif" }}>{ch}</th>;

  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight:"100vh", background:"#07090f", fontFamily:"'Sora',sans-serif", color:"#e2e8f0", display:"flex", flexDirection:"column" }}>

        {/* Grid bg */}
        <div style={{ position:"fixed", inset:0, backgroundImage:"linear-gradient(rgba(99,102,241,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.018) 1px,transparent 1px)", backgroundSize:"48px 48px", pointerEvents:"none", zIndex:0 }} />

        {/* Navbar */}
        <div style={{ height:54, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", background:"rgba(7,9,15,0.98)", borderBottom:"1px solid rgba(255,255,255,0.05)", position:"sticky", top:0, zIndex:100, backdropFilter:"blur(16px)", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:30, height:30, borderRadius:8, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:15, color:"#fff", boxShadow:"0 4px 12px rgba(99,102,241,0.35)" }}>C</div>
            <span style={{ fontWeight:800, fontSize:16, color:"#f8fafc", letterSpacing:"-0.025em" }}>CoverMate</span>
            <span style={{ fontSize:9, fontWeight:800, letterSpacing:"0.1em", color:"#6366f1", background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.2)", padding:"3px 8px", borderRadius:5 }}>ADMIN</span>
          </div>
          {stats?.pending_claims>0 && (
            <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"#f59e0b", background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.2)", padding:"4px 12px", borderRadius:20 }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:"#f59e0b", display:"inline-block", animation:"pulse 1.5s infinite" }} />
              {stats.pending_claims} pending review
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ flex:1, display:"flex", position:"relative", zIndex:1, overflow:"hidden", height:"calc(100vh - 54px)" }}>

          {/* LEFT: Sidebar Nav */}
          <div style={{ width:200, flexShrink:0, background:"rgba(7,9,15,0.95)", borderRight:"1px solid rgba(255,255,255,0.04)", padding:"18px 10px", display:"flex", flexDirection:"column", overflowY:"auto" }}>
            <div style={{ fontSize:8.5, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.14em", color:"#111827", padding:"0 8px", marginBottom:8 }}>Management</div>
            {[{key:"claims",icon:"📋",label:"Claims",badge:stats?.pending_claims},{key:"policies",icon:"🛡️",label:"Policies",badge:null}].map(l=>(
              <button key={l.key} onClick={()=>setTab(l.key)} style={{ display:"flex", alignItems:"center", gap:9, width:"100%", padding:"9px 11px", borderRadius:9, border:"none", fontFamily:"'Sora',sans-serif", fontSize:13, fontWeight:tab===l.key?700:500, cursor:"pointer", textAlign:"left", background:tab===l.key?"rgba(99,102,241,0.12)":"transparent", color:tab===l.key?"#818cf8":"#2d3748", transition:"all 0.15s", marginBottom:3 }}>
                <span>{l.icon}</span><span style={{ flex:1 }}>{l.label}</span>
                {l.badge>0 && <span style={{ fontSize:9.5, fontWeight:800, background:"rgba(245,158,11,0.15)", color:"#f59e0b", border:"1px solid rgba(245,158,11,0.25)", padding:"1px 6px", borderRadius:9 }}>{l.badge}</span>}
              </button>
            ))}

          {stats && (
  <>
    <div style={{ fontSize:8.5, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.14em", color:"#111827", padding:"0 8px", margin:"20px 0 8px" }}>
      Overview
    </div>

    <div style={{ background:"rgba(255,255,255,0.01)", border:"1px solid rgba(255,255,255,0.04)", borderRadius:9, overflow:"hidden" }}>

      {[
        ["Users",stats.total_users,"#818cf8"],
        ["Policies",stats.total_user_policies,"#4ade80"],
        ["Claims",stats.total_claims,"#fbbf24"],
        ["Pending",stats.pending_claims,"#f59e0b"],
        ["Fraud Claims",fraudStats?.fraud_claims || 0,"#f87171"],
        ["Fraud Rate",`${fraudStats?.fraud_rate_percent || 0}%`,"#ef4444"]
      ].map(([k,v,c],i)=>(
        <div
          key={k}
          style={{
            display:"flex",
            justifyContent:"space-between",
            alignItems:"center",
            padding:"8px 12px",
            borderBottom:i<5?"1px solid rgba(255,255,255,0.03)":"none"
          }}
        >
          <span style={{ fontSize:11.5, color:"#2d3748", fontFamily:"'Sora',sans-serif" }}>{k}</span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:700, color:c }}>{v}</span>
        </div>
      ))}

    </div>
  </>
)}
          </div>

          {/* MIDDLE: List */}
          <div style={{ width: hasDetail ? "42%" : "calc(100% - 200px)", flexShrink:0, display:"flex", flexDirection:"column", borderRight: hasDetail ? "1px solid rgba(255,255,255,0.05)" : "none", transition:"width 0.3s cubic-bezier(0.16,1,0.3,1)", background:"rgba(7,9,15,0.5)", overflow:"hidden" }}>

            {/* List header */}
            <div style={{ padding:"16px 20px 14px", borderBottom:"1px solid rgba(255,255,255,0.05)", flexShrink:0 }}>
              <div style={{ fontSize:18, fontWeight:800, color:"#f8fafc", letterSpacing:"-0.025em", marginBottom:3 }}>{tab==="claims"?"Claims Review":"User Policies"}</div>
              <div style={{ fontSize:11.5, color:"#1e2a3a", marginBottom:14 }}>{tab==="claims"?"Click any claim to review":"Click any policy to manage"}</div>

              {/* Stats mini row */}
              {stats && (
                <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
                  {(tab==="claims"?[
                    [claims.length,"Total","#818cf8"],
                    [claims.filter(c=>c.status==="submitted").length,"Submitted","#60a5fa"],
                    [claims.filter(c=>c.status==="under_review").length,"Review","#e879f9"],
                    [claims.filter(c=>c.status==="approved").length,"Approved","#4ade80"],
                    [claims.filter(c=>c.status==="rejected").length,"Rejected","#f87171"],
                  ]:[
                    [policies.length,"Total","#818cf8"],
                    [policies.filter(p=>p.status==="active").length,"Active","#4ade80"],
                    [policies.filter(p=>p.status==="expired").length,"Expired","#94a3b8"],
                    [policies.filter(p=>p.status==="cancelled").length,"Cancelled","#f87171"],
                  ]).map(([v,l,c])=>(
                    <div key={l} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.04)", borderRadius:8, padding:"7px 12px", minWidth:56 }}>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:18, fontWeight:700, color:c, lineHeight:1 }}>{v}</div>
                      <div style={{ fontSize:8.5, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.09em", color:"#1e2a3a", marginTop:3, fontFamily:"'Sora',sans-serif" }}>{l}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Search + filters */}
              <div style={{ display:"flex", gap:7, flexWrap:"wrap", alignItems:"center" }}>
                <input value={search} onChange={e=>setSearch(e.target.value)}
                  placeholder="Search…"
                  style={{ flex:1, minWidth:120, padding:"8px 12px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:8, color:"#e2e8f0", fontFamily:"'Sora',sans-serif", fontSize:12, outline:"none" }}
                  onFocus={e=>e.target.style.borderColor="rgba(99,102,241,0.35)"}
                  onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.05)"} />
                {["", ...fOpts].map(s=>{
                  const m=s?S[s]:null, on=filter===s;
                  return <button key={s||"all"} onClick={()=>setFilter(s)} style={{ padding:"6px 11px", borderRadius:999, fontSize:10.5, fontWeight:700, cursor:"pointer", border:`1px solid ${on?(m?.b||"rgba(99,102,241,0.4)"):"rgba(30,42,58,0.8)"}`, background:on?(m?.bg||"rgba(99,102,241,0.12)"):"transparent", color:on?(m?.c||"#818cf8"):"#2d3748", fontFamily:"'Sora',sans-serif", transition:"all 0.15s" }}>{s?(m?.l||s):"All"}</button>;
                })}
                <button onClick={load} style={{ padding:"6px 11px", borderRadius:8, border:"1px solid rgba(30,42,58,0.8)", background:"transparent", color:"#2d3748", fontFamily:"'Sora',sans-serif", fontSize:11, fontWeight:700, cursor:"pointer" }}>↻</button>
              </div>
            </div>

            {/* List body */}
            <div style={{ flex:1, overflowY:"auto" }}>
              {loading ? (
                <div style={{ padding:48, textAlign:"center" }}>
                  <div style={{ width:28, height:28, border:"3px solid rgba(99,102,241,0.15)", borderTopColor:"#6366f1", borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
                  <div style={{ color:"#1e2a3a", fontSize:12, fontFamily:"'Sora',sans-serif" }}>Loading…</div>
                </div>
              ) : tab==="claims" ? (
                fC.length===0
                  ? <div style={{ padding:48, textAlign:"center", color:"#1e2a3a", fontSize:13, fontFamily:"'Sora',sans-serif" }}>No claims found.</div>
                  : fC.map((c,i) => {
                    const isSel = selClaim?.id===c.id;
                    return (
                      <div key={c.id} onClick={c.status!=="draft"?()=>setSelClaim(c):undefined}
                        style={{ padding:"13px 20px", borderBottom:"1px solid rgba(255,255,255,0.03)", cursor:c.status!=="draft"?"pointer":"default", background:isSel?"rgba(99,102,241,0.08)":"transparent", borderLeft:`3px solid ${isSel?"#6366f1":"transparent"}`, transition:"all 0.12s" }}
                        onMouseEnter={e=>{if(!isSel&&c.status!=="draft")e.currentTarget.style.background="rgba(255,255,255,0.02)";}}
                        onMouseLeave={e=>{if(!isSel)e.currentTarget.style.background="transparent";}}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                               <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:700, color:isSel?"#818cf8":"#e2e8f0" }}>
                                  {c.claim_number}
                                 </span>

                                 <Badge status={c.status} />

{/* Risk Score Indicator */}
{c.risk_score > 70 && (
  <span style={{fontSize:11,fontWeight:700,color:"#ef4444"}}>🔴 High Risk</span>
)}

{c.risk_score > 40 && c.risk_score <= 70 && (
  <span style={{fontSize:11,fontWeight:700,color:"#f97316"}}>🟠 Medium Risk</span>
)}

{c.risk_score > 0 && c.risk_score <= 40 && (
  <span style={{fontSize:11,fontWeight:700,color:"#22c55e"}}>🟢 Low Risk</span>
)}

{/* Fraud Flag */}


{c.fraud_flags?.length > 0 && (
  <span style={{
    fontSize:11,
    fontWeight:700,
    color:"#f87171",
    background:"rgba(248,113,113,0.1)",
    border:"1px solid rgba(248,113,113,0.25)",
    padding:"2px 6px",
    borderRadius:6
  }}>
    ⚠ Fraud
  </span>
)}
                                  </div>
                            <div style={{ fontSize:13, fontWeight:600, color:"#cbd5e1", textTransform:"capitalize", marginBottom:4, fontFamily:"'Sora',sans-serif" }}>{c.claim_type||"General Claim"}</div>
                            <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                              {c.user_policy?.user?.name && (
                                <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                                  <Avatar name={c.user_policy.user.name} size={18} />
                                  <span style={{ fontSize:11, color:"#3d4f63", fontFamily:"'Sora',sans-serif" }}>{c.user_policy.user.name}</span>
                                </div>
                              )}
                              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:"#fbbf24", fontWeight:600 }}>{fa(c.amount_claimed)}</span>
                              {c.documents?.length>0 && <span style={{ fontSize:10.5, color:"#6366f1", fontFamily:"'Sora',sans-serif" }}>📎 {c.documents.length}</span>}
                            </div>
                          </div>
                          <div style={{ fontSize:10, color:"#1e2a3a", fontFamily:"'Sora',sans-serif", flexShrink:0, textAlign:"right" }}>
                            <div>{fd(c.created_at)}</div>
                            {c.status==="draft" && <div style={{ marginTop:4, color:"#1e2a3a", fontSize:9.5 }}>Draft — not reviewable</div>}
                          </div>
                        </div>
                      </div>
                    );
                  })
              ) : (
                fP.length===0
                  ? <div style={{ padding:48, textAlign:"center", color:"#1e2a3a", fontSize:13, fontFamily:"'Sora',sans-serif" }}>No policies found.</div>
                  : fP.map(p => {
                    const isSel = selPolicy?.id===p.id;
                    return (
                      <div key={p.id} onClick={()=>setSelPolicy(p)}
                        style={{ padding:"13px 20px", borderBottom:"1px solid rgba(255,255,255,0.03)", cursor:"pointer", background:isSel?"rgba(99,102,241,0.08)":"transparent", borderLeft:`3px solid ${isSel?"#6366f1":"transparent"}`, transition:"all 0.12s" }}
                        onMouseEnter={e=>{if(!isSel)e.currentTarget.style.background="rgba(255,255,255,0.02)";}}
                        onMouseLeave={e=>{if(!isSel)e.currentTarget.style.background="transparent";}}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:700, color:isSel?"#818cf8":"#e2e8f0" }}>#{p.policy_number||p.id}</span>
                              <Badge status={p.status} />
                            </div>
                            <div style={{ fontSize:13, fontWeight:600, color:"#cbd5e1", marginBottom:4, fontFamily:"'Sora',sans-serif" }}>{p.policy?.title}</div>
                            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                              {p.user?.name && <div style={{ display:"flex", alignItems:"center", gap:5 }}><Avatar name={p.user.name} size={18} /><span style={{ fontSize:11, color:"#3d4f63", fontFamily:"'Sora',sans-serif" }}>{p.user.name}</span></div>}
                              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:"#fbbf24", fontWeight:600 }}>{fa(p.premium)}/mo</span>
                            </div>
                          </div>
                          <div style={{ fontSize:10, color:"#1e2a3a", fontFamily:"'Sora',sans-serif", flexShrink:0, textAlign:"right" }}>
                            <div>Ends {fd(p.end_date)}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
            <div style={{ padding:"8px 20px", borderTop:"1px solid rgba(255,255,255,0.03)", fontSize:10.5, color:"#111827", fontFamily:"'Sora',sans-serif" }}>
              {tab==="claims"?`${fC.length} of ${claims.length} claims`:`${fP.length} of ${policies.length} policies`}
            </div>
          </div>

          {/* RIGHT: Detail Panel */}
          {hasDetail && (
            <div style={{ flex:1, minWidth:0, overflowY:"auto", background:"rgba(10,14,22,0.95)" }}>
              {tab==="claims" && selClaim && (
                <ClaimDetail
                  key={selClaim.id}
                  claim={selClaim}
                  onUpdated={u=>{setClaims(cs=>cs.map(c=>c.id===u.id?u:c));setSelClaim(u);load();}}
                  onClear={()=>setSelClaim(null)}
                />
              )}
              {tab==="policies" && selPolicy && (
                <PolicyDetail
                  key={selPolicy.id}
                  policy={selPolicy}
                  onUpdated={u=>{setPolicies(ps=>ps.map(p=>p.id===u.id?u:p));setSelPolicy(u);load();}}
                  onClear={()=>setSelPolicy(null)}
                />
              )}
            </div>
          )}

          {/* Empty detail placeholder when nothing selected */}
          {!hasDetail && (
            <div style={{ position:"absolute", right:0, top:0, bottom:0, width:"40%", display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none", opacity:0.4 }}>
              <EmptyDetail tab={tab} />
            </div>
          )}
        </div>

        {toast && (
          <div style={{ position:"fixed", bottom:24, right:24, zIndex:999, padding:"12px 18px", borderRadius:11, display:"flex", alignItems:"center", gap:9, fontSize:13, fontWeight:600, fontFamily:"'Sora',sans-serif", animation:"toastUp 0.28s ease", boxShadow:"0 16px 48px rgba(0,0,0,0.6)", background:toast.type==="ok"?"rgba(74,222,128,0.1)":"rgba(248,113,113,0.1)", border:`1px solid ${toast.type==="ok"?"rgba(74,222,128,0.3)":"rgba(248,113,113,0.3)"}`, color:toast.type==="ok"?"#4ade80":"#f87171" }}>
            {toast.text}
          </div>
        )}
      </div>
    </>
  );
}
