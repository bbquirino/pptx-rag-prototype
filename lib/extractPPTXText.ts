import JSZip from "jszip";
import { parseStringPromise } from "xml2js";

/**
 * Extracts readable text content from a .pptx file buffer.
 * Filters out formatting XML and returns a single concatenated string of slide text.
 */
export async function extractPPTXText(buffer: ArrayBuffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const slideTextList: string[] = [];

  const slideFileNames = Object.keys(zip.files)
    .filter((filename) => filename.match(/^ppt\/slides\/slide\d+\.xml$/))
    .sort((a, b) => {
      const aNum = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || "0", 10);
      const bNum = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || "0", 10);
      return aNum - bNum;
    });

  for (const filename of slideFileNames) {
    const xmlContent = await zip.file(filename)?.async("text");
    if (!xmlContent) continue;

    try {
      const parsedXml = await parseStringPromise(xmlContent);
      const textRuns: string[] = [];

      const shapes = parsedXml["p:sld"]?.["p:cSld"]?.[0]?.["p:spTree"]?.[0]?.["p:sp"] || [];
      for (const shape of shapes) {
        const paragraphs =
          shape["p:txBody"]?.[0]?.["a:p"] || [];

        for (const para of paragraphs) {
          const runs = para["a:r"] || [];
          for (const run of runs) {
            const text = run["a:t"]?.[0];
            if (text) {
              textRuns.push(text);
            }
          }
        }
      }

      if (textRuns.length > 0) {
        slideTextList.push(textRuns.join(" "));
      }
    } catch (err) {
      console.warn(`Failed to parse ${filename}`, err);
    }
  }

  return slideTextList.join("\n\n");
}
