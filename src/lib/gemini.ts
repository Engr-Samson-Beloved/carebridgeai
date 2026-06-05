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

async function generateWithFallback(options: {
  model: string;
  contents: any;
  config?: any;
}) {
  const models = [options.model, "gemini-flash-latest", "gemini-pro-latest", "gemini-2.0-flash"];
  let lastError: any = null;
  
  for (const modelName of models) {
    try {
      console.log(`Attempting generateContent with model: ${modelName}`);
      const response = await ai.models.generateContent({
        ...options,
        model: modelName
      });
      return response;
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${modelName} failed:`, err);
      if (err.status === "RESOURCE_EXHAUSTED" || err.message?.includes("429") || err.message?.includes("quota") || err.status === 429) {
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export async function explainRisk(assessment: any) {
  const model = "gemini-2.5-flash";
  
  const prompt = `
    Conduct a medical risk assessment explanation for a pregnant user with the following data:
    - Pregnancy Week: ${assessment.pregnancyWeek}
    - Nausea: ${assessment.symptoms.nausea ? 'Yes' : 'No'}
    - Vomiting: ${assessment.symptoms.vomiting}
    - Headache: ${assessment.symptoms.headache}
    - Dizziness: ${assessment.symptoms.dizziness}
    - Spotting: ${assessment.symptoms.spotting ? 'Yes' : 'No'}
    - Abdominal Pain: ${assessment.symptoms.abdominalPain}
    - Heavy Bleeding: ${assessment.symptoms.heavyBleeding ? 'Yes' : 'No'}
    - Passing Clots: ${assessment.symptoms.passingClot || assessment.symptoms.passingClots ? 'Yes' : 'No'}
    - Pelvic Pain (One-sided): ${assessment.symptoms.pelvicPainOneSided ? 'Yes' : 'No'}
    - Fever: ${assessment.symptoms.fever ? 'Yes' : 'No'}
    - Prior Miscarriage History: ${assessment.history.priorMiscarriage ? 'Yes' : 'No'}
    
    The calculated Risk Level is: ${assessment.riskLevel}.
    
    Provide a calm, empathetic, and professional medical explanation of why this risk level was assigned. 
    Focus on specific indicators and provide clear next steps.
    Keep the tone emotionally safe and supportive.
    Return the response in a structured format with "explanation" and "recommendations".
  `;

  try {
    const response = await generateWithFallback({
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
      recommendations: assessment.riskLevel === 'High' 
        ? ["Seek immediate medical care"] 
        : assessment.riskLevel === 'Medium' || assessment.riskLevel === 'Moderate'
        ? ["Visit clinic within 24-48 hrs", "Consider ultrasound assessment", "Follow up with health care provider"]
        : ["Continue monitoring", "Stay hydrated", "Attend routine ANC Care", "Repeat assessment if symptoms worsen"]
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
    const response = await generateWithFallback({
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
   - "referral" (Care Options directory, support counselors, WhatsApp groups, and clinics)

5. Action Execution System: You can execute actions in the application on behalf of the user. In your JSON response, return an array under "actions". If the user reports logging metrics, describe their symptoms, run assessments, or assign health workers, return the matching actions:
   a. LOG_WATER: User drank water/hydrated. Payload: { "amount": 1 }
   b. LOG_NUTRITION: User ate a meal. Payload: {}
   c. LOG_MEDICINE: User took medication. Payload: {}
   d. LOG_SYMPTOMS: User logs mood/symptoms. Extract:
      - mood: number 1-5 based on their feeling (1 is very bad/sad, 5 is very happy/healthy).
      - note: summary text of how they are feeling/what they wrote.
      - tags: string array, matching only these: "Bleeding", "Pelvic Pain", "Headache", "Fever", "Nausea", "Fatigue"
    e. RUN_ASSESSMENT: User wants to start or complete the triage checkup. Return the payload when you have sufficient inputs (pregnancyWeek defaults to 8 if not specified). You MUST output all 19 keys in the payload object. Set booleans to true/false and strings to "none" if not mentioned. Do not omit any keys.
       Example payload structure:
       {
         "pregnancyWeek": 9,
         "bleedingSeverity": "moderate",
         "soakingPads": false,
         "bloodClots": true,
         "cramping": true,
         "oneSidedPain": false,
         "painLevel": "none",
         "fainting": false,
         "dizzy": false,
         "weakness": false,
         "fever": false,
         "chills": false,
         "foulDischarge": false,
         "abortionProcedure": false,
         "prevMiscarriage": false,
         "prevEctopic": false,
         "hypertension": false,
         "diabetes": false,
         "anemia": false
       }
   f. ASSIGN_CHW: User wants to assign a counselor or health worker. The available CHWs are:
      - "Nurse Tomi" (chwId: "chw_tomi")
      - "Sister Amina" (chwId: "chw_amina")
      - "Dr. Kelechi" (chwId: "chw_kelechi")
      Payload: { "chwId": "chw_tomi" | "chw_amina" | "chw_kelechi", "chwName": "Nurse Tomi" | "Sister Amina" | "Dr. Kelechi" }

Crucial Output Guidelines:
1. "replyText" MUST strictly be the final, empathetic message written to the patient. It must NEVER contain code snippets, developer arguments, schema reasoning, fallback discussions, or meta-commentary.
2. "actions" MUST always be included in the response. If there are no actions for the application to execute, set "actions" to an empty array: []. Do not omit it.

Output Format:
You MUST respond in valid JSON format matching the schema:
{
  "replyText": "Empathetic, clear response in text to be shown directly to the patient",
  "navigationTarget": "optional-view-id-or-null",
  "actions": [ { "type": "action-type", "payload": {} } ]
}
`;

export async function generateChatResponse(
  history: { role: "user" | "model"; text: string }[],
  newMessage: string
) {
  const model = "gemini-2.5-flash";
  
  const contents = [
    ...history.map(h => ({
      role: h.role === "user" ? "user" : "model",
      parts: [{ text: h.text }]
    })),
    { role: "user", parts: [{ text: newMessage }] }
  ];

  try {
    const response = await generateWithFallback({
      model,
      contents,
      config: {
        systemInstruction: CHAT_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            replyText: { type: Type.STRING },
            navigationTarget: { type: Type.STRING, nullable: true },
            actions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  payload: {
                    type: Type.OBJECT,
                    properties: {
                      amount: { type: Type.INTEGER },
                      mood: { type: Type.INTEGER },
                      note: { type: Type.STRING },
                      tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                      chwId: { type: Type.STRING },
                      chwName: { type: Type.STRING },
                      
                      pregnancyWeek: { type: Type.INTEGER },
                      bleedingSeverity: { type: Type.STRING },
                      soakingPads: { type: Type.BOOLEAN },
                      bloodClots: { type: Type.BOOLEAN },
                      cramping: { type: Type.BOOLEAN },
                      oneSidedPain: { type: Type.BOOLEAN },
                      painLevel: { type: Type.STRING },
                      fainting: { type: Type.BOOLEAN },
                      dizzy: { type: Type.BOOLEAN },
                      weakness: { type: Type.BOOLEAN },
                      fever: { type: Type.BOOLEAN },
                      chills: { type: Type.BOOLEAN },
                      foulDischarge: { type: Type.BOOLEAN },
                      abortionProcedure: { type: Type.BOOLEAN },
                      prevMiscarriage: { type: Type.BOOLEAN },
                      prevEctopic: { type: Type.BOOLEAN },
                      hypertension: { type: Type.BOOLEAN },
                      diabetes: { type: Type.BOOLEAN },
                      anemia: { type: Type.BOOLEAN }
                    }
                  }
                },
                required: ["type"]
              }
            }
          },
          required: ["replyText", "actions"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    // Simple fallback parsing context to help navigation even offline/error
    let navTarget: string | null = null;
    const lower = newMessage.toLowerCase();
    if (lower.includes("clinic") || lower.includes("hospital") || lower.includes("doctor") || lower.includes("referral") || lower.includes("care") || lower.includes("counselor") || lower.includes("whatsapp")) navTarget = "referral";
    else if (lower.includes("test") || lower.includes("recovery") || lower.includes("check")) navTarget = "recovery";
    else if (lower.includes("triage") || lower.includes("assess") || lower.includes("risk")) navTarget = "referral";
    else if (lower.includes("home") || lower.includes("dashboard")) navTarget = "patient-dashboard";

    return {
      replyText: "I am here for you and want to help you heal. If you are feeling severe pain or heavy bleeding, please check our clinics directory immediately or use our emergency SOS option.",
      navigationTarget: navTarget,
      actions: []
    };
  }
}
