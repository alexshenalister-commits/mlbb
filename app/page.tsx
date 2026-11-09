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
  const [preview, setPreview] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Tampilkan preview
    setPreview(URL.createObjectURL(file));
    setLoading(true);
    setResult(null);

    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append("screenshot", compressed, "screenshot.jpg");

      const res = await fetch("/api/analyze", { method: "POST", body: formData });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({ error: "Gagal menghubungi server. Coba lagi." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Analisis Draft MLBB</h1>
      <p className="text-gray-600 mb-6">
        Unggah screenshot draft pick, sistem akan mendeteksi hero & counter-nya.
      </p>
      
      <input type="file" accept="image/*" onChange={handleUpload} className="mb-4" />

      {/* Preview Gambar */}
      {preview && (
        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-2">Gambar yang di-upload:</p>
          <img src={preview} alt="Preview" className="max-w-xs border rounded" />
        </div>
      )}

      {/* Loading */}
      {loading && <p className="text-blue-600 font-semibold">Menganalisis... (maksimal 30 detik)</p>}

      {/* Tampilkan Error jika ada */}
      {result?.error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded mt-4">
          <strong>Error:</strong> {result.error}
        </div>
      )}

      {/* Tampilkan Hasil jika sukses */}
      {result?.heroes && result.heroes.length > 0 && (
        <div className="mt-6 space-y-4">
          <h2 className="text-xl font-semibold">
            Hero Terdeteksi: {result.heroes.join(", ")}
          </h2>
          {result.analysis?.map((item: any, i: number) => (
            <div key={i} className="border rounded-lg p-3">
              <strong>{item.hero}</strong>
              <pre className="text-sm mt-1 text-gray-700 overflow-auto max-h-40">
                {JSON.stringify(item.counters, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
