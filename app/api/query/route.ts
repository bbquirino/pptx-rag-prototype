import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  const { query } = await req.json();

  if (!query) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  // 🧠 Placeholder response — we’ll replace this with real RAG logic soon
  return NextResponse.json({ answer: `Received query: ${query}` });
}
