import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import JSZip from 'jszip';
import { parseStringPromise } from 'xml2js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const openaiKey = process.env.OPENAI_API_KEY!;

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Invalid content-type' },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file || file.type !== 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      return NextResponse.json({ error: 'Invalid PPTX file' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    const slideTexts: string[] = [];

    const slideFiles = Object.keys(zip.files).filter(name =>
      name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
    );

    for (const slideName of slideFiles) {
      const xmlContent = await zip.files[slideName].async('string');
      const parsed = await parseStringPromise(xmlContent);
      const textRuns = parsed['p:sld']['p:cSld'][0]['p:spTree'][0]['p:sp'] || [];
      for (const shape of textRuns) {
        try {
          const paragraphs =
            shape['p:txBody']?.[0]['a:p'] || [];
          for (const p of paragraphs) {
            const runs = p['a:r'] || [];
            for (const r of runs) {
              const text = r['a:t']?.[0];
              if (text) slideTexts.push(text);
            }
          }
        } catch {}
      }
    }

    const combinedText = slideTexts.join(' ').trim();

    if (!combinedText) {
      return NextResponse.json({ error: 'No text extracted from PPTX' }, { status: 400 });
    }

    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: combinedText,
        model: 'text-embedding-ada-002'
      })
    });

    if (!embeddingResponse.ok) {
      const err = await embeddingResponse.json();
      console.error('OpenAI error:', err);
      return NextResponse.json({ error: 'Embedding failed', detail: err }, { status: 500 });
    }

    const { data } = await embeddingResponse.json();
    const embedding = data[0].embedding;

    const { error: dbError } = await supabase.from('documents').insert([
      {
        content: combinedText,
        embedding
      }
    ]);

    if (dbError) {
      console.error('Supabase insert error:', dbError);
      return NextResponse.json({ error: 'Failed to save document', detail: dbError }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (err) {
    console.error('Unexpected upload error:', err);
    return NextResponse.json({ error: 'Unexpected server error', detail: String(err) }, { status: 500 });
  }
}
