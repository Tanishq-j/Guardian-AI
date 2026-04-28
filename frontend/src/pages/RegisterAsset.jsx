import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  UploadCloud, CheckCircle2, Shield, Download,
  FileImage, ShieldCheck, RefreshCw, AlertCircle
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import api from '../config/api';
import Layout from '../components/layout/Layout';

const stepsList = [
  'Uploading asset...',
  'Embedding Signal A — DCT watermark...',
  'Computing Signal B — neural fingerprint...',
  'Storing in secure registry...',
  'Protected asset ready!',
];

export default function RegisterAsset() {
  const [file, setFile]                    = useState(null);
  const [orgId, setOrgId]                  = useState('demo-org');
  const [isUploading, setIsUploading]      = useState(false);
  const [currentStep, setCurrentStep]      = useState(-1);
  const [result, setResult]                = useState(null);
  const [verificationResult, setVerResult] = useState(null);
  const [isVerifying, setIsVerifying]      = useState(false);

  const onDrop = useCallback(files => {
    if (files?.length) { setFile(files[0]); setResult(null); setCurrentStep(-1); }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': ['.jpeg', '.jpg'], 'image/png': ['.png'] },
    maxFiles: 1,
  });

  const handleRegister = async () => {
    if (!file) return toast.error('Please select a file first');
    if (!orgId.trim()) return toast.error('Please enter an Organization ID');
    setIsUploading(true); setCurrentStep(0); setResult(null); setVerResult(null);
    const timers = [
      setTimeout(() => setCurrentStep(1), 800),
      setTimeout(() => setCurrentStep(2), 1600),
      setTimeout(() => setCurrentStep(3), 2400),
    ];
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('orgId', orgId);
      const res = await api.post('/api/assets/register', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setCurrentStep(4);
      setResult(res.data);
      toast.success('Asset registered with dual-signal protection');
    } catch (e) {
      toast.error(e.response?.data?.detail || e.message || 'Failed to register asset');
      setCurrentStep(-1);
    } finally {
      setIsUploading(false);
      timers.forEach(t => clearTimeout(t));
    }
  };

  const handleVerify = async () => {
    if (!result?.assetId) return;
    setIsVerifying(true);
    try {
      const res = await api.get(`/api/assets/${result.assetId}/verify-watermark`);
      setVerResult(res.data);
      if (res.data.watermarkVerified) toast.success('Watermark verified!');
      else toast.error('Watermark verification failed.');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Verification failed');
    } finally { setIsVerifying(false); }
  };

  return (
    <Layout title="Register Asset">
      <Toaster position="top-right" />
      <div style={{ maxWidth: 680 }}>
        <div className="card" style={{ padding: 28 }}>
          {/* Org ID */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Organization ID
            </label>
            <input
              type="text"
              style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)', background: 'var(--surface)', transition: 'border 150ms ease' }}
              placeholder="your-org-id"
              value={orgId}
              onChange={e => setOrgId(e.target.value)}
              disabled={isUploading}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {/* Dropzone */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Media File
            </label>
            <div
              {...getRootProps()}
              style={{ border: `2px dashed ${isDragActive ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 10, padding: '32px 20px', textAlign: 'center', cursor: 'pointer', transition: 'all 150ms ease', background: isDragActive ? '#F0F9FF' : '#FAFBFC' }}
            >
              <input {...getInputProps()} disabled={isUploading} />
              <UploadCloud size={32} color="var(--primary)" style={{ margin: '0 auto 12px', display: 'block' }} />
              {file ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <FileImage size={20} color="var(--text-muted)" />
                  <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{file.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Drop your sports media here or <span style={{ color: 'var(--primary)', fontWeight: 600 }}>click to browse</span>
                </p>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleRegister}
            disabled={!file || !orgId.trim() || isUploading}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '11px 0' }}
          >
            {isUploading ? <><RefreshCw size={14} /> Processing...</> : <><Shield size={14} /> Register &amp; Protect Asset</>}
          </button>

          {/* Progress */}
          {currentStep >= 0 && !result && (
            <div style={{ marginTop: 24, padding: 20, background: '#F8FAFC', borderRadius: 10, border: '1px solid var(--border)' }}>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: 'var(--text)' }}>Processing</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {stepsList.map((step, idx) => {
                  const isActive = idx === currentStep;
                  const isPast   = idx < currentStep;
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, color: isPast ? 'var(--success)' : isActive ? 'var(--primary)' : '#CBD5E1' }}>
                      {isPast
                        ? <CheckCircle2 size={16} />
                        : isActive
                          ? <RefreshCw size={16} style={{ animation: 'spin 0.7s linear infinite' }} />
                          : <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #CBD5E1' }} />}
                      <span style={{ fontSize: 12, fontWeight: isActive ? 600 : 400 }}>{step}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div style={{ marginTop: 24 }} className="fade-in">
              <div style={{ background: '#D1FAE5', color: '#065F46', padding: '10px 14px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, marginBottom: 16 }}>
                <CheckCircle2 size={16} /> Asset registered with dual-signal protection
              </div>
              <div className="card" style={{ gap: 14, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>ASSET ID</p>
                    <p className="font-mono" style={{ fontSize: 11, color: 'var(--text)', background: '#F8FAFC', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border)', wordBreak: 'break-all' }}>{result.assetId}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>PHASH (SIGNAL B)</p>
                    <p className="font-mono" style={{ fontSize: 11, color: 'var(--text)', background: '#F8FAFC', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border)', wordBreak: 'break-all' }}>{result.pHash}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span className="badge badge-low" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><ShieldCheck size={11} /> Signal A: Embedded</span>
                  <span className="badge badge-low" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><ShieldCheck size={11} /> Signal B: Computed</span>
                </div>
                {result.signalB?.labels?.length > 0 && (
                  <div>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>VISION API LABELS</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {result.signalB.labels.map((l, i) => (
                        <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 5, background: '#F1F5F9', border: '1px solid var(--border)', color: 'var(--text)' }}>
                          {l.description} ({Math.round(l.score * 100)}%)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                  <a href={result.downloadUrl} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ fontSize: 12 }}>
                    <Download size={13} /> Download Protected
                  </a>
                  <button onClick={handleVerify} disabled={isVerifying} className="btn btn-ghost" style={{ fontSize: 12 }}>
                    {isVerifying ? <><RefreshCw size={13} /> Verifying...</> : <><ShieldCheck size={13} /> Verify Signal A</>}
                  </button>
                </div>
                {verificationResult && (
                  <div className="fade-in" style={{ padding: 12, borderRadius: 8, background: verificationResult.watermarkVerified ? '#D1FAE5' : '#FEE2E2', border: `1px solid ${verificationResult.watermarkVerified ? '#6EE7B7' : '#FCA5A5'}` }}>
                    <p style={{ fontWeight: 600, fontSize: 12, marginBottom: 6, color: verificationResult.watermarkVerified ? '#065F46' : '#991B1B', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {verificationResult.watermarkVerified ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                      {verificationResult.watermarkVerified ? 'Verification Successful' : 'Verification Failed'}
                    </p>
                    <div className="font-mono" style={{ fontSize: 11, display: 'flex', flexDirection: 'column', gap: 3, color: '#374151' }}>
                      <span>Expected: {verificationResult.expectedPayload}</span>
                      <span>Extracted: {verificationResult.extractedPayload || 'None'}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
