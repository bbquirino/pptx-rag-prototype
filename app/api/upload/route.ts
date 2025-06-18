import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import { read } from 'pptx-parser'; // assumes you installed 'pptx-parser'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file || !file.name.endsWith('.pptx')) {
      return NextResponse.json({ error: 'Invalid file' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const slides = await read(buffer);

    const allText = slides.map((s) => s.text).join('\n').trim();
    if (!allText) {
      return NextResponse.json({ error: 'No readable content' }, { status: 400 });
    }

    const embeddingRes = await openai.embeddings.create({
      input: allText,
      model: 'text-embedding-ada-002',
    });

    const [{ embedding }] = embeddingRes.data;

    const { error } = await supabase.from('documents').insert([
      { content: allText, embedding },
    ]);

    if (error) {
      console.error('[Supabase]', error.message);
      return NextResponse.json({ error: 'DB insert failed' }, { status: 500 });
    }

    return NextResponse.json({ status: 'ok' });
  } catch (e: any) {
    console.error('[Upload Error]', e.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
