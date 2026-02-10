"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import { post, API } from "../../lib/api"; 
import { getSession } from "../../lib/session";

type Msg = { role: "user" | "ai"; text: string };

export default function MobilePage() {
  const router = useRouter();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  // 🟢 State for "Added to Cart" Pop-up
  const [toast, setToast] = useState<string | null>(null);

  // 1. Load Session & SMART History
  useEffect(() => {
    getSession("mobile").then(async (sid) => {
      setSessionId(sid);

      try {
        const res = await fetch(`${API}/chat/history?sessionId=${sid}`);
        
        if (res.ok) {
          const history = await res.json();
          
          if (Array.isArray(history)) {
             // Preservation of history reverse logic
             const lastOrder = [...history].reverse().find((m: any) => m.text && m.text.includes("Order #"));

             if (lastOrder) {
               setMessages([lastOrder]);
               return;
             }
          }
        }
      } catch (e) {
        console.error("History load error", e);
      }

      setMessages([
        {
          role: "ai",
          text: "Hi 👋 I’m Loom AI. I can help you shop for shirts, t-shirts, jeans, blazers and dresses."
        }
      ]);

      setProducts([]);
    });
  }, []);

  // 2. Send Message
  async function sendMessage() {
    if (!input.trim() || !sessionId) return;

    const userMsg = input.trim();
    setInput("");
    setLoading(true);

    setMessages((m) => [...m, { role: "user", text: userMsg }]);
    setProducts([]); 

    try {
      const res = await post("/chat/message", {
        sessionId,
        message: userMsg
      });

      setMessages((m) => [...m, { role: "ai", text: res.reply }]);
      setProducts(res.products ?? []);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages((m) => [...m, { role: "ai", text: "I'm having trouble connecting. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  // 🟢 ADD TO CART Logic
  async function addToCart(variantId: number) {
    if (!sessionId) return;
    try {
        await post("/cart/add", {
            sessionId,
            variantId
        });
        
        setToast("✅ Added to cart!");
        setTimeout(() => setToast(null), 3000); 

    } catch(e) {
        setToast("❌ Failed to add");
        setTimeout(() => setToast(null), 3000);
    }
  }

  // "Buy Now" Logic
  async function buyNow(variantId: number) {
    if (!sessionId) return;

    try {
      await post("/cart/add", { sessionId, variantId, quantity: 1 });
      router.push("/checkout");
    } catch (error) {
      console.error("Buy Now Failed", error);
      alert("Could not process request. Please try again.");
    }
  }

  return (
    <>
      <Navbar mode="mobile" showBack />

      <div className="page mobile-layout" style={{ display: 'flex', height: 'calc(100vh - 60px)', overflow: 'hidden' }}>
        {/* 🟢 CHAT PANEL (Increased flex to 1.3 for wider area) */}
        <div className="chat" style={{ flex: '1.3', display: 'flex', flexDirection: 'column', borderRight: '1px solid #e2e8f0', backgroundColor: 'white' }}>
          <div className="chat-header" style={{ padding: '15px', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>Loom AI Assistant</div>

          {/* 🟢 WHATSAPP STYLE MESSAGES AREA */}
          <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%", // Slightly wider
                  padding: "12px 16px", // More padding
                  borderRadius: m.role === "user" ? "18px 18px 2px 18px" : "18px 18px 18px 2px",
                  backgroundColor: m.role === "user" ? "#0f172a" : "#f1f5f9",
                  color: m.role === "user" ? "white" : "#1e293b",
                  fontSize: "15px", // 🟢 Increased by 1 (was 14px)
                  lineHeight: "1.4",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
                }}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: "flex-start", padding: "12px 16px", borderRadius: "18px", backgroundColor: "#f1f5f9", color: "#64748b", fontSize: "15px" }}>
                Thinking…
              </div>
            )}
          </div>

          <div className="chat-input" style={{ padding: '15px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px' }}>
            <input
              style={{ flex: 1, padding: '12px', borderRadius: '25px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '15px' }}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button 
              onClick={sendMessage}
              style={{ backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '50%', width: '45px', height: '45px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ➔
            </button>
          </div>
        </div>

        {/* 🟢 RECOMMENDATIONS PANEL (Increased flex to 1.6) */}
        <div className="products" style={{ flex: '1.6', backgroundColor: '#f1f5f9', padding: '20px', overflowY: 'auto' }}>
          <h4 style={{ marginBottom: '15px', color: '#1e293b', fontWeight: '700' }}>Recommended</h4>

          {products.length === 0 && (
            <p style={{ fontSize: 13, color: "#64748b" }}>
              Products will appear here based on your chat
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {products.map((p) => (
              <div key={p.variant_id} className="product-card" style={{ 
                display: 'flex', 
                backgroundColor: 'white', 
                borderRadius: '12px', 
                padding: '16px', // Slightly larger padding
                gap: '15px', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)', // Stronger shadow
                border: '1px solid #e2e8f0'
              }}>
                <img 
                    src={p.image_url || 'https://via.placeholder.com/110?text=Loom+AI'} 
                    alt={p.name} 
                    style={{ 
                        width: '120px', // Slightly larger image
                        height: '120px', 
                        objectFit: 'cover', 
                        borderRadius: '8px',
                        backgroundColor: '#f8fafc',
                        flexShrink: 0
                    }} 
                />

                <div className="info" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '19px', fontWeight: '800', color: '#0f172a' }}>{p.name}</h4>
                  
                  <p style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: '600', color: '#475569' }}>
                    Size {p.size} · ₹{p.price}
                  </p>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                        onClick={() => addToCart(p.variant_id)}
                        style={{ 
                            flex: 1, 
                            height: '44px', // Slightly taller
                            fontSize: '13px', 
                            fontWeight: '700', 
                            borderRadius: '30px', 
                            border: 'none',
                            backgroundColor: '#0f172a',
                            cursor: 'pointer',
                            color: 'white'
                        }}
                    >
                      Add to Cart
                    </button>

                    <button
                      style={{
                        flex: 1,
                        height: '44px',
                        fontSize: '13px',
                        fontWeight: '700',
                        borderRadius: '30px',
                        background: "#2563eb",
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                      onClick={() => buyNow(p.variant_id)}
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* TOAST NOTIFICATION UI */}
        {toast && (
          <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#1e293b',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '50px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            zIndex: 2000,
            fontSize: '14px',
            fontWeight: '600',
            animation: 'fadeIn 0.3s ease-in-out',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {toast}
          </div>
        )}

      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </>
  );
}