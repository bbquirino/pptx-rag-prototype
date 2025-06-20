// app/api/upload/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import JSZip from "jszip";
import { parseStringPromise } from "xml2js";

// DEBUG: Confirm OpenAI key is injected
console.log("ACTIVE OPENAI KEY", process.env.OPENAI_API_KEY);

// Init Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Init OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "Invalid content type. Must be multipart/form-data." },
      { status: 400 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file || file.type !== "application/vnd.openxmlformats-officedocument.presentationml.presentation") {
      return NextResponse.json({ error: "Invalid file type. Only PPTX allowed." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const zip = await JSZip.loadAsync(buffer);

    let extractedText = "";

    const slidePromises = Object.keys(zip.files)
      .filter((filename) => filename.startsWith("ppt/slides/slide") && filename.endsWith(".xml"))
      .map(async (filename) => {
        const xml = await zip.files[filename].async("string");
        const parsed = await parseStringPromise(xml);
        const texts: string[] = [];

        function extractText(node: any) {
          if (typeof node === "object") {
            for (const key in node) {
              if (key === "a:t") {
                if (Array.isArray(node[key])) {
                  texts.push(...node[key]);
                }
              } else {
                extractText(node[key]);
              }
            }
          }
        }

        extractText(parsed);
        return texts.join(" ");
      });

    const slideTexts = await Promise.all(slidePromises);
    extractedText = slideTexts.join(" ");

    // Embed content
    const embedding = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: extractedText,
    });

    const { error } = await supabase.from("documents").insert([
      {
        content: extractedText,
        embedding: embedding.data[0].embedding,
      },
    ]);

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Database insert failed", detail: error }, { status: 500 });
    }

    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Embedding failed", detail: err }, { status: 500 });
  }
}
