"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { post, API } from "../../lib/api";
import { getSession } from "../../lib/session";

type Msg = { role: "user" | "ai"; text: string };

export default function WhatsAppPage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getSession("mobile").then((sid) => {
      setSessionId(sid);
      if (sid) {
        // 🟢 Polling: Check every 1.5s until the order receipt is found
        const poll = setInterval(() => {
          fetchHistory(sid, poll);
        }, 1500);
        return () => clearInterval(poll);
      }
    });
  }, []);

  async function fetchHistory(sid: string, pollInterval?: NodeJS.Timeout) {
    try {
      const res = await fetch(`${API}/chat/history?sessionId=${sid}`);
      if (!res.ok) return;
      
      const history: any[] = await res.json();
      if (Array.isArray(history) && history.length > 0) {
        // 🟢 Isolate the LATEST order confirm marker
        const lastOrderIdx = history.map(m => m.text || "").findLastIndex(t => t.includes("[WA_ORDER_"));

        if (lastOrderIdx !== -1) {
          const waHistory = history.slice(lastOrderIdx).map(m => ({
            role: m.role,
            text: m.text.replace(/\[WA_ORDER_?\d*\]/, "").trim()
          }));
          setMessages(waHistory);
          // 🟢 Stop polling once the data exists
          if (pollInterval) clearInterval(pollInterval);
        }
      }
    } catch (e) { console.error("Polling Error", e); }
  }

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    if (!input.trim() || !sessionId) return;
    const userMsg = input.trim();
    setInput("");
    setLoading(true);
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);

    try {
      const res = await post("/chat/message", { sessionId, message: userMsg });
      let aiText = res.reply;
      if (res.products && res.products.length > 0) {
        const list = res.products.map((p: any) => `• ${p.name} (₹${p.price})`).join("\n");
        aiText += `\n\nFound for you:\n${list}\n\nClick 'Continue Shopping' for more info.`;
      }
      setMessages(prev => [...prev, { role: "ai", text: aiText }]);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  return (
    <div style={{ backgroundColor: '#d1d7db', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Segoe UI, Helvetica, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '1000px', height: '95vh', backgroundColor: '#f0f2f5', display: 'flex', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', borderRadius: '10px', overflow: 'hidden' }}>
        
        {/* Sidebar */}
        <div className="hidden md:flex" style={{ width: '30%', backgroundColor: 'white', borderRight: '1px solid #d1d7db', flexDirection: 'column' }}>
           <div style={{ padding: '15px', backgroundColor: '#f0f2f5', height: '60px', borderBottom: '1px solid #d1d7db' }}></div>
           <div style={{ padding: '15px', display: 'flex', gap: '15px', backgroundColor: '#f0f2f5', borderLeft: '4px solid #25d366' }}>
              <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: '#075e54', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>L</div>
              <div><div style={{ fontWeight: '600' }}>Loom AI</div><div style={{ fontSize: '13px', color: '#667781' }}>Secure Updates</div></div>
           </div>
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#efeae2', backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }}>
          <div style={{ height: '60px', backgroundColor: '#f0f2f5', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #d1d7db' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#075e54', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>L</div>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 'bold' }}>Loom AI</div><div style={{ fontSize: '12px', color: '#667781' }}>Business Account</div></div>
            <button onClick={() => router.push("/")} style={{ backgroundColor: '#25d366', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>CONTINUE SHOPPING</button>
          </div>

          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.length === 0 && (
              <div style={{ alignSelf: 'center', backgroundColor: '#fff3cd', padding: '12px 24px', borderRadius: '12px', fontSize: '14px', color: '#856404', marginTop: '20px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                ⌛ Your order info will appear here...
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ 
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor: m.role === 'user' ? '#dcf8c6' : 'white',
                padding: '10px 14px', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                maxWidth: '80%', fontSize: '14.5px', lineHeight: '20px', whiteSpace: 'pre-wrap'
              }}>
                {m.text}
                <div style={{ fontSize: '10px', color: '#888', textAlign: 'right', marginTop: '5px' }}>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            ))}
            {loading && <div style={{ alignSelf: 'flex-start', backgroundColor: 'white', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', color: '#888' }}>Typing...</div>}
            <div ref={scrollRef} />
          </div>

          <div style={{ minHeight: '62px', backgroundColor: '#f0f2f5', padding: '10px 15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
             <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder="Type a message" style={{ flex: 1, padding: '12px 15px', borderRadius: '8px', border: 'none', outline: 'none', fontSize: '15px' }} />
             <button onClick={sendMessage} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#54656f', fontSize: '20px' }}>➤</button>
          </div>
        </div>
      </div>
    </div>
  );
}