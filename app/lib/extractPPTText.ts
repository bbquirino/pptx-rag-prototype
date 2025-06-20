import JSZip from "jszip";
import { parseStringPromise } from "xml2js";

export async function extractPPTText(arrayBuffer: ArrayBuffer): Promise<string> {
  const zip = await JSZip.loadAsync(arrayBuffer);
  let fullText = "";

  const slideRegex = /^ppt\/slides\/slide\d+\.xml$/;

  const slideFiles = Object.keys(zip.files).filter((filename) =>
    slideRegex.test(filename)
  );

  for (const filename of slideFiles) {
    const file = zip.file(filename);
    if (!file) continue;

    const content = await file.async("string");
    const parsedXml = await parseStringPromise(content);

    const texts: string[] = [];
    const extractText = (node: any) => {
      if (typeof node === "object") {
        for (const key in node) {
          if (key === "a:t" && Array.isArray(node[key])) {
            texts.push(...node[key]);
          } else {
            extractText(node[key]);
          }
        }
      }
    };

    extractText(parsedXml);
    fullText += texts.join(" ") + "\n";
  }

  return fullText.trim();
}
