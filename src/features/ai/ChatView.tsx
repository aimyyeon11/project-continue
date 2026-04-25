import { useState } from "react";
import { Bot, Send } from "lucide-react";
import type { ChatMsg } from "@/types";

const QUICK_CHIPS = [
  "📊 Untung hari ini?",
  "🛒 Apa nak beli?",
  "💰 Macam mana nak jimat?",
  "📈 Kenapa kos naik?",
];

export const ChatView = ({ messages, onSend }: { messages: ChatMsg[]; onSend: (t: string) => void }) => {
  const [input, setInput] = useState("");
  const submit = (text: string) => {
    if (!text.trim()) return;
    onSend(text);
    setInput("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <header className="px-5 pt-6 pb-3 flex items-center gap-3 border-b border-border">
        <div className="w-11 h-11 rounded-full bg-gradient-profit grid place-items-center shadow-glow">
          <Bot className="w-6 h-6 text-profit-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-extrabold leading-tight">Tanya AI 💬</h1>
          <p className="text-[11px] text-profit font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-profit inline-block" /> Online sentiasa
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 no-scrollbar">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
            <div className={`max-w-[78%] px-3.5 py-2.5 text-sm leading-snug rounded-2xl ${
              m.from === "user"
                ? "bg-gradient-profit text-profit-foreground rounded-br-md"
                : "bg-surface-elevated text-foreground rounded-bl-md border border-border"
            }`}>
              {m.text.split("**").map((part, i) =>
                i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="px-3 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
        {QUICK_CHIPS.map(c => (
          <button key={c} onClick={() => submit(c)} className="shrink-0 h-9 px-3 rounded-full bg-surface border border-border text-xs font-semibold text-muted-foreground tap">
            {c}
          </button>
        ))}
      </div>

      <div className="px-3 pb-3 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit(input)}
          placeholder="Tulis soalan Boss..."
          className="flex-1 h-12 px-4 rounded-full bg-surface-elevated border border-border focus:outline-none focus:border-primary text-sm"
        />
        <button onClick={() => submit(input)} className="w-12 h-12 rounded-full bg-gradient-profit text-profit-foreground grid place-items-center tap shadow-card">
          <Send className="w-5 h-5" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};
