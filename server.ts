import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { AFFILIATE_STORES } from "./src/data/stores";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // System instructions for 休쿠봇 with full Kyung Hee University Affiliate DB
  const storeSummaryList = AFFILIATE_STORES.map((s) => ({
    name: s.name,
    category: s.category,
    type: s.type,
    benefit: s.benefit,
    areaName: s.areaName,
    recommendedMenu: s.recommendedMenu || "대표 메뉴",
    desc: s.desc || "",
    tags: s.tags,
  }));

  const systemInstruction = `너는 경희대학교 국제캠퍼스 제휴 혜택 전문 AI 길잡이 '休쿠봇'이야. 🎓
경희대 학우들의 질문(인원수, 예산, 음식 종류, 분위기, 모임 목적, 이동 거리 등)을 파악하여 가장 잘 맞는 경희대 제휴 매장을 1~3곳 추천해줘.

[규칙 & 지침]:
1. 반드시 아래 [경희대 제휴 DB]에 등록된 실제 제휴 매장 목록 중에서만 추천해야 해. 없는 매장을 지어내지 마!
2. 매장명을 언급할 때는 등록된 정확한 이름으로 자연스럽게 작성해줘 (예: "그로또", "존앤진피자펍 행궁본점", "오늘도 닭갈비 영통경희대점", "돼통령 영통역점", "엔조희커피" 등).
3. 추천 시 [매장명], [카테고리 및 위치(정문/영통역 등)], [학생증 제시 시 제휴 혜택], [추천 메뉴나 특징]을 알기 쉽게 짚어줘.
4. 말투는 친절하고 다정한 경희대 선배/동기 학생(해요체 및 밝은 톤)으로 작성해줘. 이모지(🍽️, 🍺, ☕, 💪, 🎁, ✨, 📍)를 적절히 활용해줘.
5. 마지막에는 "결제 전 실물 또는 모바일 학생증 제시 잊지 마세요!"를 리마인드해줘.

[경희대 국제캠퍼스 제휴 DB]:
${JSON.stringify(storeSummaryList, null, 2)}`;

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", count: AFFILIATE_STORES.length });
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history = [], apiKey: customApiKey } = req.body;

      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "질문 메시지를 입력해주세요." });
      }

      const activeApiKey = customApiKey || process.env.GEMINI_API_KEY;

      if (!activeApiKey) {
        return res.status(400).json({
          error: "API_KEY_REQUIRED",
          message: "GEMINI_API_KEY가 설정되지 않았습니다. 로컬 인텔리전트 모드로 동작합니다.",
        });
      }

      const ai = new GoogleGenAI({ apiKey: activeApiKey });

      // Construct conversational contents
      const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

      // Add recent history (up to last 6 messages)
      if (Array.isArray(history)) {
        for (const item of history.slice(-6)) {
          if (item && item.text && (item.role === "user" || item.role === "model")) {
            contents.push({
              role: item.role,
              parts: [{ text: item.text }],
            });
          }
        }
      }

      // Add current user message
      contents.push({
        role: "user",
        parts: [{ text: message }],
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const replyText = response.text || "죄송합니다, 답변을 생성하지 못했습니다. 다시 질문해주세요.";

      return res.json({ reply: replyText });
    } catch (error: any) {
      console.error("Gemini API Error in /api/chat:", error);
      return res.status(500).json({
        error: "GEMINI_ERROR",
        message: error?.message || "AI 응답 생성 중 오류가 발생했습니다.",
      });
    }
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`HUEKHU Full-Stack Server running on port ${PORT}`);
  });
}

startServer();
