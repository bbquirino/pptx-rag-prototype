import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { extractPPTXText } from "@/lib/extractPPTXText";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file || !file.name.endsWith(".pptx")) {
      return NextResponse.json({ error: "Only .pptx files are supported." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const extractedText = await extractPPTXText(arrayBuffer);

    const filename = file.name.replace(/\.pptx$/i, "").replace(/\s+/g, "-").toLowerCase();
    const docId = `${filename}-${Date.now()}`;

    const { error: insertError } = await supabase.from("documents").insert([
      {
        id: docId,
        name: file.name,
        content: extractedText
      }
    ]);

    if (insertError) {
      console.error("Error saving to Supabase:", insertError.message);
      return NextResponse.json({ error: "Failed to save to database." }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: docId });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Unexpected error occurred." }, { status: 500 });
  }
}
