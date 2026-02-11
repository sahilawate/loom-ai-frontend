"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import { post, API } from "../../lib/api"; 
import { getSession } from "../../lib/session";

type Msg = { role: "user" | "ai"; text: string };

// 🟢 PRODUCT CARD (Fixed Spacing & Logic)
function ProductCard({ p, onAddToCart, onBuyNow, isAdded }: { p: any, onAddToCart: any, onBuyNow: any, isAdded: boolean }) {
  const [qty, setQty] = useState(1);

  // 1. Clean Parsing for Name & Stock
  let cleanName = p.name;
  let stock = 0;
  if (p.name.includes("(In Stock:")) {
      const parts = p.name.split("(In Stock:");
      cleanName = parts[0].trim();
      stock = parseInt(parts[1].replace(")", "").trim()) || 0;
  } else {
      cleanName = p.name; 
      stock = p.quantity !== undefined ? p.quantity : 10; 
  }

  const inc = () => setQty(q => (stock > 0 && q < stock) ? q + 1 : q);
  const dec = () => setQty(q => q > 1 ? q - 1 : 1);

  return (
    <div style={{ 
      display: 'flex', 
      backgroundColor: 'white', 
      borderRadius: '12px', 
      padding: '16px', 
      gap: '16px', 
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)', 
      border: '1px solid #e2e8f0', 
      marginBottom: '16px',
      height: '200px' 
    }}>
      
      {/* LEFT: IMAGE CONTAINER */}
      <div style={{ width: '130px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
              width: '100%', height: '82%', flexShrink: 0,
              backgroundColor: '#f8fafc', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
              <img 
                  src={p.image_url || 'https://via.placeholder.com/130?text=Loom'} 
                  alt={cleanName} 
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', mixBlendMode: 'multiply' }} 
              />
          </div>
      </div>

      {/* RIGHT: DETAILS COLUMN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        
        {/* ROW 1: Name (Style Preserved) */}
        <h4 style={{ margin: '0', fontSize: '19px', fontWeight: '800', color: '#0f172a', lineHeight: '1.2', textAlign: 'left' }}>
          {cleanName}
        </h4>

        {/* ROW 2: Size & Stock (Adjusted Middle Space) */}
        <div style={{ display: 'flex', alignItems: 'center', marginLeft: '8px', gap: '30px', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>
           <span style={{ backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>Size: {p.size}</span>
           <span style={{ color: stock < 5 ? '#dc2626' : '#15803d' }}>In Stock: {stock}</span>
        </div>

        {/* ROW 3: Qty & Price (Adjusted Middle Space) */}
        <div style={{ display: 'flex', alignItems: 'center', marginLeft: '8px', gap: '35px' }}>
            {/* Qty Selector */}
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '6px', height: '28px' }}>
                <button onClick={dec} style={{ width: '26px', border: 'none', background: 'transparent', fontWeight: 'bold', color: '#334155', cursor: 'pointer' }}>-</button>
                <span style={{ minWidth: '18px', textAlign: 'center', fontSize: '13px', fontWeight: '700' }}>{qty}</span>
                <button onClick={inc} style={{ width: '26px', border: 'none', background: 'transparent', fontWeight: 'bold', color: '#334155', cursor: 'pointer' }}>+</button>
            </div>
            
            {/* Price (Large Bold) */}
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a' }}>₹{p.price}</div>
        </div>

        {/* ROW 4: Action Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
            <button 
                onClick={() => onAddToCart(p.variant_id, qty)}
                disabled={stock === 0}
                style={{ 
                    flex: 1.2, height: '38px', fontSize: '11px', fontWeight: '700', borderRadius: '20px', border: 'none',
                    backgroundColor: isAdded ? '#16a34a' : '#0f172a', color: 'white', cursor: stock === 0 ? 'not-allowed' : 'pointer', opacity: stock === 0 ? 0.6 : 1
                }}
            >
               {isAdded ? "✔ Added" : "Add to Cart"}
            </button>

            <button
                onClick={() => onBuyNow(p.variant_id, qty)}
                disabled={stock === 0}
                style={{
                    flex: 1, height: '38px', fontSize: '11px', fontWeight: '700', borderRadius: '20px', border: 'none',
                    backgroundColor: '#2563eb', color: 'white', cursor: stock === 0 ? 'not-allowed' : 'pointer', opacity: stock === 0 ? 0.6 : 1
                }}
            >
              Buy Now
            </button>
        </div>
      </div>
    </div>
  );
}

export default function MobilePage() {
  const router = useRouter();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [addedItems, setAddedItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    getSession("mobile").then(async (sid) => {
      setSessionId(sid);
      try {
        const res = await fetch(`${API}/chat/history?sessionId=${sid}`);
        if (res.ok) {
          const history = await res.json();
          if (Array.isArray(history)) {
             const lastOrder = [...history].reverse().find((m: any) => m.text && m.text.includes("Order #"));
             if (lastOrder) {
               setMessages([lastOrder]);
               return;
             }
          }
        }
      } catch (e) { console.error(e); }
      setMessages([{ role: "ai", text: "Hi 👋 I’m Loom AI. I can help you shop for shirts, t-shirts, jeans, blazers and dresses." }]);
      setProducts([]);
    });
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    if (!input.trim() || !sessionId) return;
    const userMsg = input.trim();
    setInput("");
    setLoading(true);
    setMessages((m) => [...m, { role: "user", text: userMsg }]);
    setProducts([]); 

    try {
      const res = await post("/chat/message", { sessionId, message: userMsg });
      setMessages((m) => [...m, { role: "ai", text: res.reply }]);
      setProducts(res.products ?? []);
    } catch (error) {
      setMessages((m) => [...m, { role: "ai", text: "I'm having trouble connecting." }]);
    } finally {
      setLoading(false);
    }
  }

  // 3. Smart Add Handler
  async function handleAddToCart(variantId: number, quantity: number) {
    if (!sessionId) return;

    // If already added, navigate to checkout (Requested Validation)
    if (addedItems.has(variantId)) {
        router.push("/checkout");
        return;
    }

    try {
        await post("/cart/add", { sessionId, variantId, quantity });
        setAddedItems(prev => new Set(prev).add(variantId));
        setToast(`✅ Added ${quantity} item(s)!`);
        setTimeout(() => setToast(null), 2500); 
    } catch(e) {
        setToast("❌ Failed to add");
    }
  }

  // 4. Smart Buy Now Handler (The Validation You Asked For)
  async function handleBuyNow(variantId: number, quantity: number) {
    if (!sessionId) return;

    //  VALIDATION 1: If already in cart, just go to checkout.
    // This prevents adding "Extra" items and violating stock limits.
    if (addedItems.has(variantId)) {
        router.push("/checkout");
        return;
    }

    //  VALIDATION 2: If not in cart, add the selected qty THEN go to checkout.
    try {
      await post("/cart/add", { sessionId, variantId, quantity });
      router.push("/checkout");
    } catch (error) {
      console.error("Buy Now Failed", error);
      alert("Error processing request.");
    }
  }

  return (
    <>
      <Navbar mode="mobile" showBack />
      <div className="page mobile-layout" style={{ display: 'flex', height: 'calc(100vh - 60px)', overflow: 'hidden' }}>
        
        <div className="chat" style={{ flex: '1.3', display: 'flex', flexDirection: 'column', borderRight: '1px solid #e2e8f0', backgroundColor: 'white' }}>
          <div className="chat-header" style={{ padding: '15px', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>Loom AI Assistant</div>
          <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  padding: "12px 16px",
                  borderRadius: m.role === "user" ? "18px 18px 2px 18px" : "18px 18px 18px 2px",
                  backgroundColor: m.role === "user" ? "#0f172a" : "#f1f5f9",
                  color: m.role === "user" ? "white" : "#1e293b",
                  fontSize: "15px",
                  lineHeight: "1.4",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                  whiteSpace: "pre-wrap"
                }}>
                {m.text}
              </div>
            ))}
            {loading && <div style={{ alignSelf: "flex-start", padding: "10px 16px", borderRadius: "18px", backgroundColor: "#f1f5f9", color: "#64748b", fontSize: "14px" }}>Thinking…</div>}
            <div ref={chatEndRef} />
          </div>
          <div className="chat-input" style={{ padding: '15px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px' }}>
            <input style={{ flex: 1, padding: '12px', borderRadius: '25px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '15px' }}
              value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type here..." onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage} style={{ backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '50%', width: '45px', height: '45px', cursor: 'pointer' }}>➔</button>
          </div>
        </div>

        <div className="products" style={{ flex: '1.6', backgroundColor: '#f8fafc', padding: '20px', overflowY: 'auto' }}>
          <h4 style={{ marginBottom: '20px', color: '#1e293b', fontWeight: '800', fontSize: '18px' }}>Recommended</h4>
          {products.length === 0 && <p style={{ fontSize: 13, color: "#64748b" }}>Suggestions will appear here...</p>}
          
          <div>
            {products.map((p) => (
              <ProductCard 
                key={p.variant_id} 
                p={p} 
                isAdded={addedItems.has(p.variant_id)}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow} 
              />
            ))}
          </div>
        </div>
        
        {toast && (
          <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#1e293b', color: 'white', padding: '10px 20px', borderRadius: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', zIndex: 3000, fontSize: '14px', fontWeight: '600', animation: 'fadeIn 0.3s' }}>
            {toast}
          </div>
        )}
      </div>
      <style jsx>{` @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } `}</style>
    </>
  );
}