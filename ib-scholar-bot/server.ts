import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  app.use(express.json());

  const PORT = 3000;

  // Initialize GoogleGenAI client with server secret and telemetry user-agent
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey || "MOCK_KEY_FOR_LOCAL_DEV",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // We want our bot to stay strictly Socratic. Let's build a unified system instruction!
  // Under our guidelines, the bot does NOT write any text/claims/essays/paragraphs,
  // but prompts the student, evaluates what's pasted, and strictly queries them.
  const BOT_SYSTEM_INSTRUCTION = `You are "IB Scholar Bot", an expert academic mentor, consultant, and Socratic coach specializing in the International Baccalaureate (IB) Diploma Programme (DP).
Your purpose is to guide DP students through their Extended Essays (EE), Internal Assessments (IA), and Theory of Knowledge (TOK) Essays.

CRITICAL ACADEMIC HONESTY RULE:
- You are an educational coach, NOT a writer or ghostwriter.
- NEVER write paragraphs, full sentences, thesis statements, outlines, or full essays for the student.
- DO NOT perform the actual research or gather the raw data for them.
- If a student asks you to "write my TOK essay", "give me a math IA topic idea with the completed data", "write a thesis statement for me", or "do the calculation for my biology IA", politely but firmly refuse to write it. Instead, explain why academic integrity matters and immediately pivot to a Socratic, collaborative brainstorming session where they must think and formulate their own ideas.
- If the student pastes code or content and demands you "fix it for me", do not re-write it. Point out the exact conceptual issues and ask them guided questions on how they might fix it (e.g. "Notice how your third paragraph shifts away from your core thesis. What question can we ask to re-link this visual data back to your main variable?").

DOMAIN EXPERTISE AND GUIDANCE RULES:
1. Extended Essay (EE):
   - Guide formulation of a sharply focused Research Question (RQ) using the Socratic method (e.g., asking about localized contexts, variables, or timeframes).
   - Understand the 4,000-word limit.
   - Ground assessments in the 5 official IB Criteria: Criterion A (Focus and method), Criterion B (Knowledge and understanding), Criterion C (Critical thinking), Criterion D (Presentation), Criterion E (Engagement - Viva Voce reflections).
   - Guide the student through preparation for the Viva Voce (final reflection).

2. Internal Assessments (IA):
   - Focus on subject-specific criteria (e.g., Personal Engagement, Exploration, Analysis, Evaluation for Group 4 Sciences; Criterion A-E for Group 5 Math; Criterion A-E for Group 3 Individuals and Societies).
   - Guide students on identifying independent, dependent, and controlled variables for sciences.
   - Refuse requests to generate datasets or conduct calculations. Teach them *how* to set up the statistical tests (e.g., Chi-Squared, Pearson's correlation) or how to analyze errors.

3. Theory of Knowledge (TOK) Essay:
   - Understand the 1,600-word limit.
   - Focus strictly on the Prescribed Titles (PTs), Areas of Knowledge (AOKs) - like Natural Sciences, Human Sciences, History, Math, the Arts - and Core/Optional Themes (Knowledge and the Knower, Technology, Language, Politics, Religion, Indigenous Societies).
   - Guide creation of clear, generalized Knowledge Questions (KQs) linked to the real-life situations (RLSs). Prevent students from telling a localized story; keep them focused on *how we know what we know*.

INTERACTION STYLE:
- ALWAYS use the Socratic Method: Ask guiding questions that activate the student's own intellect. For example: "Your current question covers a huge topic. How can we narrow this down to a specific geographic region, time period, or variable?"
- Structural clarity: Use clean Markdown headers, bold text, bullet points, and numbered lists to structure your analytical guidelines.
- Encourage and support: IB is highly stressful. Balance high-standard academic critique with a supportive, warm, and structured coaching tone.
- Guardrails: If the student asks about incredibly niche formulas, rules, or syllabi updates, remind them to check their specific school's subject guide or consult their IB Coordinator.
- Plagiarism reminder: Periodically prompt them to track their citations and maintain a detailed, structured bibliography.`;

  // Endpoint: Socratic Chat / Mentor Prompting
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history, moduleType, advancedMode } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required." });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(200).json({ 
          text: "⚠️ **Developer Note (Vibe Check)**: The `GEMINI_API_KEY` is not set on the environment yet. Please configure it in your Secrets tab. In the meantime, here is a mock response demonstrating how I work as your IB Scholar Bot Socratic coach:\n\n*\"That is an intriguing direction! When looking at your Extended Essay, how can we narrow this scope from general history down to a specific 10-year timeframe and regional impact to make your Research Question truly sharp and researchable?\"*" 
        });
      }

      // Convert history to @google/genai format
      const sdkContents: any[] = [];
      if (history && Array.isArray(history)) {
        history.forEach((h: any) => {
          sdkContents.push({
            role: h.role === "user" ? "user" : "model",
            parts: [{ text: h.content || h.text || h.message || "" }]
          });
        });
      }

      // Add contextual prefix based on active IB module
      let contextualPrefix = "";
      if (moduleType === "ee") {
        contextualPrefix = "[Context: Extended Essay (EE) Module. Focus on formatting, RQ formulation, the 5 criteria, and the 4,000 word ceiling.] ";
      } else if (moduleType === "ia") {
        contextualPrefix = "[Context: Internal Assessment (IA) Module. Socratic analysis of experiments, variable definitions, and personal engagement.] ";
      } else if (moduleType === "tok") {
        contextualPrefix = "[Context: Theory of Knowledge (TOK) Essay Module. Formulating Knowledge Questions linked to Prescribed Titles and AOKs.] ";
      }

      if (advancedMode) {
        contextualPrefix += "[Deep Reasoning Mode Enabled: Please provide advanced, higher-level logic, complex critique, and deeper conceptual analysis for IB students seeking 7s/A grades.] ";
      }

      sdkContents.push({
        role: "user",
        parts: [{ text: `${contextualPrefix}${message}` }]
      });

      const targetModel = advancedMode ? "gemini-3.1-pro-preview" : "gemini-3.5-flash";

      const response = await ai.models.generateContent({
        model: targetModel,
        contents: sdkContents,
        config: {
          systemInstruction: BOT_SYSTEM_INSTRUCTION,
          temperature: 0.7,
          tools: [{ googleSearch: {} }],
        }
      });

      const outputText = response.text || "I was unable to generate a Socratic advice stream. Please let me know your thoughts so we can review together.";
      res.json({ text: outputText });

    } catch (err: any) {
      console.error("Gemini API Error in /api/chat:", err);
      res.status(500).json({ 
        error: "Socratic assistant is currently having a brain-chill. Check key or request configuration.",
        details: err.message 
      });
    }
  });

  // Endpoint: Special Socratic Essay/Outline Critique Check
  app.post("/api/critique", async (req, res) => {
    try {
      const { draftText, critiqueType, focusArea, subject, advancedMode } = req.body;

      if (!draftText) {
        return res.status(400).json({ error: "No text provided for Socratic critique." });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(200).json({ 
          text: "⚠️ **Developer Note (Vibe Check)**: The `GEMINI_API_KEY` is not set on the environment. Configure it in Secrets to run real Socratic critiques.\n\n### Mock Critique Sample:\n1. **Focus Variables**: How does your independent variable strictly link back to your investigation title?\n2. **Academic Honest Check**: You have strong concepts, but remember to cite this secondary source. What format does your guide require?\n3. **Criterion E Refinement**: How does this snippet align with your personal engagement?" 
        });
      }

      let CRITIQUE_PROMPT = `As the IB Scholar Socratic Mentor, do a thorough Socratic critique on the following student academic snippet.
Type of task: ${critiqueType} (EE, IA, or TOK)
Focus rubrics/criteria: ${focusArea}
Secondary Subject/Context: ${subject || "General IB"}

Student's Draft/Snippet to critique:
"""
${draftText}
"""

Instructions:
1. NEVER rewrite their sentences or fix their grammar directly. Do not supply revised paragraphs.
2. Analyze if their arguments directly address the research question, AOK selection, or variables.
3. Formulate exactly 3 deep, guiding Socratic questions to prompt their critical thinking and push them to refine their academic writing themselves.
4. Highlight which primary IB Criteria or rubrics they are aligning well with, and which criteria need attention.
5. Provide this feedback in a warm, analytical, and highly structured format. Add a small encouraging conclusion.

Keep the output styled beautifully with clean markdown headers and bullet points.`;

      if (advancedMode) {
        CRITIQUE_PROMPT += "\n\n[Advanced Critical Mode Enabled]: Please elevate the rigor. Evaluate logical consistency, epistemological nuances (for TOK), complex variable interaction (for IA), and methodological flaws (for EE) to aim for band 7 level critique.";
      }

      const targetModel = advancedMode ? "gemini-3.1-pro-preview" : "gemini-3.5-flash";

      const response = await ai.models.generateContent({
        model: targetModel,
        contents: CRITIQUE_PROMPT,
        config: {
          systemInstruction: BOT_SYSTEM_INSTRUCTION,
          temperature: 0.7,
        }
      });

      const outputText = response.text || "I was unable to analyze this draft snippet.";
      res.json({ text: outputText });

    } catch (err: any) {
      console.error("Gemini API Error in /api/critique:", err);
      res.status(500).json({ error: "Socratic feedback service error.", details: err.message });
    }
  });

  // Endpoint: Transcribe Audio
  app.post("/api/transcribe", async (req, res) => {
    try {
      const { audioBase64, mimeType } = req.body;
      if (!audioBase64) {
        return res.status(400).json({ error: "audioBase64 is required" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(200).json({ text: "Mock transcription: The user asked a question about their Internal Assessment format." });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  data: audioBase64,
                  mimeType: mimeType || "audio/webm",
                }
              },
              {
                text: "Please transcribe the audio accurately."
              }
            ]
          }
        ]
      });

      res.json({ text: response.text });
    } catch (err: any) {
      console.error("Gemini Audio Error:", err);
      res.status(500).json({ error: "Failed to transcribe audio.", details: err.message });
    }
  });

  // Hot Reload and Asset serving configuration with Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`IB Scholar Bot backend running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer();
