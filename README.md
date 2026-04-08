# Topher AI Command

### AI Orchestra Agent — Claude-Led Multi-LLM Command Center

> *“Deploy a team of world-class AI specialists on any problem, in seconds.”*

-----

## What Is This?

Topher AI Command is a master-level AI orchestration system that coordinates multiple AI models as a unified team. Each agent has a specific role, voice, and capability. Together they produce research, strategy, code, compliance analysis, and action plans that no single AI could match alone.

This is not a chatbot. This is an AI command center.

-----

## The Team

|Agent           |Powered By         |Role                                                |
|----------------|-------------------|----------------------------------------------------|
|**Orchestrator**|Claude (Anthropic) |Lead architect, routing, reasoning, quality control |
|**Analyst**     |Grok (xAI)         |Bold synthesis, stress testing, adversarial review  |
|**Creator**     |ChatGPT (OpenAI)   |Writing, ideation, documentation, compliance writing|
|**Researcher**  |Gemini (Google)    |Live web search, broad synthesis, visual data       |
|**Memory**      |NotebookLM (Google)|Persistent knowledge, source grounding, document hub|
|**Strategist**  |ChatGPT (OpenAI)   |Personalized action plans, go-to-market, execution  |
|**Monitor**     |Claude (Anthropic) |Fact checking, audit trail, hallucination prevention|

-----

## How It Works

```
You give it a goal or question
        ↓
Orchestrator (Claude) breaks it down and routes to the team
        ↓
Researcher (Gemini) finds live sources and raw data
        ↓
Analyst (Grok) extracts patterns, stress-tests findings
        ↓
Monitor (Claude) verifies every claim, flags gaps
        ↓
Creator (ChatGPT) writes the report or document
        ↓
Memory (NotebookLM) stores everything for future sessions
        ↓
Strategist (ChatGPT) builds YOUR personalized action plan
        ↓
You get a bulletproof research report + action plan
```

-----

## Use Cases

|Project                    |Agents Deployed                         |
|---------------------------|----------------------------------------|
|Chess coaching research    |Researcher + Memory + Analyst           |
|MortgageOS compliance      |Monitor + Creator + Memory              |
|Competitive market analysis|Researcher + Analyst + Strategist       |
|Code architecture review   |Orchestrator + Analyst                  |
|Business strategy          |All agents                              |
|Any new project            |Swap Domain Expert — rest stays the same|

-----

## Tech Stack

- **Backend:** Node.js + Express + TypeScript
- **Frontend:** React + Vite + Tailwind CSS
- **Streaming:** Server-Sent Events (SSE) for real-time agent output
- **LLMs:** Anthropic Claude, OpenAI GPT, xAI Grok, Google Gemini
- **Memory:** NotebookLM + persistent session memory
- **Deployment:** Vercel (frontend) + Railway (backend)

-----

## Project Structure

```
topher-ai-command/
├── server.ts              ← Express backend + agent orchestration
├── src/
│   ├── agents/
│   │   ├── orchestrator.ts   ← Claude — lead routing + reasoning
│   │   ├── analyst.ts        ← Grok — stress testing + synthesis
│   │   ├── creator.ts        ← ChatGPT — writing + docs
│   │   ├── researcher.ts     ← Gemini — live search + data
│   │   ├── memory.ts         ← NotebookLM — knowledge persistence
│   │   ├── monitor.ts        ← Claude — fact checking + audit
│   │   └── strategist.ts     ← ChatGPT — action planning
│   ├── core/
│   │   ├── SharedMemory.ts   ← Session memory across agents
│   │   ├── TeamAgent.ts      ← Base agent class
│   │   └── Orchestra.ts      ← Orchestration engine
│   ├── App.tsx               ← React frontend
│   ├── main.tsx
│   └── index.css
├── .env.example           ← API key template
├── package.json
└── README.md
```

-----

## Environment Variables

```bash
ANTHROPIC_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
XAI_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
```

-----

## Build Philosophy

> Built by Topher Bettis — First Technology Chair at NAMB.
> Mission: Bless humans and give them better lives through AI.
> 
> This system is the AI infrastructure layer behind every project:
> chess coaching, mortgage technology, and AI tools that matter.

-----

## Roadmap

- [x] Core agent architecture
- [x] Multi-LLM streaming
- [x] Shared memory system
- [ ] NotebookLM persistent memory integration
- [ ] Domain Expert hot-swap system
- [ ] Web search tool integration
- [ ] Deploy to production
- [ ] White-label for partner coaches and instructors

-----

*Part of the TopherAI project ecosystem.*
