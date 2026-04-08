import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

dotenv.config();

const PORT = process.env.PORT || 3000;

// ─── Shared Memory ────────────────────────────────────────────────────────────

interface Message {
  agent: string;
  content: string;
  llm: string;
  timestamp: string;
}

class SharedMemory {
  history: Message[] = [];

  add(msg: Omit<Message, "timestamp">) {
    const entry = { ...msg, timestamp: new Date().toISOString() };
    this.history.push(entry);
    console.log(`[${entry.agent} via ${entry.llm}] → ${entry.content.substring(0, 120)}...`);
  }

  getContext(lastN: number = 15): string {
    return this.history
      .slice(-lastN)
      .map(m => `${m.agent} (${m.llm}): ${m.content}`)
      .join("\n");
  }
}

// ─── Agent System Prompts ─────────────────────────────────────────────────────

const SYSTEM_PROMPTS: Record<string, string> = {
  Orchestrator: `You are the Orchestrator, powered by Claude (Anthropic). You are the lead architect and reasoning engine of the Topher AI Command system. Your job: break down the user's goal into a clear research and execution plan, assign work to the right agents, and ensure the final output is coherent, accurate, and actionable. You think in systems. You are precise, structured, and never waste words. Start by laying out the plan clearly.`,

  Analyst: `You are the Analyst, powered by Grok (xAI). You receive research findings and stress-test them. Challenge assumptions. Find contradictions. Identify what's missing. Provide bold, direct synthesis. Your job is adversarial review — make the output stronger by finding its weaknesses. Be concise and sharp.`,

  Creator: `You are the Creator, powered by ChatGPT (OpenAI). You take analyzed findings and produce polished, professional written output — reports, documents, compliance summaries, marketing copy, or any deliverable the user needs. Your writing is clear, structured, and publication-ready.`,

  Researcher: `You are the Researcher, powered by Gemini (Google). Your job is to find, retrieve, and organize information relevant to the task. Search broadly across sources. Present facts with citations. Never interpret — only retrieve and structure. Produce a comprehensive information base for the team.`,

  Memory: `You are Memory, powered by NotebookLM (Google). You are the persistent knowledge hub. Ground all outputs in source documents. Synthesize across sessions. Maintain project continuity. When asked to save, summarize the key findings clearly for long-term storage. Always cite your sources.`,

  Monitor: `You are the Monitor, powered by Claude (Anthropic). You review all agent outputs for accuracy, consistency, and quality. Flag hallucinations, unsupported claims, and logical gaps. Produce a verification report. Your approval is required before the final output reaches the user. Be thorough and exacting.`,

  Strategist: `You are the Strategist, powered by ChatGPT (OpenAI). You take verified research and translate it into a specific, personalized action plan for Topher. No generic advice — every recommendation must be grounded in the research and tailored to the stated goal. Prioritize ruthlessly. Be direct and practical.`,
};

// ─── Team Agent ───────────────────────────────────────────────────────────────

class TeamAgent {
  name: string;
  llm: string;

  constructor(name: string, llm: string) {
    this.name = name;
    this.llm = llm;
  }

