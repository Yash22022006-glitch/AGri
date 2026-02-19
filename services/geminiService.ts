
import { GoogleGenAI, Type } from "@google/genai";
import { CropSuggestion, Expense } from "../types";
import { getLocalResponse } from "./localKnowledgeBase";

export interface GovScheme {
  title: string;
  explanation: string;
  url: string;
}

// @ts-ignore
// @ts-ignore
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || '';

// Debug log for API Key presence (safe)
if (!apiKey) {
  console.error("Gemini API Key is missing! Check .env.local file.");
} else {
  console.log("Gemini API Key loaded (length: " + apiKey.length + ")");
}

const genAI = new GoogleGenAI({ apiKey });

// Helper to safely extract text from response
const extractText = (response: any): string => {
  if (response.text) {
    if (typeof response.text === 'function') {
      try { return response.text(); } catch (e) { return response.text; }
    }
    return response.text;
  }
  if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
    return response.candidates[0].content.parts[0].text;
  }
  return JSON.stringify(response);
}

export const getCropRotationSuggestions = async (location: string, currentClimate: string): Promise<CropSuggestion[]> => {
  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        role: 'user',
        parts: [{ text: `Based on the location "${location}" and current climate "${currentClimate}", suggest a 3-month crop rotation plan. Return strictly valid JSON.` }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              crop: { type: Type.STRING },
              timing: { type: Type.STRING },
              method: { type: Type.STRING },
              reason: { type: Type.STRING }
            },
            required: ["crop", "timing", "method", "reason"]
          }
        }
      }
    } as any);

    const text = extractText(response);
    return JSON.parse(text);
  } catch (e: any) {
    console.error("Gemini Rotation Error Details:", e);
    return [];
  }
};

export const searchGovSchemes = async (query: string): Promise<GovScheme[]> => {
  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        role: 'user',
        parts: [{
          text: `Find 3-5 current and active government schemes, subsidies, or loans for farmers in India related to: ${query}. 
                 Return the data as a JSON array of objects. Each object MUST have:
                 - "title": The official name of the scheme.
                 - "explanation": A 2-3 sentence clear explanation for a farmer.
                 - "url": A valid official government website link for this specific scheme.` }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              explanation: { type: Type.STRING },
              url: { type: Type.STRING }
            },
            required: ["title", "explanation", "url"]
          }
        }
      }
    } as any);

    const text = extractText(response);
    return JSON.parse(text);
  } catch (e: any) {
    console.error("Gemini Schemes Error Details:", e);
    return [];
  }
};

export const getFinancialAdvice = async (expenses: Expense[]) => {
  try {
    const prompt = `Analyze these farming expenses and provide brief financial advice to improve profitability: ${JSON.stringify(expenses)}`;
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        role: 'user',
        parts: [{ text: prompt }]
      }
    } as any);

    return extractText(response);
  } catch (e: any) {
    console.error("Gemini Finance Error Details:", e);
    return "Unable to generate advice at this time. Error: " + (e.message || e);
  }
};

export const chatWithAgriBot = async (history: { role: string, parts: { text: string }[] }[], message: string) => {
  try {
    // Transforming history to match the SDK expectation
    const contents = [
      {
        role: 'user',
        parts: [{ text: "You are a specialized agricultural assistant for farmers. Answer questions about manure, crop health, pest control, and processing techniques. Be practical, empathetic, and professional." }]
      },
      ...history.map(h => ({
        role: h.role === 'model' ? 'model' : 'user',
        parts: h.parts
      })),
      {
        role: 'user',
        parts: [{ text: message }]
      }
    ];

    // Fallback to lighter model
    try {
      const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: contents as any
      });

      return extractText(response);

    } catch (e: any) {
      console.warn("Gemini API call failed, falling back to local DB. Error:", e);
      // Fallback: If live API fails, use local knowledge base
      return getLocalResponse(message);
    }
  } catch (e: any) {
    console.error("Gemini Critical Error:", e);
    return getLocalResponse(message);
  }
};
