import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { parseStringPromise } from 'xml2js';
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const slideText: string[] = [];

    const slideRegex = /ppt\/slides\/slide\d+\.xml/;
    const slideFiles = Object.keys(zip.files).filter((fileName) => slideRegex.test(fileName));

    for (const fileName of slideFiles) {
      const fileData = await zip.files[fileName].async('string');
      const parsedXml = await parseStringPromise(fileData);
      const texts = extractTextFromXml(parsedXml);
      slideText.push(...texts);
    }

    const fullText = slideText.join(' ');
    const chunks = chunkText(fullText, 2000);

    for (const chunk of chunks) {
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: chunk,
      });

      const embedding = embeddingResponse.data[0].embedding;

      await supabase.from('documents').insert({
        content: chunk,
        embedding,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', detail: (error as Error).message },
      { status: 500 }
    );
  }
}

function extractTextFromXml(xml: any): string[] {
  const texts: string[] = [];

  function recursiveExtract(obj: any) {
    if (typeof obj === 'string') {
      texts.push(obj);
    } else if (Array.isArray(obj)) {
      for (const item of obj) {
        recursiveExtract(item);
      }
    } else if (typeof obj === 'object') {
      for (const key in obj) {
        recursiveExtract(obj[key]);
      }
    }
  }

  recursiveExtract(xml);
  return texts;
}

function chunkText(text: string, maxTokens: number): string[] {
  const words = text.split(/\s+/);
  const approxTokensPerWord = 0.75;
  const maxWords = Math.floor(maxTokens / approxTokensPerWord);

  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += maxWords) {
    const chunk = words.slice(i, i + maxWords).join(' ');
    chunks.push(chunk);
  }

  return chunks;
}
