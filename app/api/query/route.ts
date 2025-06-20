import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl) throw new Error('supabaseUrl is required');
if (!supabaseKey) throw new Error('supabaseKey is required');
if (!openaiApiKey) throw new Error('openaiApiKey is required');

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openaiApiKey });

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: query,
    });

    const [{ embedding }] = embeddingResponse.data;

    const { data: documents, error } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_threshold: 0.78,
      match_count: 10,
    });

    if (error) {
      return NextResponse.json({ error: 'Supabase match_documents RPC failed', detail: error }, { status: 500 });
    }

    return NextResponse.json({ results: documents });
  } catch (err) {
    return NextResponse.json(
      { error: 'Query failed', detail: err instanceof Error ? err.message : err },
      { status: 500 }
    );
  }
}
