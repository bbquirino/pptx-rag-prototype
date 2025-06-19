import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import pptx2json from 'pptx2json';
import { Readable } from 'stream';

// Load Supabase env vars
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper: convert file buffer to Readable stream
function bufferToStream(buffer: Buffer): Readable {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;

  if (!file || file.type !== 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  try {
    const slides = await pptx2json(bufferToStream(buffer));
    const combinedText = slides.flatMap(slide => slide.text).join(' ');

    // Create fake embedding for now
    const fakeEmbedding = Array(1536).fill(0).map(() => Math.random());

    // Upload to Supabase
    const { error } = await supabase.from('documents').insert({
      content: combinedText,
      embedding: fakeEmbedding
    });

    if (error) {
      return NextResponse.json({ error: 'Failed to insert into Supabase', detail: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Upload and embedding successful' });
  } catch (err: any) {
    return NextResponse.json({ error: 'Parsing failed', detail: err.message }, { status: 500 });
  }
}
