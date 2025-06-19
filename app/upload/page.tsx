'use client';

import { useState } from 'react';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<null | { success: boolean; message: string }>(null);

  const handleUpload = async () => {
    if (!file) {
      setStatus({ success: false, message: 'No file selected.' });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorResult = await res.json().catch(() => ({ error: 'Unknown error' }));
        setStatus({ success: false, message: `Upload failed: ${JSON.stringify(errorResult)}` });
        return;
      }

      const result = await res.json();
      setStatus({ success: true, message: 'Upload succeeded!' });
    } catch (error) {
      setStatus({ success: false, message: `Upload error: ${JSON.stringify(error)}` });
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Upload a PPTX File</h1>
      <input
        type="file"
        accept=".pptx"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        style={{ marginRight: '1rem' }}
      />
      <button onClick={handleUpload}>Upload</button>

      {status && (
        <div style={{ marginTop: '1rem', color: status.success ? 'green' : 'red' }}>
          {status.success ? '✅' : '❌'} {status.message}
        </div>
      )}
    </div>
  );
}
