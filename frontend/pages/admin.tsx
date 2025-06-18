import { useEffect, useState } from "react";
import Head from "next/head";

type DocumentMeta = {
  filename: string;
  size_kb: number;
};

export default function Admin() {
  const [docs, setDocs] = useState<DocumentMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/list-documents")
      .then((res) => res.json())
      .then((data) => setDocs(data))
      .catch(() => setError("Failed to fetch document list"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Head>
        <title>Admin Dashboard</title>
      </Head>
      <main className="min-h-screen p-8">
        <h1 className="text-2xl font-bold mb-6">📊 Document Index Dashboard</h1>
        {loading && <p>Loading document list...</p>}
        {error && <p className="text-red-600">{error}</p>}
        <ul className="mt-4">
          {docs.map((doc, idx) => (
            <li key={idx} className="mb-2">
              <span className="font-medium">{doc.filename}</span> — {doc.size_kb.toFixed(2)} KB
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
