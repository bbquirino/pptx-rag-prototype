import { useState } from 'react';

export function Chat() {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState('');

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = input.trim();
    setMessages([...messages, 'You: ' + userMessage]);
    setInput('');

    const res = await fetch('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: userMessage })
    });

    const data = await res.json();
    setMessages(prev => [...prev, 'Bot: ' + (data.answer || 'No response')]);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded shadow h-64 overflow-y-auto">
        {messages.map((msg, i) => (
          <div key={i} className="text-sm mb-2">{msg}</div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Ask something..."
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm"
        >
          Send
        </button>
      </div>
    </div>
  );
}
