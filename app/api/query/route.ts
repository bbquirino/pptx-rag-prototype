import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { SupabaseVectorStore } from 'langchain/vectorstores/supabase';
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'langchain/llms/openai';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { question } = await req.json();

    if (!question) {
      return NextResponse.json({ answer: 'No question provided' }, { status: 400 });
    }

    const embeddings = new OpenAIEmbeddings();

    const vectorStore = await SupabaseVectorStore.fromExistingIndex(embeddings, {
      client: supabase,
      tableName: 'documents',
      queryName: 'match_documents',
    });

    const results = await vectorStore.similaritySearch(question, 3);

    const context = results.map((r) => r.pageContent).join('\n');

    const model = new OpenAI({ temperature: 0.3 });

    const answer = await model.call(
      `Context:\n${context}\n\nQuestion: ${question}\nAnswer:`
    );

    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Query API error:', error);
    return NextResponse.json({ answer: 'Server error.' }, { status: 500 });
  }
}
