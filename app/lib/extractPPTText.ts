import JSZip from "jszip";
import { parseStringPromise } from "xml2js";

export async function extractPPTText(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const slideTextPromises: Promise<string>[] = [];

  Object.keys(zip.files).forEach((filename) => {
    if (filename.match(/^ppt\/slides\/slide\d+\.xml$/)) {
      slideTextPromises.push(
        zip.files[filename]
          .async("string")
          .then((xml) =>
            parseStringPromise(xml).then((parsedXml) => {
              const texts: string[] = [];
              const findText = (obj: any) => {
                if (typeof obj === "string") {
                  texts.push(obj);
                } else if (Array.isArray(obj)) {
                  obj.forEach(findText);
                } else if (typeof obj === "object" && obj !== null) {
                  Object.values(obj).forEach(findText);
                }
              };
              findText(parsedXml);
              return texts.join(" ");
            })
          )
      );
    }
  });

  const slideTexts = await Promise.all(slideTextPromises);
  return slideTexts.join(" ").replace(/\s+/g, " ").trim();
}
