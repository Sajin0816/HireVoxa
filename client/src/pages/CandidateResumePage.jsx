import React, { useEffect, useRef, useState } from 'react';
import { Download, FileText, ShieldCheck, Trash2, Upload } from 'lucide-react';
import { api } from '../services/api';
import Button from '../components/common/Button';

export default function CandidateResumePage() {
  const inputRef = useRef(null);
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const load = () => api.getMyResume().then((res) => setResume(res.data)).catch((err) => setFeedback({ type: 'error', text: err.message })).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);
  const upload = async (event) => {
    const file = event.target.files?.[0]; if (!file) return; setBusy(true); setFeedback({ type: '', text: '' });
    try { const res = await api.uploadMyResume(file); setResume(res.data); setFeedback({ type: 'success', text: 'Resume uploaded securely.' }); } catch (err) { setFeedback({ type: 'error', text: err.message || 'Upload failed.' }); } finally { setBusy(false); event.target.value = ''; }
  };
  const download = async () => { setBusy(true); try { const blob = await api.downloadResume(resume._id); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = resume.originalName; anchor.click(); URL.revokeObjectURL(url); } catch (err) { setFeedback({ type: 'error', text: err.message }); } finally { setBusy(false); } };
  const remove = async () => { if (!resume) return; setBusy(true); try { await api.deleteMyResume(resume._id); setResume(null); setFeedback({ type: 'success', text: 'Resume deleted.' }); } catch (err) { setFeedback({ type: 'error', text: err.message }); } finally { setBusy(false); } };
  if (loading) return <div className="py-20 text-center text-sm text-[#777777]">Loading resume settings…</div>;
  return <div className="mx-auto max-w-3xl space-y-7"><div><p className="text-xs uppercase tracking-[0.2em] text-[#777777]">Private document</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Your resume.</h1><p className="mt-2 text-sm text-[#A3A3A3]">Upload one current resume for applications. Files are stored outside the public web directory and access is authorized per request.</p></div>{feedback.text && <div role="status" className={`rounded-xl border p-3.5 text-sm ${feedback.type === 'error' ? 'border-[#EF4444]/30 bg-[#EF4444]/10 text-[#F87171]' : 'border-[#10B981]/30 bg-[#10B981]/10 text-[#34D399]'}`}>{feedback.text}</div>}<section className="rounded-2xl border border-[#303030] bg-[#1B1B1B] p-6"><div className="flex items-start gap-4"><div className="rounded-xl bg-[#202020] p-3"><ShieldCheck className="h-6 w-6 text-[#34D399]" /></div><div><h2 className="font-semibold">Private by default</h2><p className="mt-1 text-xs leading-5 text-[#888888]">Only you can download this file. A company can access it only after you submit an application to one of its jobs that references this resume.</p></div></div><input ref={inputRef} type="file" accept=".pdf,application/pdf" onChange={upload} className="hidden" />{resume ? <div className="mt-6 flex flex-col justify-between gap-4 rounded-xl border border-[#303030] bg-[#202020] p-4 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><FileText className="h-5 w-5 text-[#A3A3A3]" /><div><p className="text-sm font-semibold">{resume.originalName}</p><p className="mt-1 text-xs text-[#777777]">Version {resume.version} · {(resume.size / 1024 / 1024).toFixed(2)} MB</p></div></div><div className="flex gap-2"><Button size="sm" variant="secondary" onClick={download} loading={busy} icon={Download}>Download</Button><Button size="sm" variant="danger" onClick={remove} disabled={busy} icon={Trash2}>Delete</Button></div></div> : <div className="mt-6 rounded-xl border border-dashed border-[#505050] p-8 text-center"><FileText className="mx-auto h-7 w-7 text-[#777777]" /><p className="mt-3 text-sm font-semibold">No resume uploaded</p><p className="mt-1 text-xs text-[#777777]">PDF, up to 5 MB.</p></div>}<div className="mt-5"><Button variant="outline" onClick={() => inputRef.current?.click()} loading={busy} icon={Upload}>{resume ? 'Replace resume' : 'Upload resume'}</Button></div></section></div>;
}
