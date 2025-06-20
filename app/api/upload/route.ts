import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { OpenAI } from 'openai'
import extractPPTText from '../../lib/extractPPTText'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const rawTexts = await extractPPTText(buffer)

    // Reduce context length to 2000 tokens-worth (safe estimate ~8000 chars total)
    const cleanedTexts = rawTexts.map(text => text.replace(/\s+/g, ' ').trim()).filter(Boolean)
    const limitedTexts = []
    let totalLength = 0

    for (const text of cleanedTexts) {
      if (totalLength + text.length > 8000) break
      limitedTexts.push(text)
      totalLength += text.length
    }

    for (const text of limitedTexts) {
      const embeddingRes = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      })

      const [{ embedding }] = embeddingRes.data

      await supabase.from('documents').insert({
        content: text,
        embedding,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Upload failed', detail: error.message || String(error) },
      { status: 500 }
    )
  }
}
