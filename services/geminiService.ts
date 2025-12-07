import { GoogleGenAI, Content, Part } from "@google/genai";
import { ChatMessage, GeminiModel, ProgressReport } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are a compassionate, Socratic math tutor. Your goal is to help the student understand concepts deeply.

**Core Modes:**

1.  **Problem Solving Mode** (User uploads an image or asks to solve a specific equation):
    -   **Analyze first**: Think deeply about the mathematical concepts involved.
    -   **Socratic Approach**: Do NOT give the full solution immediately. Break the problem down.
    -   **Guide, Don't Solve**: Start by asking a guiding question or explaining the very first step. "Let's look at this term first..." or "What do you think is the first rule we should apply?"
    -   **Explain "Why"**: If the user asks "Why?", explain the specific underlying concept or theorem patiently and clearly.
    -   **Visuals**: If the problem benefits from visualization (geometry, graphs), generate an SVG diagram to illustrate the step.

2.  **Concept Explanation Mode** (User asks "Explain derivatives", "What is the chain rule?", or clicks "Explain Concept"):
    -   **Objective**: Provide a clear, intuitive, and high-quality explanation of the concept.
    -   **Visuals**: You **MUST** generate an SVG diagram to visualize the concept. This is critical for the user's understanding.
    -   **Analogies**: Use simple analogies if they help clarify abstract ideas.
    -   **Examples**: Always include 1-2 simple, concrete mathematical examples to illustrate the definition.

**SVG Diagram Guidelines (CRITICAL):**
-   **Syntax**: Wrap SVG code in \`\`\`svg ... \`\`\` blocks.
-   **Responsiveness**: Always use \`viewBox\` (e.g., "0 0 400 300"). Do NOT use fixed \`width\` or \`height\` attributes on the root svg element.
-   **Styling & Theme**:
    -   **Colors**: Use \`stroke="currentColor"\` or \`fill="currentColor"\` for primary axes and text so they adapt to dark/light mode automatically.
    -   **Highlights**: Use \`#10b981\` (Emerald) for correct paths/answers, \`#f43f5e\` (Rose) for error/focus points, and \`#6366f1\` (Indigo) for auxiliary lines/tangents.
    -   **Text**: Use \`font-family="sans-serif"\`, \`font-size="14"\`, and \`fill="currentColor"\`.
    -   **Background**: Do not set a background rect; let it be transparent.
-   **Examples**:
    -   *Derivatives*: Draw a curve and a tangent line at a point.
    -   *Integrals*: Draw a curve and shade the area under it.
    -   *Trig*: Draw the unit circle with relevant angles/lines highlighted.
    -   *Algebra*: Draw a number line or a coordinate plane with the function plotted.

**General Guidelines:**
-   **Be Encouraging**: Use a warm, supportive tone. Math can be scary; make it approachable.
-   **Formatting**: Use clear formatting. You can use markdown for bolding terms. Present equations clearly.

**CRITICAL OVERRIDE**:
If the user requests to see the solution (e.g., "Just show me the answer", "Give up", "Just show me the full step-by-step solution immediately"):
- STOP asking guiding questions.
- Provide the COMPLETE, detailed, step-by-step solution to the problem immediately.
- Explain each step clearly as you solve it, like a teacher demonstrating the solution on a whiteboard.
`;

