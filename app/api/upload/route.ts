import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import JSZip from "jszip";
import { parseStringPromise } from "xml2js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

console.log("🔑 Using OpenAI key starting with:", process.env.OPENAI_API_KEY?.slice(0, 12));

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";

  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Unsupported content type" }, { status: 400 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const slideTexts: string[] = [];

    const slideFileNames = Object.keys(zip.files).filter((name) =>
      name.match(/^ppt\/slides\/slide\d+\.xml$/)
    );

    for (const fileName of slideFileNames) {
      const xmlContent = await zip.files[fileName].async("string");
      const parsedXml = await parseStringPromise(xmlContent);
      const texts = extractText(parsedXml);
      slideTexts.push(...texts);
    }

    const combinedText = slideTexts.join(" ");

    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: combinedText,
    });

    const embedding = embeddingResponse.data[0]?.embedding;

    if (!embedding) {
      return NextResponse.json({ error: "Embedding failed" }, { status: 500 });
    }

    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/documents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apiKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      },
      body: JSON.stringify({
        content: combinedText,
        embedding,
      }),
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      return NextResponse.json({ error: "Failed to insert into Supabase", detail: errorDetails }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("❌ Upload error:", err);
    return NextResponse.json(
      {
        error: err?.message || "Unknown error",
        detail: err?.response?.data || err?.stack || null,
      },
      { status: 500 }
    );
  }
}

function extractText(obj: any): string[] {
  let texts: string[] = [];

  if (typeof obj === "string") {
    return [obj];
  }

  if (Array.isArray(obj)) {
    for (const item of obj) {
      texts.push(...extractText(item));
    }
  } else if (typeof obj === "object" && obj !== null) {
    for (const key in obj) {
      texts.push(...extractText(obj[key]));
    }
  }

  return texts;
}
