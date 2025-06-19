'use client';

import React, { useState } from 'react';
import JSZip from 'jszip';
import { parseStringPromise } from 'xml2js';

export default function UploadPage() {
  const [status, setStatus] = useState('');

  const extractTextFromPptx = async (file: File): Promise<string> => {
    const zip = await JSZip.loadAsync(file);
    const slideTexts: string[] = [];

    const slideRegex = /^ppt\/slides\/slide\d+\.xml$/;

    const slideFiles = Object.keys(zip.files).filter(name => slideRegex.test(name));

    for (const filename of slideFiles) {
      const xmlContent = await zip.files[filename].async('text');
      const parsed = await parseStringPromise(xmlContent);
      const texts = extractTextFromXml(parsed);
      slideTexts.push(texts.join(' '));
    }

    return slideTexts.join('\n\n');
  };

  const extractTextFromXml = (parsed: any): string[] => {
    const textElements: string[] = [];

    const extract = (node: any) => {
      if (typeof node === 'object') {
        for (const key in node) {
          if (key === 'a:t' && Array.isArray(node[key])) {
            textElements.push(node[key].join(' '));
          } else {
            extract(node[key]);
          }
        }
      }
    };

    extract(parsed);
    return textElements;
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus('Processing...');

    try {
      const text = await extractTextFromPptx(file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: JSON.stringify({ filename: file.name, text }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      setStatus('Upload and extraction successful!');
    } catch (err) {
      console.error(err);
      setStatus('Error during upload or processing.');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Upload a PPTX File</h1>
      <input type="file" accept=".pptx" onChange={handleUpload} />
      <p className="mt-4 text-sm text-gray-700">{status}</p>
    </div>
  );
}
