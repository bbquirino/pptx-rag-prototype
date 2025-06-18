import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Missing query' }, { status: 400 });
    }

    // Get embedding
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });

    const [{ embedding }] = embeddingResponse.data;

    // Query Supabase
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_threshold: 0.78,
      match_count: 5,
    });

    if (error) {
      console.error('[Supabase Error]', error.message);
      return NextResponse.json({ error: 'Supabase error' }, { status: 500 });
    }

    const context = data.map((doc: any) => doc.content).join('\n\n');

    // Ask OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an assistant helping with Alberta economic insights. Use only the context provided.`,
        },
        {
          role: 'user',
          content: `Context:\n${context}\n\nQuestion: ${query}`,
        },
      ],
    });

    const answer = completion.choices[0].message.content;

    return NextResponse.json({ answer });
  } catch (err: any) {
    console.error('[Server Error]', err.message || err.toString());
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
