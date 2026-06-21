import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase request size limit to handle base64 image uploads comfortably
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

let aiClient: GoogleGenAI | null = null;

// Lazy initialize Gemini client to avoid crashes if the key isn't provided right away
function getAiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not defined in the environment secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// REST API for detailed nutritional analysis via Gemini AI
app.post("/api/analyze-food", async (req, res) => {
  try {
    const { prompt, image, mimeType } = req.body;

    if (!prompt && !image) {
      return res.status(400).json({ error: "Lütfen bir yemek açıklaması yazın veya resim yükleyin." });
    }

    const ai = getAiClient();

    let contents: any[] = [];

    if (image) {
      // If user uploaded an image, prepare the inlineData block
      contents.push({
        inlineData: {
          mimeType: mimeType || "image/jpeg",
          data: image,
        },
      });
    }

    // Always include a text part to analyze, with the user's prompt or default query if image only
    const textPrompt = prompt 
      ? `Aşağıdaki yiyeceği/öğünü analiz et ve detaylı besin değerlerini çıkar: "${prompt}"`
      : "Resimdeki yiyecekleri tespit et ve her birinin porsiyonu ile beraber detaylı besin değerlerini analiz et.";

    contents.push({ text: textPrompt });

    const systemInstruction = `Sen profesyonel bir diyetisyen ve beslenme uzmanısın. Kullanıcının belirttiği veya görselde gösterdiği yiyecekleri analiz et. 
Yiyecek isimlerini her zaman Türkçe olarak yaz. Porsiyon açıklamalarını detaylı ve anlaşılır bir şekilde Türkçe yaz (Örn: '1 porsiyon - yaklaşık 150g' veya '1 su bardağı - 200ml').
Diyet lifi (fiber), sodyum (sodium) ve şeker (sugar) değerlerini de mutlaka belirle.
Dinamik olarak tüm yiyeceklerin kalori ve makrolarını toplayarak toplamları hesapla.
Kullanıcıya 'summary' alanında, tükettikleri bu öğünün kalitesi, dengesi ve günün geri kalanı için sağlıklı diyet tavsiyelerini içeren 2-3 cümlelik samimi bir profesyonel diyetisyen yorumu yaz.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              description: "Öğünde tespit edilen yiyeceklerin listesi",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Yiyeceğin Türkçe adı. Örn: Izgara Tavuk" },
                  portion: { type: Type.STRING, description: "Miktarı/Porsiyonu. Örn: 1 porsiyon (150g)" },
                  calories: { type: Type.INTEGER, description: "Kalori miktarı (kcal)" },
                  protein: { type: Type.NUMBER, description: "Protein miktarı (gram)" },
                  carbs: { type: Type.NUMBER, description: "Karbonhidrat miktarı (gram)" },
                  fat: { type: Type.NUMBER, description: "Yağ miktarı (gram)" },
                  fiber: { type: Type.NUMBER, description: "Diyet lif miktarı (gram)" },
                  sodium: { type: Type.NUMBER, description: "Sodyum miktarı (miligram)" },
                  sugar: { type: Type.NUMBER, description: "Şeker miktarı (gram)" },
                },
                required: ["name", "portion", "calories", "protein", "carbs", "fat", "fiber", "sodium", "sugar"],
              },
            },
            summary: {
              type: Type.STRING,
              description: "Öğün bileşimi hakkında Türkçe profesyonel diyetisyen yorumu ve önerisi."
            },
            totalCalories: { type: Type.INTEGER, description: "Toplam kalori (kcal)" },
            totalProtein: { type: Type.NUMBER, description: "Toplam protein (gram)" },
            totalCarbs: { type: Type.NUMBER, description: "Toplam karbonhidrat (gram)" },
            totalFat: { type: Type.NUMBER, description: "Toplam yağ (gram)" },
          },
          required: ["items", "summary", "totalCalories", "totalProtein", "totalCarbs", "totalFat"],
        },
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Yapay zekadan boş bir yanıt alındı.");
    }

    const resultData = JSON.parse(responseText.trim());
    return res.json(resultData);
  } catch (err: any) {
    console.error("AI Analysis Error:", err);
    return res.status(500).json({ 
      error: err.message || "Yiyecek analizi yapılırken beklenmedik bir yapay zeka hatası oluştu." 
    });
  }
});

// Setup dev server or static distribution build based on environment flags
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[OK] Server listening on port ${PORT}`);
  });
}

startServer();