  async call(
    task: string,
    memory: SharedMemory,
    keys: Record<string, string>,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    const systemPrompt = SYSTEM_PROMPTS[this.name] || `You are ${this.name}.`;
    const context = memory.getContext();
    const fullPrompt = context
      ? `Team context so far:\n${context}\n\nYour task: ${task}`
      : `Your task: ${task}`;

    try {
      if (this.llm === "claude") {
        const client = new Anthropic({
          apiKey: keys.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
        });
        const stream = await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 2000,
          system: systemPrompt,
          messages: [{ role: "user", content: fullPrompt }],
          stream: true,
        });
        let output = "";
        for await (const chunk of stream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            output += chunk.delta.text;
            if (onChunk) onChunk(chunk.delta.text);
          }
        }
        return output.trim();

      } else if (this.llm === "grok") {
        const client = new OpenAI({
          apiKey: keys.XAI_API_KEY || process.env.XAI_API_KEY,
          baseURL: "https://api.x.ai/v1",
        });
        const stream = await client.chat.completions.create({
          model: "grok-3",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: fullPrompt },
          ],
          stream: true,
        });
        let output = "";
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || "";
          output += text;
          if (onChunk) onChunk(text);
        }
        return output.trim();

      } else if (this.llm === "chatgpt") {
        const client = new OpenAI({
          apiKey: keys.OPENAI_API_KEY || process.env.OPENAI_API_KEY,
        });
        const stream = await client.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: fullPrompt },
          ],
          stream: true,
        });
        let output = "";
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || "";
          output += text;
          if (onChunk) onChunk(text);
        }
        return output.trim();

      } else if (this.llm === "gemini") {
        const client = new GoogleGenAI({
          apiKey: keys.GEMINI_API_KEY || process.env.GEMINI_API_KEY,
        });
        const stream = await client.models.generateContentStream({
          model: "gemini-2.0-flash",
          contents: `${systemPrompt}\n\n${fullPrompt}`,
        });
        let output = "";
        for await (const chunk of stream) {
          output += chunk.text || "";
          if (onChunk) onChunk(chunk.text || "");
        }
        return output.trim();
      }

    } catch (error: any) {
      const msg = `[${this.name} ERROR]: ${error.message}`;
      console.error(msg);
      if (onChunk) onChunk(msg);
      return msg;
    }

    return `[${this.name}]: Unknown LLM — ${this.llm}`;
  }
}

// ─── Orchestra ────────────────────────────────────────────────────────────────

class Orchestra {
  memory: SharedMemory;
  agents: Record<string, TeamAgent>;

  constructor() {
    this.memory = new SharedMemory();
    this.agents = {
      Orchestrator: new TeamAgent("Orchestrator", "claude"),
      Analyst:      new TeamAgent("Analyst",      "grok"),
      Creator:      new TeamAgent("Creator",      "chatgpt"),
      Researcher:   new TeamAgent("Researcher",   "gemini"),
      Memory:       new TeamAgent("Memory",       "gemini"),
      Monitor:      new TeamAgent("Monitor",      "claude"),
      Strategist:   new TeamAgent("Strategist",   "chatgpt"),
    };
  }
}

// ─── Express Server ───────────────────────────────────────────────────────────

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.post("/api/orchestrate", async (req, res) => {
    const { goal, keys = {} } = req.body;

    if (!goal) {
      res.status(400).json({ error: "Goal is required" });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const send = (event: string, data: object) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    const orchestra = new Orchestra();

    send("status", { message: `🚀 Topher AI Command initializing...\nGoal: ${goal}` });

    const runAgent = async (name: string, task: string) => {
      send("agent_start", { agent: name, llm: orchestra.agents[name].llm });
      let output = "";
      await orchestra.agents[name].call(task, orchestra.memory, keys, (chunk) => {
        output += chunk;
        send("agent_chunk", { agent: name, chunk });
      });
      orchestra.memory.add({ agent: name, content: output, llm: orchestra.agents[name].llm });
      send("agent_done", { agent: name });
      return output;
    };

    try {
      // Step 1: Orchestrator plans
      await runAgent("Orchestrator", `Break down this goal into a clear research and execution plan: ${goal}`);

      // Step 2: Researcher finds raw data
      await runAgent("Researcher", `Find all relevant information, sources, and data for: ${goal}`);

      // Step 3: Analyst stress-tests findings
      await runAgent("Analyst", `Review the research findings. Challenge assumptions, find gaps, stress-test claims for: ${goal}`);

      // Step 4: Monitor verifies
      await runAgent("Monitor", `Verify all claims made so far. Flag anything unsupported or hallucinated for: ${goal}`);

      // Step 5: Creator writes the report
      await runAgent("Creator", `Write a polished, professional research brief based on all verified findings for: ${goal}`);

      // Step 6: Memory saves key findings
      await runAgent("Memory", `Summarize and save the key findings from this session for: ${goal}`);

      // Step 7: Strategist builds action plan
      const finalOutput = await runAgent("Strategist", `Build a specific, prioritized action plan for Topher based on all research for: ${goal}`);

      send("done", { final: finalOutput });
      res.end();

    } catch (error: any) {
      console.error("Orchestration error:", error);
      send("error", { message: error.message });
      res.end();
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", system: "Topher AI Command", version: "1.0.0" });
  });

  // Vite dev middleware
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
    console.log(`🚀 Topher AI Command running on http://localhost:${PORT}`);
  });
}

startServer();
