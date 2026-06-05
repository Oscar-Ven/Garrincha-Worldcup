"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const MAX_DIM = 300; // resize to 300×300 max

async function resizeToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not supported")); return; }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = url;
  });
}

export function AvatarUpload({
  currentUrl,
  initials,
}: {
  currentUrl: string | null;
  initials: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);

    try {
      // Resize client-side
      const dataUrl = await resizeToDataUrl(file);

      // Convert data URL back to blob for upload
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const resizedFile = new File([blob], "avatar.jpg", { type: "image/jpeg" });

      if (resizedFile.size > 400_000) {
        setError("Image still too large. Please choose a smaller photo.");
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append("avatar", resizedFile);

      const uploadRes = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });
      const body = await uploadRes.json() as { ok?: boolean; error?: string; avatarUrl?: string };

      if (!uploadRes.ok) {
        setError(body.error ?? "Upload failed.");
      } else {
        setPreview(body.avatarUrl ?? dataUrl);
        router.refresh();
      }
    } catch {
      setError("Could not process image. Please try another file.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove() {
    setUploading(true);
    await fetch("/api/user/avatar", { method: "DELETE" });
    setPreview(null);
    setUploading(false);
    router.refresh();
  }

  return (
    <div className="av-wrap">
      <div className="av-circle" onClick={() => !uploading && inputRef.current?.click()}>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Profile photo" className="av-img" />
        ) : (
          <span className="av-initials">{initials}</span>
        )}
        {uploading ? (
          <div className="av-overlay">
            <div className="av-spinner" />
          </div>
        ) : (
          <div className="av-overlay av-overlay--hover">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
        )}
      </div>

      <div className="av-actions">
        <button
          className="av-btn"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          type="button"
        >
          {preview ? "Change photo" : "Upload photo"}
        </button>
        {preview && (
          <button
            className="av-btn av-btn--remove"
            onClick={handleRemove}
            disabled={uploading}
            type="button"
          >
            Remove
          </button>
        )}
      </div>

      {error && <p className="av-error">⚠ {error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={handleFile}
        aria-label="Upload profile photo"
      />
    </div>
  );
}
