// pages/index.tsx
import { useState } from "react";
import Head from "next/head";

export default function Home() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setResponse(null);
    setError(null);
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      });
      if (!res.ok) throw new Error("Failed to fetch answer");
      const data = await res.json();
      setResponse(data.answer);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Alberta Perspectives Assistant</title>
      </Head>
      <main className="min-h-screen bg-gray-100 p-8">
        <h1 className="text-2xl font-semibold mb-6">Economic Insights Chat</h1>
        <div className="flex flex-col max-w-xl gap-4">
          <textarea
            rows={4}
            className="border p-2 rounded shadow-sm"
            placeholder="Ask something about Alberta’s business landscape..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            onClick={handleSubmit}
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            disabled={loading || !query.trim()}
          >
            {loading ? "Loading..." : "Submit"}
          </button>
          {response && (
            <div className="mt-4 p-4 bg-white shadow rounded">
              <h2 className="font-bold mb-2">Answer:</h2>
              <p className="whitespace-pre-wrap">{response}</p>
            </div>
          )}
          {error && <p className="text-red-600">{error}</p>}
        </div>
      </main>
    </>
  );
}
