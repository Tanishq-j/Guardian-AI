import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, CheckCircle2, Shield, Download, FileImage, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import api from '../config/api';

const stepsList = [
  "Uploading asset...",
  "Embedding Signal A — DCT watermark...",
  "Computing Signal B — neural fingerprint...",
  "Storing in secure registry...",
  "Protected asset ready!"
];

export default function RegisterAsset() {
  const [file, setFile] = useState(null);
  const [orgId, setOrgId] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [result, setResult] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles?.length > 0) {
      setFile(acceptedFiles[0]);
      setResult(null);
      setCurrentStep(-1);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png']
    },
    maxFiles: 1
  });

  const handleRegister = async () => {
    if (!file) return toast.error("Please select a file first");
    if (!orgId.trim()) return toast.error("Please enter an Organization ID");

    setIsUploading(true);
    setCurrentStep(0);
    setResult(null);
    setVerificationResult(null);

    const timers = [];
    timers.push(setTimeout(() => setCurrentStep(1), 800));
    timers.push(setTimeout(() => setCurrentStep(2), 1600));
    timers.push(setTimeout(() => setCurrentStep(3), 2400));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('orgId', orgId);

      const response = await api.post('/api/assets/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setCurrentStep(4);
      setResult(response.data);
      toast.success("Asset registered with dual-signal protection");
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.detail || error.message || "Failed to register asset";
      toast.error(msg);
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
      const response = await api.get(`/api/assets/${result.assetId}/verify-watermark`);
      setVerificationResult(response.data);
      if (response.data.watermarkVerified) toast.success("Watermark verified successfully!");
      else toast.error("Watermark verification failed.");
    } catch (error) {
       toast.error(error.response?.data?.detail || "Verification failed");
    } finally {
       setIsVerifying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <Toaster position="top-right" />
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
          <Shield className="w-6 h-6 mr-2 text-[#38BDF8]" />
          Register New Asset
        </h2>

        {/* Section 1 & 2 - Inputs */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Organization ID</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#38BDF8] focus:border-[#38BDF8] outline-none transition-colors"
              placeholder="your-org-id"
              value={orgId}
              onChange={e => setOrgId(e.target.value)}
              disabled={isUploading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Media File</label>
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-[#38BDF8] bg-sky-50' : 'border-slate-300 hover:border-[#38BDF8] bg-slate-50'}`}
            >
              <input {...getInputProps()} disabled={isUploading} />
              <UploadCloud className="w-12 h-12 mx-auto mb-4 text-[#38BDF8]" />
              {file ? (
                <div className="flex flex-col items-center">
                  <FileImage className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="text-slate-700 font-medium">{file.name}</p>
                  <p className="text-slate-500 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <p className="text-slate-600 font-medium">Drop your sports media here or click to browse</p>
              )}
            </div>
          </div>

          <button
            onClick={handleRegister}
            disabled={!file || !orgId.trim() || isUploading}
            className="w-full py-3 bg-[#38BDF8] hover:bg-sky-500 text-white font-semibold rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex justify-center items-center"
          >
            {isUploading ? (
              <><RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
            ) : (
              'Register & Protect Asset'
            )}
          </button>
        </div>

        {/* Section 4 - Progress */}
        {currentStep >= 0 && !result && (
          <div className="mt-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-4">Processing Status</h3>
            <div className="space-y-3">
              {stepsList.map((step, idx) => {
                const isActive = idx === currentStep;
                const isPast = idx < currentStep;
                return (
                  <div key={idx} className={`flex items-center ${isPast ? 'text-emerald-600' : isActive ? 'text-[#38BDF8]' : 'text-slate-400'}`}>
                    {isPast ? (
                      <CheckCircle2 className="w-5 h-5 mr-3" />
                    ) : isActive ? (
                      <RefreshCw className="w-5 h-5 mr-3 animate-spin" />
                    ) : (
                      <div className="w-5 h-5 mr-3 rounded-full border-2 border-slate-300" />
                    )}
                    <span className={isActive ? 'font-medium' : ''}>{step}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 5 - Result */}
        {result && (
          <div className="mt-8 space-y-6">
            <div className="bg-emerald-50 text-emerald-700 p-4 rounded-lg flex items-center border border-emerald-200">
              <CheckCircle2 className="w-6 h-6 mr-3 text-emerald-500" />
              <span className="font-medium">Asset registered with dual-signal protection</span>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Asset ID</p>
                  <p className="font-mono text-sm text-slate-800 break-all bg-slate-50 p-2 rounded border border-slate-100">{result.assetId}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Perceptual Hash</p>
                  <p className="font-mono text-sm text-slate-800 break-all bg-slate-50 p-2 rounded border border-slate-100">{result.pHash}</p>
                </div>
              </div>

              <div className="flex gap-4 py-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 mr-1" /> Signal A: Watermark embedded
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 mr-1" /> Signal B: Neural fingerprint computed
                </span>
              </div>

              <div>
                <p className="text-sm text-slate-500 mb-2">Vision API Detected Labels</p>
                <div className="flex flex-wrap gap-2">
                  {result.signalB?.labels?.map((label, idx) => (
                    <span key={idx} className="px-2 py-1 bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-md shadow-sm">
                      {label.description} ({(label.score * 100).toFixed(0)}%)
                    </span>
                  ))}
                  {(!result.signalB?.labels || result.signalB.labels.length === 0) && (
                    <span className="text-sm text-slate-400 italic">No labels detected</span>
                  )}
                </div>
              </div>

              <div className="pt-6 flex flex-wrap gap-4 border-t border-slate-100">
                <a
                  href={result.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Protected Asset
                </a>
                
                <button
                  onClick={handleVerify}
                  disabled={isVerifying}
                  className="inline-flex items-center px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg transition-colors text-sm font-medium shadow-sm"
                >
                  {isVerifying ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                  Verify Signal A
                </button>
              </div>

              {verificationResult && (
                <div className={`mt-4 p-4 rounded-lg border ${verificationResult.watermarkVerified ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                  <div className="flex items-center mb-2">
                    {verificationResult.watermarkVerified ? <CheckCircle2 className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}
                    <span className="font-semibold">
                      {verificationResult.watermarkVerified ? 'Verification Successful' : 'Verification Failed'}
                    </span>
                  </div>
                  <div className="text-sm space-y-1 mt-2 font-mono">
                    <p><span className="text-slate-500 font-sans">Expected:</span> {verificationResult.expectedPayload}</p>
                    <p><span className="text-slate-500 font-sans">Extracted:</span> {verificationResult.extractedPayload || 'None'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
