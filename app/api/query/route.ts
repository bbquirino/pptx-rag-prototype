import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Configuration, OpenAIApi } from 'openai';

// ⛑ Safely load env variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseKey || !openaiKey) {
  console.error('Missing one or more required environment variables.');
}

const supabase = createClient(supabaseUrl!, supabaseKey!);
const openai = new OpenAIApi(new Configuration({ apiKey: openaiKey! }));

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query) {
      console.warn('No query received.');
      return NextResponse.json({ error: 'Missing query' }, { status: 400 });
    }

    console.log('Query:', query);

    // 🔍 Get OpenAI embedding for query
    const embeddingResponse = await openai.createEmbedding({
      model: 'text-embedding-ada-002',
      input: query,
    });

    const [{ embedding }] = embeddingResponse.data.data;
    console.log('Generated embedding:', embedding.slice(0, 5), '...');

    // 📡 Query Supabase using the pgvector extension
    const { data: documents, error } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: 1,
    });

    if (error) {
      console.error('Supabase match_documents error:', error.message);
      return NextResponse.json({ error: 'Supabase error' }, { status: 500 });
    }

    if (!documents || documents.length === 0) {
      console.log('No matching documents found.');
      return NextResponse.json({ answer: 'No relevant information found.' });
    }

    const context = documents[0].content;
    console.log('Matched context:', context.slice(0, 100), '...');

    // 💬 Ask OpenAI using retrieved context
    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an assistant answering economic questions about Alberta.',
        },
        {
          role: 'user',
          content: `Using this context, answer: ${query}\n\nContext:\n${context}`,
        },
      ],
    });

    const answer = completion.data.choices[0].message?.content;
    console.log('AI response:', answer);

    return NextResponse.json({ answer });
  } catch (err: any) {
    console.error('Unexpected error:', err.message);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}
