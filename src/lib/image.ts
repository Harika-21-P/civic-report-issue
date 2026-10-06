import "server-only";

const MAX_IMAGE_DATA_URL_BYTES = 1_250_000;
const encodedImage = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/;

/** Validates a compact image data URL and checks the binary signature, not just its claimed MIME type. */
export function isValidStoredImage(dataUrl: string) {
  if (Buffer.byteLength(dataUrl, "utf8") > MAX_IMAGE_DATA_URL_BYTES) return false;
  const match = encodedImage.exec(dataUrl);
  if (!match) return false;
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length < 12) return false;
  if (match[1] === "jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (match[1] === "png") return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  return bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
}
