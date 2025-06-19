import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import JSZip from 'jszip';
import { Parser } from 'xml2js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Invalid content type', detail: 'Expected multipart/form-data' },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file || file.type !== 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      return NextResponse.json(
        { error: 'Invalid file', detail: 'Must be a .pptx file' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const zip = await JSZip.loadAsync(buffer);

    const slideTexts: string[] = [];
    const parser = new Parser();

    const slideFiles = Object.keys(zip.files).filter((name) =>
      name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
    );

    for (const name of slideFiles) {
      const xmlContent = await zip.files[name].async('string');
      const result = await parser.parseStringPromise(xmlContent);
      const textElements = result['p:sld']?.['p:cSld']?.[0]?.['p:spTree']?.[0]?.['p:sp'] || [];

      for (const sp of textElements) {
        const paragraphs = sp?.['p:txBody']?.[0]?.['a:p'] || [];
        for (const p of paragraphs) {
          const texts = p['a:r']?.map((r: any) => r['a:t']?.[0]).filter(Boolean) || [];
          slideTexts.push(...texts);
        }
      }
    }

    const combinedText = slideTexts.join(' ').trim();

    if (!combinedText) {
      return NextResponse.json(
        { error: 'Parsing failed', detail: 'No text content extracted from slides' },
        { status: 400 }
      );
    }

    // Insert into Supabase with fake embedding for now
    const embedding = Array.from({ length: 1536 }, () => Math.random());

    const { error } = await supabase.from('documents').insert([
      {
        content: combinedText,
        embedding,
      },
    ]);

    if (error) {
      console.error('[Supabase Insert Error]', error);
      return NextResponse.json(
        { error: 'Database error', detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Upload and parse succeeded' });
  } catch (err: any) {
    console.error('[Upload Handler Error]', err);
    return NextResponse.json(
      {
        error: 'Upload failed',
        detail: err?.message || 'Unexpected error',
      },
      { status: 500 }
    );
  }
}
