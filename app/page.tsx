"use client";
import { useState } from "react";

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.8);
    };
  });
}

export default function Home() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const compressed = await compressImage(file);
    const formData = new FormData();
    formData.append("screenshot", compressed, "screenshot.jpg");
    const res = await fetch("/api/analyze", { method: "POST", body: formData });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Analisis Draft MLBB</h1>
      <p className="text-gray-600 mb-6">
        Unggah screenshot draft pick, sistem akan mendeteksi hero & counter-nya.
      </p>
      <input type="file" accept="image/*" onChange={handleUpload} className="mb-4" />
      {loading && <p className="text-blue-600">Menganalisis... (maksimal 30 detik)</p>}
      {result && (
        <div className="mt-6 space-y-4">
          <h2 className="text-xl font-semibold">
            Hero Terdeteksi: {result.heroes?.join(", ")}
          </h2>
          {result.analysis?.map((item: any, i: number) => (
            <div key={i} className="border rounded-lg p-3">
              <strong>{item.hero}</strong>
              <pre className="text-sm mt-1 text-gray-700">
                {JSON.stringify(item.counters, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
