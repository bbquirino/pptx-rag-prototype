'use client'

import { useState } from 'react';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('');

  const handleUpload = async () => {
    if (!file) {
      setStatus('Please select a file first.');
      return;
    }

    setStatus('Uploading...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }

      const data = await res.json();
      setStatus(`✅ Upload successful: ${data.insertedCount} slides inserted.`);
    } catch (err: any) {
      setStatus(`❌ Upload failed: ${err.message}`);
    }
  };

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Upload Economic PPTX File</h1>
      <input
        type="file"
        accept=".pptx"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <button onClick={handleUpload} style={{ marginLeft: '1rem' }}>
        Upload
      </button>
      {status && <p style={{ marginTop: '1rem' }}>{status}</p>}
    </main>
  );
}
