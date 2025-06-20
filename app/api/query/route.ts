import { NextResponse } from 'next/server';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { SupabaseVectorStore } from 'langchain/vectorstores/supabase';
import { OpenAI } from 'langchain/llms/openai';
import { ConversationalRetrievalQAChain } from 'langchain/chains';
import { createClient } from '@supabase/supabase-js';
import { BufferMemory } from 'langchain/memory';
import { ChatOpenAI } from 'langchain/chat_models/openai';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    const privateKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!privateKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');

    const client = createClient(
      process.env.SUPABASE_URL!,
      privateKey
    );

    const vectorStore = await SupabaseVectorStore.fromExistingIndex(
      new OpenAIEmbeddings(),
      {
        client,
        tableName: 'documents',
        queryName: 'match_documents',
      }
    );

    const model = new ChatOpenAI({ temperature: 0 });
    const chain = ConversationalRetrievalQAChain.fromLLM(
      model,
      vectorStore.asRetriever(),
      {
        memory: new BufferMemory({
          memoryKey: 'chat_history',
          returnMessages: true,
        }),
      }
    );

    const response = await chain.call({ question: query });
    return NextResponse.json({ answer: response.text });
  } catch (error: any) {
    console.error('Error in query route:', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
