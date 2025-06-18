// app/api/query/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  const { query } = await req.json();

  if (!query) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  // Step 1: Embed the query using OpenAI
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: query,
  });

  const [{ embedding }] = embeddingResponse.data;

  // Step 2: Query the Supabase 'documents' table for the most similar entries
  const { data: documents, error } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_threshold: 0.75,
    match_count: 3,
  });

  if (error) {
    console.error('Supabase RPC error:', error);
    return NextResponse.json({ error: 'Supabase error' }, { status: 500 });
  }

  // Step 3: Build a context string and pass to OpenAI for completion
  const context = documents.map((doc: any) => doc.content).join('\n---\n');

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are an economic research assistant for Alberta. Answer only based on the given context.',
      },
      {
        role: 'user',
        content: `Context:\n${context}\n\nQuestion: ${query}`,
      },
    ],
    temperature: 0.3,
  });

  const answer = completion.choices[0]?.message?.content || 'No answer found.';

  return NextResponse.json({ answer });
}
