'use client';

import { useState } from 'react';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) return;

    setStatus('uploading');
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.detail || 'Upload failed');
      }

      setStatus('success');
    } catch (err: any) {
      console.error('Upload error:', err);
      setStatus('error');
      setError(err.message || 'Unknown error');
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Upload a PPTX File</h1>
      <input
        type="file"
        accept=".pptx"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button onClick={handleUpload} style={{ marginLeft: '1rem' }}>
        Upload
      </button>

      <div style={{ marginTop: '1rem' }}>
        {status === 'uploading' && <p>Uploading...</p>}
        {status === 'success' && <p style={{ color: 'green' }}>✅ Upload succeeded!</p>}
        {status === 'error' && <p style={{ color: 'red' }}>❌ Upload failed: {error}</p>}
      </div>
    </div>
  );
}
