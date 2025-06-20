import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { SupabaseVectorStore } from 'langchain/vectorstores/supabase';
import { OpenAI } from 'langchain/llms/openai';
import { RunnableSequence } from 'langchain/schema/runnable';
import { StringOutputParser } from 'langchain/schema/output_parser';
import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';

const client: SupabaseClient = createClient();

export async function POST(req: Request): Promise<Response> {
  try {
    const { query } = await req.json();

    const vectorstore = await SupabaseVectorStore.fromExistingIndex(
      new OpenAIEmbeddings(),
      {
        client,
        tableName: 'documents',
        queryName: 'match_documents',
      }
    );

    const retriever = vectorstore.asRetriever();

    const model = new OpenAI({
      temperature: 0,
      modelName: 'gpt-3.5-turbo',
    });

    const chain = RunnableSequence.from([
      retriever,
      (docs) => docs.map((doc) => doc.pageContent).join('\n'),
      new StringOutputParser(),
      model,
    ]);

    const answer = await chain.invoke(query);

    return new Response(JSON.stringify({ answer }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}
