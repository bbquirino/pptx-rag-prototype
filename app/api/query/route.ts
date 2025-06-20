import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { SupabaseVectorStore } from 'langchain/vectorstores/supabase';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { RunnableSequence } from 'langchain/schema/runnable';
import { StringOutputParser } from 'langchain/schema/output_parser';
import { supabase } from '@/lib/supabase';

export const runtime = 'edge';

export async function POST(req: Request): Promise<Response> {
  const body = await req.json();
  const query = body.query;

  if (!query) {
    return new Response(JSON.stringify({ error: 'Missing query' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const vectorstore = await SupabaseVectorStore.fromExistingIndex(
      new OpenAIEmbeddings(),
      {
        client: supabase,
        tableName: 'documents',
        queryName: 'match_documents',
      }
    );

    const retriever = vectorstore.asRetriever();

    const model = new ChatOpenAI({ temperature: 0 });

    const chain = RunnableSequence.from([
      retriever,
      model,
      new StringOutputParser(),
    ]);

    const response = await chain.invoke(query);

    return new Response(JSON.stringify({ response }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in POST /api/query:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