export const streamGeminiResponse = async function* (
  history: ChatMessage[],
  newMessage: string,
  newImageBase64?: string,
  newImageMimeType?: string
) {
  // Convert local chat history to Gemini Content format
  const contents: Content[] = history.map((msg) => {
    const parts: Part[] = [];
    
    // If there was an image in history, we need to send it again to maintain context
    // Note: In a production app, we might rely on caching, but for this stateless flow we resend context.
    // Ideally, the 'chat' abstraction handles this, but we are constructing it manually to ensure multimodal support works flawlessly.
    if (msg.image) {
       // We assume the image stored in message.image is a data URL (data:image/png;base64,...)
       // We need to extract the base64 part and mime type.
       const [header, base64Data] = msg.image.split(',');
       const mimeMatch = header.match(/:(.*?);/);
       const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg'; // Fallback

       parts.push({
         inlineData: {
           mimeType: mimeType,
           data: base64Data,
         }
       });
    }

    if (msg.text) {
      parts.push({ text: msg.text });
    }

    return {
      role: msg.role,
      parts: parts,
    };
  });

  // Construct the new user message content
  const newParts: Part[] = [];
  if (newImageBase64 && newImageMimeType) {
    // newImageBase64 is expected to be raw base64 string here from the helper
    newParts.push({
      inlineData: {
        mimeType: newImageMimeType,
        data: newImageBase64,
      },
    });
  }
  if (newMessage) {
    newParts.push({ text: newMessage });
  }

  const newContent: Content = {
    role: 'user',
    parts: newParts,
  };

  const finalContents = [...contents, newContent];

  try {
    const responseStream = await ai.models.generateContentStream({
      model: GeminiModel.PRO_PREVIEW,
      contents: finalContents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        thinkingConfig: {
          thinkingBudget: 32768, // Max budget for deep reasoning on complex math
        },
      },
    });

    for await (const chunk of responseStream) {
      yield chunk.text;
    }
  } catch (error) {
    console.error("Error streaming from Gemini:", error);
    throw error;
  }
};

export const extractMathProblem = async (imageBase64: string, mimeType: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: GeminiModel.FLASH,
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: imageBase64
                        }
                    },
                    { text: "Transcribe the math problem from this image into clear text/LaTeX. Output ONLY the math problem. Do not solve it. Do not add intro/outro text." }
                ]
            }
        });
        return response.text || "Could not identify a math problem in this image.";
    } catch (error) {
        console.error("Error extracting math:", error);
        throw new Error("Failed to process image.");
    }
}

export const generateProgressReport = async (history: ChatMessage[]): Promise<ProgressReport> => {
    if (history.length < 2) {
        return {
            mastered: [],
            struggling: [],
            totalProblemsSolved: 0,
            overallFeedback: "Start chatting with the tutor to track your progress!",
            lastUpdated: Date.now()
        };
    }

    // Filter and truncate history to fit within context window safely for Flash
    const transcript = history
        .map(m => `${m.role.toUpperCase()}: ${m.text.substring(0, 500)}`)
        .join('\n')
        .substring(0, 50000);

    const prompt = `
      Analyze this chat history between a student and a math tutor.
      
      1. Identify the specific mathematical concepts discussed (e.g., "Chain Rule", "Integration by Parts", "Quadratic Formula").
      2. For each concept, determine if the student seems to have mastered it (understands well, answers correctly) or if they are struggling (asks for help repeatedly, makes mistakes).
      3. Estimate the total number of unique math problems the student has attempted or solved in this session.
      4. Write a brief, encouraging, 1-sentence feedback summary.
      
      Return a valid JSON object with this structure:
      {
        "mastered": ["concept1", "concept2"],
        "struggling": ["concept3"],
        "totalProblemsSolved": 0,
        "overallFeedback": "Keep up the good work!"
      }
    `;

    try {
        const response = await ai.models.generateContent({
            model: GeminiModel.FLASH,
            contents: [
                { text: transcript },
                { text: prompt }
            ],
            config: {
                responseMimeType: "application/json"
            }
        });

        const jsonText = response.text;
        const data = JSON.parse(jsonText || "{}");

        return {
            mastered: data.mastered || [],
            struggling: data.struggling || [],
            totalProblemsSolved: data.totalProblemsSolved || 0,
            overallFeedback: data.overallFeedback || "Keep practicing!",
            lastUpdated: Date.now()
        };
    } catch (error) {
        console.error("Error generating progress report:", error);
        return {
            mastered: [],
            struggling: [],
            totalProblemsSolved: 0,
            overallFeedback: "Could not generate report at this time.",
            lastUpdated: Date.now()
        };
    }
};