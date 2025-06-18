import { useState } from "react";

export function Chat() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitQuery = async () => {
    setLoading(true);
    setResponse(null);
    setError(null);

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      });
      if (!res.ok) throw new Error("Query failed");
      const data = await res.json();
      setResponse(data.answer);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">Ask a question</h1>
      <textarea
        rows={4}
        className="w-full border rounded p-2"
        placeholder="Ask me anything about Alberta’s economy..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button
        onClick={submitQuery}
        disabled={loading || !query.trim()}
        className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Loading..." : "Submit"}
      </button>

      {response && (
        <div className="mt-6 p-4 bg-white border rounded shadow-sm">
          <h2 className="font-semibold mb-2">Answer:</h2>
          <p className="whitespace-pre-wrap">{response}</p>
        </div>
      )}

      {error && <p className="mt-4 text-red-600">Error: {error}</p>}
    </div>
  );
}
