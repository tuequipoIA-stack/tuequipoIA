"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { buildBusinessContext } from "@/lib/businessContext";
import { askClaude } from "@/lib/chat";

export default function ChatView({ agent, business, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [contextText, setContextText] = useState("");
  const bottomRef = useRef(null);
  const Icon = agent.icon;

  useEffect(() => {
    buildBusinessContext(business).then(setContextText);
  }, [business]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const reply = await askClaude({
        system: `${agent.system}\n\n${contextText}`,
        messages: newMessages,
        max_tokens: 1000,
      });
      setMessages((prev) => [...prev, { role: "assistant", content: reply || "No pude generar una respuesta, probá de nuevo." }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Hubo un error de conexión. Probá de nuevo en un momento." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 pb-4 mb-4" style={{ borderBottom: "1px solid #e4dfd3" }}>
        <button onClick={onBack} className="p-1.5 rounded-md hover:opacity-70" style={{ color: BRAND.navy }}>
          <ArrowLeft size={18} />
        </button>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: agent.color }}>
          <Icon size={16} color={agent.id === "marketing" ? BRAND.navy : BRAND.cream} />
        </div>
        <div>
          <div style={{ color: BRAND.navy }} className="text-sm font-semibold leading-none">{agent.name}</div>
          <div style={{ color: "#8a8578" }} className="text-xs mt-0.5">{agent.rol} · con contexto de tu negocio</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.length === 0 && (
          <div style={{ color: "#8a8578" }} className="text-sm text-center mt-10">
            Contale a {agent.name} qué necesitás hoy. Ya conoce tus ventas, gastos, visión y tareas.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
              style={m.role === "user" ? { background: BRAND.navy, color: BRAND.cream } : { background: "#ffffff", color: BRAND.navy, border: "1px solid #e4dfd3" }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-4 py-2.5 text-sm" style={{ background: "#ffffff", color: "#8a8578", border: "1px solid #e4dfd3" }}>
              {agent.name} está pensando...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="pt-4 mt-2" style={{ borderTop: "1px solid #e4dfd3" }}>
        <div className="flex items-end gap-2">
          <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey}
            placeholder={`Escribile a ${agent.name}...`} rows={1}
            className="flex-1 resize-none rounded-xl px-4 py-3 text-sm outline-none"
            style={{ background: "#ffffff", color: BRAND.navy, border: "1px solid #e4dfd3" }} />
          <button onClick={send} disabled={loading || !input.trim()} className="rounded-xl p-3 disabled:opacity-40"
            style={{ background: BRAND.teal, color: BRAND.navy }}>
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
