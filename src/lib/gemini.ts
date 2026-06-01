import { GoogleGenAI, Type } from "@google/genai";

// Support both process.env and Vite's import.meta.env
let apiKey = "";
try {
  apiKey = ((import.meta as any).env?.VITE_GEMINI_API_KEY) || "";
} catch (e) {}

if (!apiKey) {
  try {
    apiKey = (process && process.env && process.env.GEMINI_API_KEY) || "";
  } catch (e) {}
}

const ai = new GoogleGenAI({ apiKey });

export async function explainRisk(assessment: any) {
  const model = "gemini-2.5-flash";
  
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
  const model = "gemini-2.5-flash";
  
  const prompt = `
    A user is recovering from a pregnancy loss and just logged their mood as ${mood}/5 with the following note: "${note}".
    Generate a very gentle, compassionate, and supportive message to encourage them in their recovery journey.
    The message must be culturally sensitive to Sub-Saharan African communities and feel human-centered.
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

const CHAT_SYSTEM_INSTRUCTION = `
You are CareBridge AI, a compassionate, culturally sensitive, and expert maternal and reproductive health companion. Your primary role is to assist recovering patients across Sub-Saharan Africa who have experienced pregnancy loss, miscarriage, or early pregnancy complications.

Key Guidelines:
1. Context Scope: Limit all advice to Sub-Saharan African maternal/reproductive health guidelines. Focus on recovery, emotional healing, hydration, nutrition, and post-loss danger signs.
2. Medical Safety: You are an informational helper, NOT a physician. If a user flags critical danger signs (like heavy bleeding, severe abdominal pain, high fever/pyrexia, or syncope/fainting), urge them to seek immediate medical attention and offer to navigate them to the clinics directory.
3. Slang & Code-switching: You understand and parse local Sub-Saharan slang, code-switching, and Pidgin English expressions (e.g. "body dey do me somehow", "my head want to remove", "bleeding no wan stop", "tummy dey pain me", "moto/car no dey" to go to clinic). Map these expressions to clinical terms to screen for warnings.
4. App Navigation Detection: If the user indicates they want to perform an action or view something that corresponds to our app's features, identify the appropriate "navigationTarget" view in your response:
   - "patient-dashboard" (Home, streak, water tracker, log reflections)
   - "recovery" (Symptoms Accordion recovery test or health check)
   - "referral" (Support Clinics directory or Live Routing Map)
   - "assessment" (AI Pregnancy Triage screen)
   For example:
   - If they say: "where is the nearest clinic", "show me doctor", "hospital near me", set navigationTarget to "referral".
   - If they say: "I want to start the health check", "take recovery test", "screen my symptoms", set navigationTarget to "recovery".
   - If they say: "take me to triage", "do pregnancy triage", set navigationTarget to "assessment".
   - If they say: "go home", "show my water intake", "dashboard", set navigationTarget to "patient-dashboard".

Output Format:
You MUST respond in valid JSON format matching the schema:
{
  "replyText": "Empathetic, clear response in text",
  "navigationTarget": "optional-view-id-or-null"
}
`;

export async function generateChatResponse(
  history: { role: "user" | "model"; text: string }[],
  newMessage: string
) {
  const model = "gemini-2.5-flash";
  
  const contents = [
    { role: "system", parts: [{ text: CHAT_SYSTEM_INSTRUCTION }] },
    ...history.map(h => ({
      role: h.role === "user" ? "user" : "model",
      parts: [{ text: h.text }]
    })),
    { role: "user", parts: [{ text: newMessage }] }
  ];

  try {
    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            replyText: { type: Type.STRING },
            navigationTarget: { type: Type.STRING, nullable: true }
          },
          required: ["replyText"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    // Simple fallback parsing context to help navigation even offline/error
    let navTarget: string | null = null;
    const lower = newMessage.toLowerCase();
    if (lower.includes("clinic") || lower.includes("hospital") || lower.includes("doctor") || lower.includes("referral")) navTarget = "referral";
    else if (lower.includes("test") || lower.includes("recovery") || lower.includes("check")) navTarget = "recovery";
    else if (lower.includes("triage") || lower.includes("assess") || lower.includes("risk")) navTarget = "assessment";
    else if (lower.includes("home") || lower.includes("dashboard")) navTarget = "patient-dashboard";

    return {
      replyText: "I am here for you and want to help you heal. If you are feeling severe pain or heavy bleeding, please check our clinics directory immediately or use our emergency SOS option.",
      navigationTarget: navTarget
    };
  }
}
