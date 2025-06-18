import { NextResponse } from 'next/server';

let supabase: any;
if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  const { createClient } = require('@supabase/supabase-js');
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
} else {
  throw new Error("Supabase environment variables not found");
}

export async function POST(req: Request) {
  const { query } = await req.json();

  if (!query) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      input: query,
      model: "text-embedding-ada-002"
    }),
  });

  const embeddingData = await embeddingResponse.json();

  if (!embeddingData?.data?.[0]?.embedding) {
    return NextResponse.json({ error: 'Failed to get embedding from OpenAI' }, { status: 500 });
  }

  const queryEmbedding = embeddingData.data[0].embedding;

  const { data: matches, error } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_threshold: 0.78,
    match_count: 5
  });

  if (error) {
    return NextResponse.json({ error: 'Supabase match_documents RPC failed', details: error }, { status: 500 });
  }

  const contextText = matches.map((doc: any) => doc.content).join('\n');

  const chatResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant for economic research." },
        { role: "user", content: `Context: ${contextText}\n\nQuestion: ${query}` }
      ],
    }),
  });

  const chatData = await chatResponse.json();

  if (!chatData?.choices?.[0]?.message?.content) {
    return NextResponse.json({ error: 'Failed to get answer from OpenAI chat' }, { status: 500 });
  }

  return NextResponse.json({ answer: chatData.choices[0].message.content });
}
