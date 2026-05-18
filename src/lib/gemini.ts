import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function explainRisk(assessment: any) {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Conduct a medical risk assessment explanation for a pregnant user with the following data:
    - Pregnancy Week: ${assessment.pregnancyWeek}
    - Bleeding Level (0-3): ${assessment.symptoms.bleeding}
    - Abdominal Pain (0-3): ${assessment.symptoms.abdominalPain}
    - Dizziness: ${assessment.symptoms.dizziness}
    - Fever: ${assessment.symptoms.fever}
    - Hypertension: ${assessment.symptoms.hypertension}
    - Prior Miscarriage: ${assessment.history.priorMiscarriage}
    
    The calculated Risk Level is: ${assessment.riskLevel}.
    
    Provide a calm, empathetic, and professional medical explanation of why this risk level was assigned. 
    Focus on specific indicators and provide clear next steps.
    Keep the tone emotionally safe and supportive.
    Return the response in a structured format with "explanation" and "recommendations".
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: { type: Type.STRING },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["explanation", "recommendations"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      explanation: "Unable to generate detailed AI reasoning at this moment. Please consult a healthcare provider immediately.",
      recommendations: ["Seek immediate medical attention if symptoms persist.", "Monitor vitals."]
    };
  }
}

export async function generateSupportMessage(mood: number, note: string) {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    A user is recovering from a pregnancy loss and just logged their mood as ${mood}/5 with the following note: "${note}".
    Generate a very gentle, compassionate, and supportive message to encourage them in their recovery journey.
    The message must be culturally sensitive to African communities and feel human-centered.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return "We are here for you. Take it one day at a time.";
  }
}
