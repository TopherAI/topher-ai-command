import { useState, useRef, useEffect } from "react";

const AGENTS = [
  { name: "Orchestrator", llm: "Claude",    color: "#7C3AED", emoji: "🎯" },
  { name: "Researcher",   llm: "Gemini",    color: "#059669", emoji: "🔍" },
  { name: "Analyst",      llm: "Grok",      color: "#DC2626", emoji: "⚡" },
  { name: "Monitor",      llm: "Claude",    color: "#7C3AED", emoji: "🛡️" },
  { name: "Creator",      llm: "ChatGPT",   color: "#2563EB", emoji: "✍️" },
  { name: "Memory",       llm: "NotebookLM",color: "#D97706", emoji: "🧠" },
  { name: "Strategist",   llm: "ChatGPT",   color: "#2563EB", emoji: "🚀" },
];

interface AgentOutput {
  name: string;
  llm: string;
  content: string;
  status: "waiting" | "running" | "done" | "error";
  color: string;
  emoji: string;
}

export default function App() {
  const [goal, setGoal] = useState("");
  const [keys, setKeys] = useState({
    ANTHROPIC_API_KEY: "",
    OPENAI_API_KEY: "",
    XAI_API_KEY: "",
    GEMINI_API_KEY: "",
  });
  const [showKeys, setShowKeys] = useState(false);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("");
  const [outputs, setOutputs] = useState<AgentOutput[]>(
    AGENTS.map(a => ({ ...a, content: "", status: "waiting" as const }))
  );
  const [finalOutput, setFinalOutput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [outputs, finalOutput]);

  const updateAgent = (name: string, patch: Partial<AgentOutput>) => {
    setOutputs(prev => prev.map(a => a.name === name ? { ...a, ...patch } : a));
  };

  const handleRun = async () => {
    if (!goal.trim()) return;
    setRunning(true);
    setFinalOutput("");
    setStatus("🚀 Topher AI Command initializing...");
    setOutputs(AGENTS.map(a => ({ ...a, content: "", status: "waiting" as const })));

    try {
      const res = await fetch("/api/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, keys }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let lastEvent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("event:")) {
            lastEvent = line.replace("event:", "").trim();
            continue;
          }
          if (!line.startsWith("data:")) continue;
          try {
            const data = JSON.parse(line.slice(5).trim());
            if (lastEvent === "status") setStatus(data.message);
            if (lastEvent === "agent_start") updateAgent(data.agent, { status: "running" });
            if (lastEvent === "agent_chunk") {
              setOutputs(prev => prev.map(a =>
                a.name === data.agent
                  ? { ...a, content: a.content + data.chunk, status: "running" }
                  : a
              ));
            }
            if (lastEvent === "agent_done") updateAgent(data.agent, { status: "done" });
            if (lastEvent === "done") setFinalOutput(data.final);
            if (lastEvent === "error") setStatus(`❌ Error: ${data.message}`);
          } catch {}
        }
      }
    } catch (err: any) {
      setStatus(`❌ Connection error: ${err.message}`);
    }

    setRunning(false);
    setStatus("✅ Mission complete.");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#e2e8f0", fontFamily: "system-ui, sans-serif", padding: "24px" }}>

      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, background: "linear-gradient(135deg, #7C3AED, #2563EB)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0 }}>
          Topher AI Command
        </h1>
        <p style={{ color: "#94a3b8", marginTop: "8px" }}>Claude-Led Multi-LLM Orchestra · 7 Agents · Real-Time Streaming</p>
      </div>

      <div style={{ maxWidth: "800px", margin: "0 auto 24px" }}>
        <button onClick={() => setShowKeys(!showKeys)}
          style={{ background: "#1e1b4b", border: "1px solid #3730a3", color: "#a5b4fc", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem" }}>
          {showKeys ? "▲ Hide API Keys" : "▼ Configure API Keys"}
        </button>
        {showKeys && (
          <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", padding: "16px", marginTop: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {Object.entries(keys).map(([key, val]) => (
              <div key={key}>
                <label style={{ display: "block", fontSize: "0.75rem", color: "#64748b", marginBottom: "4px" }}>{key}</label>
                <input
                  type="password"
                  value={val}
                  onChange={e => setKeys(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder={`Enter ${key}`}
                  style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", color: "#e2e8f0", padding: "8px 12px", borderRadius: "6px", fontSize: "0.8rem", boxSizing: "border-box" }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ maxWidth: "800px", margin: "0 auto 24px" }}>
        <textarea
          value={goal}
          onChange={e => setGoal(e.target.value)}
          placeholder="Enter your goal or question for the AI Command team..."
          rows={3}
          style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", color: "#e2e8f0", padding: "16px", borderRadius: "12px", fontSize: "1rem", resize: "vertical", boxSizing: "border-box" }}
        />
        <button
          onClick={handleRun}
          disabled={running || !goal.trim()}
          style={{ marginTop: "12px", width: "100%", background: running ? "#374151" : "linear-gradient(135deg, #7C3AED, #2563EB)", color: "white", border: "none", padding: "14px", borderRadius: "12px", fontSize: "1rem", fontWeight: 700, cursor: running ? "not-allowed" : "pointer" }}>
          {running ? "⏳ Running Mission..." : "🚀 Deploy AI Command Team"}
        </button>
      </div>

      {status && (
        <div style={{ maxWidth: "800px", margin: "0 auto 24px", background: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", padding: "12px 16px", fontSize: "0.9rem", color: "#94a3b8" }}>
          {status}
        </div>
      )}

      <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "16px" }}>
        {outputs.map(agent => (
          <div key={agent.name} style={{
            background: "#0f172a",
            border: `1px solid ${agent.status === "running" ? agent.color : "#1e293b"}`,
            borderRadius: "12px",
            padding: "16px",
            boxShadow: agent.status === "running" ? `0 0 20px ${agent.color}33` : "none",
            transition: "all 0.3s"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <span style={{ fontSize: "1.2rem" }}>{agent.emoji}</span>
              <div>
                <div style={{ fontWeight: 700, color: agent.color }}>{agent.name}</div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{agent.llm}</div>
              </div>
              <div style={{ marginLeft: "auto", fontSize: "0.75rem", padding: "2px 8px", borderRadius: "20px",
                background: agent.status === "running" ? `${agent.color}22` : agent.status === "done" ? "#16a34a22" : "#1e293b",
                color: agent.status === "running" ? agent.color : agent.status === "done" ? "#16a34a" : "#475569"
              }}>
                {agent.status === "running" ? "● Running" : agent.status === "done" ? "✓ Done" : "Waiting"}
              </div>
            </div>
            <div style={{
              background: "#020617",
              borderRadius: "8px",
              padding: "12px",
              minHeight: "120px",
              maxHeight: "300px",
              overflowY: "auto",
              fontSize: "0.8rem",
              lineHeight: "1.6",
              color: "#cbd5e1",
              whiteSpace: "pre-wrap"
            }}>
              {agent.content || <span style={{ color: "#334155" }}>Waiting for task...</span>}
              {agent.status === "running" && <span style={{ color: agent.color }}>▋</span>}
            </div>
          </div>
        ))}
      </div>

      {finalOutput && (
        <div style={{ maxWidth: "800px", margin: "32px auto 0", background: "#0f172a", border: "1px solid #7C3AED", borderRadius: "12px", padding: "24px" }}>
          <h2 style={{ color: "#7C3AED", marginTop: 0, fontSize: "1.2rem" }}>🎯 Strategic Action Plan</h2>
          <div style={{ fontSize: "0.9rem", lineHeight: "1.8", color: "#cbd5e1", whiteSpace: "pre-wrap" }}>{finalOutput}</div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
