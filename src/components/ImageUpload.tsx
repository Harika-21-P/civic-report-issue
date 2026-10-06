"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";

export type CompressedImage = { dataUrl: string; name: string };

async function compress(file: File): Promise<CompressedImage> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Use a JPG, PNG or WebP image.");
  if (file.size > 8 * 1024 * 1024) throw new Error("Choose an image smaller than 8 MB.");
  const source = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("The image could not be read.")); reader.readAsDataURL(file); });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => { const loaded = new Image(); loaded.onload = () => resolve(loaded); loaded.onerror = () => reject(new Error("The image could not be processed.")); loaded.src = source; });
  const max = 1600; const scale = Math.min(1, max / Math.max(image.width, image.height)); const canvas = document.createElement("canvas"); canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
  const context = canvas.getContext("2d"); if (!context) throw new Error("Your browser could not process this image."); context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/jpeg", .78); if (dataUrl.length > 1_250_000) throw new Error("The compressed image is still too large. Choose a smaller image.");
  return { dataUrl, name: file.name.replace(/\.[^.]+$/, "") + ".jpg" };
}

export default function ImageUpload({ value, onChange }: { value: CompressedImage | null; onChange: (image: CompressedImage | null) => void }) {
  const input = useRef<HTMLInputElement>(null); const [error, setError] = useState(""); const [working, setWorking] = useState(false);
  const choose = async (file?: File) => { if (!file) return; setError(""); setWorking(true); try { onChange(await compress(file)); } catch (err) { setError(err instanceof Error ? err.message : "Unable to process image."); } finally { setWorking(false); } };
  const drop = (event: DragEvent) => { event.preventDefault(); void choose(event.dataTransfer.files[0]); };
  return <div><div className="upload-zone" onDrop={drop} onDragOver={event => event.preventDefault()}><input ref={input} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event: ChangeEvent<HTMLInputElement>) => void choose(event.target.files?.[0])}/><div><strong>{working ? "Preparing image…" : "Drop a photo here or click to upload"}</strong><div className="small-text">JPG, PNG or WebP · maximum 8 MB · resized before secure database storage</div></div></div>{error && <div className="alert error">{error}</div>}{value && <div className="upload-preview"><img src={value.dataUrl} alt="Issue preview"/><div style={{ flex: 1 }}><strong>{value.name}</strong><div className="small-text muted">Ready to submit</div></div><button type="button" className="button quiet small" onClick={() => { onChange(null); if (input.current) input.current.value = ""; }}>Remove</button><button type="button" className="button secondary small" onClick={() => input.current?.click()}>Replace</button></div>}</div>;
}
