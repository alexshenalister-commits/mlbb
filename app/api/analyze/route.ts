import { NextResponse } from "next/server";
import axios from "axios";
import { createMlbbClient } from "mlbb-sdk";

const ROBOFLOW_API_KEY = process.env.ROBOFLOW_API_KEY;
const ROBOFLOW_MODEL_URL =
  "https://serverless.roboflow.com/mobile-legends-draft-recognition/3";
const mlbbClient = createMlbbClient({ lang: "id" });

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("screenshot") as File;
    if (!file)
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });

    // 1. Deteksi hero via Roboflow
    const arrayBuffer = await file.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");

    const roboflowResponse = await axios({
      method: "POST",
      url: ROBOFLOW_MODEL_URL,
      params: { api_key: ROBOFLOW_API_KEY },
      data: base64Image,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const predictions = roboflowResponse.data.predictions || [];
    if (predictions.length === 0)
      return NextResponse.json({ error: "Tidak ada hero terdeteksi" });

    // ✅ FIX: pakai Array.from + Set<string> + String()
    const detectedHeroes: string[] = Array.from(
      new Set<string>(predictions.map((p: any) => String(p.class)))
    );

    // 2. Analisis counter via mlbb-sdk
    const allHeroes = await mlbbClient.mlbb.getHeroes();
    const analysisResults = [];

    for (const heroName of detectedHeroes) {
      const heroData = allHeroes.find(
        (h: any) => h.name.toLowerCase() === heroName.toLowerCase()
      );

      if (heroData) {
        try {
          const counters = await mlbbClient.mlbb.getHeroCounters(heroData.id, {
            rank: "mythic",
            days: 7,
          });
          analysisResults.push({ hero: heroName, counters });
        } catch {
          analysisResults.push({ hero: heroName, counters: "Data tidak tersedia" });
        }
      } else {
        analysisResults.push({ hero: heroName, counters: "Hero tidak dikenali" });
      }
    }

    return NextResponse.json({ heroes: detectedHeroes, analysis: analysisResults });
  } catch (error: any) {
    console.error("Error:", error.response?.data || error.message);
    return NextResponse.json({ error: "Gagal menganalisis" }, { status: 500 });
  }
}
