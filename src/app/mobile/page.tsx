"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import { post, API } from "../../lib/api"; 
import { getSession } from "../../lib/session";

type Msg = { role: "user" | "ai"; text: string };

function ProductCard({ p, onSelect }: any) {
  let cleanName = p.name;
  if (p.name.includes("(In Stock:")) {
      cleanName = p.name.split("(In Stock:")[0].trim();
  }
  
  const sizeList = p.sizes && p.sizes.length > 0 ? p.sizes.join(", ") : "Universal";
  const stock = p.quantity !== undefined ? p.quantity : 0;

  return (
    <div style={{ display: 'flex', backgroundColor: 'white', borderRadius: '16px', padding: '16px', gap: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', marginBottom: '16px', transition: '0.2s', height: '220px', maxWidth: '420px', margin: '0 auto 16px auto' }}>
      <div onClick={() => onSelect(p)} style={{ width: '130px', cursor: 'pointer', backgroundColor: '#f8fafc', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={p.image_url || 'https://via.placeholder.com/100?text=Loom'} alt={cleanName} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', mixBlendMode: 'multiply' }} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '4px 0' }}>
        <div>
            <h4 onClick={() => onSelect(p)} style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '800', color: '#0f172a', cursor: 'pointer', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.2' }}>{cleanName}</h4>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Sizes: {sizeList}</div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: stock < 5 ? '#dc2626' : '#15803d' }}>In Stock: {stock}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a' }}>₹{p.price}</div>
        </div>
        <button onClick={() => onSelect(p)} style={{ padding: '8px 0', width: '100%', borderRadius: '25px', border: '1px solid #0f172a', backgroundColor: 'transparent', color: '#0f172a', fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: '0.2s' }}>
           View Details
        </button>
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
  
  const [cartMap, setCartMap] = useState<Record<number, number>>({});
  const [addedItems, setAddedItems] = useState<Set<number>>(new Set());
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [qty, setQty] = useState(1);

  useEffect(() => {
    getSession("mobile").then(async (sid) => {
      setSessionId(sid);
      fetchCartState(sid);
      try {
        const res = await fetch(`${API}/chat/history?sessionId=${sid}`);
        if (res.ok) {
          const history = await res.json();
          if (Array.isArray(history) && history.length > 0) {
             setMessages(history);
             return;
          }
        }
      } catch (e) { console.error(e); }
      setMessages([{ role: "ai", text: "Hello! I'm your Loom AI Stylist. I can find products, answer technical questions, and explicitly manage your cart. How can I help?" }]);
    });
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 2500); }

  async function fetchCartState(sid: string) {
      try {
          const res = await fetch(`${API}/cart?sessionId=${sid}`);
          const data = await res.json();
          const map: Record<number, number> = {};
          const addedSet = new Set<number>();
          if (data.items) {
              data.items.forEach((item: any) => {
                  map[item.variant_id] = (map[item.variant_id] || 0) + item.quantity;
                  addedSet.add(item.variant_id);
              });
          }
          setCartMap(map);
          setAddedItems(addedSet);
      } catch (e) {}
  }

  async function processCartResponse(res: any, variantId: number) {
    if (res.success === false) {
      if (res.error === "STOCK_LIMIT") { showToast(`⚠️ ${res.message}`); return false; }
      showToast("❌ Failed to process request");
      return false;
    }
    if (sessionId) fetchCartState(sessionId);
    return true;
  }

  async function sendMessage(overrideMsg?: string, overrideContext?: any) {
    const userMsg = overrideMsg || input.trim();
    if (!userMsg || !sessionId) return;
    
    if (!overrideMsg) setInput(""); 
    setLoading(true);
    setMessages((m) => [...m, { role: "user", text: userMsg }]);

    let activeContext = null;
    if (overrideContext !== undefined) {
        activeContext = overrideContext;
    } else if (selectedProduct) {
        activeContext = {
            ...selectedProduct,
            userSelectedSize: selectedSize, 
            userSelectedQty: qty
        };
    }

    try {
      const res = await post("/chat/message", { 
          sessionId, message: userMsg, contextProduct: activeContext, channel: "mobile" 
      });
      
      setMessages((m) => [...m, { role: "ai", text: res.reply }]);
      if (res.products && res.products.length > 0) setProducts(res.products);

      if (res.action && res.action.type === "CHECKOUT") {
        setTimeout(() => router.push("/checkout"), 1000);
        return;
      }

      if (res.action && res.action.type === "REFRESH_CART") {
        fetchCartState(sessionId);
        showToast("🛒 Cart emptied successfully!");
      }

      if (res.action && res.action.type === "ADD_TO_CART") {
        const targetSize = res.action.size || 'Universal';
        const targetQuantity = res.action.quantity || 1;
        
        const cartRes = await post("/cart/add", { sessionId, variantId: res.action.variantId, quantity: targetQuantity, size: targetSize });
        if (await processCartResponse(cartRes, res.action.variantId)) {
           setSelectedSize("");
           setQty(1);
           showToast(`✅ Agent added ${targetQuantity} item(s) to your cart!`);
        } else {
           setMessages((m) => [...m, { role: "ai", text: "I tried adding that, but we don't have enough stock in the warehouse!" }]);
        }
      }

    } catch (error) {
      setMessages((m) => [...m, { role: "ai", text: "I'm having trouble connecting to my agent network." }]);
    } finally {
      setLoading(false);
    }
  }

  function requiresSizeSelection() {
    return selectedProduct && selectedProduct.sizes && selectedProduct.sizes.length > 0 && selectedProduct.sizes[0] !== 'Universal' && !selectedSize;
  }

  async function handleManualAdd() {
    if (requiresSizeSelection()) { showToast("⚠️ Select a size first!"); return; }
    try {
        const cartRes = await post("/cart/add", { sessionId, variantId: selectedProduct.variant_id, quantity: qty, size: selectedSize || 'Universal' });
        if (await processCartResponse(cartRes, selectedProduct.variant_id)) {
           showToast(`✅ Added ${qty} item(s) to Cart!`); 
           setSelectedSize(""); 
           setQty(1);
        }
    } catch(e) { showToast("❌ Failed to add to cart"); }
  }

  async function handleManualBuy() {
    if (addedItems.has(selectedProduct.variant_id)) { router.push("/checkout"); return; }
    if (requiresSizeSelection()) { showToast("⚠️ Select a size first!"); return; }
    try {
      const cartRes = await post("/cart/add", { sessionId, variantId: selectedProduct.variant_id, quantity: qty, size: selectedSize || 'Universal' });
      if (await processCartResponse(cartRes, selectedProduct.variant_id)) router.push("/checkout");
    } catch (error) { showToast("❌ Error processing request."); }
  }

  function openProductModal(item: any) {
    if (sessionId) fetchCartState(sessionId);
    setSelectedProduct(item);
    setSelectedSize(""); 
    setQty(1);
    sendMessage(`Please summarize the details and specifications of the ${item.name}.`, item);
  }

  const maxAvailable = selectedProduct ? (selectedProduct.quantity - (cartMap[selectedProduct.variant_id] || 0)) : 0;
  const isOutOfStockInCart = maxAvailable <= 0;

  // 🟢 SMART PARSER: Hides WA markers and creates the dark Mobile App button!
  const renderMessageContent = (text: string) => {
    if (!text) return null;

    // 1. Silently remove the [WA_ORDER_...] tag from the UI
    let cleanText = text.replace(/\[WA_ORDER_\d+\]/g, "").trim();

    // 2. Catch old raw links and convert them to the marker (for backwards compatibility)
    cleanText = cleanText.replace(/👇 \*Click the link below to track your order live:\*\n🌐 http:\/\/localhost:3000\/orders/g, "[TRACK_ORDER_BTN]");
    cleanText = cleanText.replace(/http:\/\/localhost:3000\/orders/g, "[TRACK_ORDER_BTN]");
    cleanText = cleanText.replace(/\[Track Order\]\(http:\/\/localhost:3000\/orders\)/g, "[TRACK_ORDER_BTN]");

    // 3. Render the beautiful dark Mobile App button!
    if (cleanText.includes("[TRACK_ORDER_BTN]")) {
        const parts = cleanText.split("[TRACK_ORDER_BTN]");
        return (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{parts[0].trim()}</div>
                
                <button 
                    onClick={() => router.push('/orders')}
                    style={{
                        backgroundColor: '#0f172a', // Dark theme matching mobile app buttons
                        color: 'white',
                        border: 'none',
                        padding: '12px 20px',
                        borderRadius: '12px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        fontSize: '15px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        marginTop: '15px',
                        marginBottom: '10px',
                        width: '100%',
                        transition: 'all 0.2s ease'
                    }}
                >
                    📦 Track Order
                </button>
                
                {parts[1] && <div style={{ whiteSpace: 'pre-wrap', marginTop: '4px', lineHeight: '1.5' }}>{parts[1].trim()}</div>}
            </div>
        );
    }

    return <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{cleanText}</div>;
  };

  return (
    <>
      <Navbar mode="mobile" showBack />
      <div className="page" style={{ display: 'flex', height: 'calc(100vh - 60px)', overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
        
        {/* CHAT */}
        <div className="chat" style={{ flex: '1.2', display: 'flex', flexDirection: 'column', backgroundColor: 'white', borderRight: '1px solid #e2e8f0' }}>
          <div className="chat-header" style={{ padding: '15px', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>Loom AI Assistant</div>
          <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%", padding: "12px 16px", borderRadius: m.role === "user" ? "18px 18px 2px 18px" : "18px 18px 18px 2px", backgroundColor: m.role === "user" ? "#0f172a" : "#f8fafc", color: m.role === "user" ? "white" : "#1e293b", fontSize: "14px", lineHeight: "1.4", whiteSpace: "pre-wrap", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                {/* 🟢 Replaced {m.text} with the smart renderer */}
                {renderMessageContent(m.text)}
              </div>
            ))}
            {loading && <div style={{ alignSelf: "flex-start", padding: "10px 16px", borderRadius: "18px", backgroundColor: "#f8fafc", color: "#3b82f6", fontSize: "13px", fontWeight: "bold" }}>Agent is thinking...</div>}
            <div ref={chatEndRef} />
          </div>
          <div className="chat-input" style={{ padding: '15px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px' }}>
            <input style={{ flex: 1, padding: '12px', borderRadius: '25px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' }} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask anything! ('Add 2 of size L', 'Checkout')" onKeyDown={(e) => e.key === "Enter" && sendMessage()} />
            <button onClick={() => sendMessage()} style={{ backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '50%', width: '45px', height: '45px', cursor: 'pointer' }}>➔</button>
          </div>
        </div>

        {/* GRID */}
        <div className="products" style={{ flex: selectedProduct ? '1' : '1.8', padding: '20px', overflowY: 'auto', transition: 'flex 0.3s ease' }}>
          <h4 style={{ marginBottom: '20px', color: '#1e293b', fontWeight: '800', textAlign: 'center' }}>Results</h4>
          {products.length === 0 && <p style={{ fontSize: 13, color: "#64748b", textAlign: 'center' }}>Search for products to see results...</p>}
          <div>{products.map((p) => <ProductCard key={p.variant_id} p={p} onSelect={openProductModal} />)}</div>
        </div>

        {/* SIDE PANEL */}
        {selectedProduct && (
          <div style={{ flex: '1.2', backgroundColor: 'white', borderLeft: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.3s' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <span style={{ fontWeight: '800', color: '#0f172a' }}>Product Details</span>
               <button onClick={() => setSelectedProduct(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px', color: '#64748b' }}>✕</button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              <div style={{ width: '100%', height: '280px', backgroundColor: '#f8fafc', borderRadius: '12px', display: 'flex', justifyContent: 'center', padding: '10px', marginBottom: '20px' }}>
                <img src={selectedProduct.image_url} alt={selectedProduct.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', mixBlendMode: 'multiply' }} />
              </div>
              <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>{selectedProduct.brand || 'Loom Premium'}</h2>
              <p style={{ fontSize: '22px', color: '#0f172a', fontWeight: '800', margin: '6px 0 16px', lineHeight: '1.2' }}>{selectedProduct.name.split("(In Stock:")[0].trim()}</p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a' }}>₹{selectedProduct.price}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                     <div style={{ backgroundColor: selectedProduct.quantity < 5 ? '#fef2f2' : '#f0fdf4', color: selectedProduct.quantity < 5 ? '#dc2626' : '#15803d', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '800' }}>
                         Warehouse: {selectedProduct.quantity || 0}
                     </div>
                     {(cartMap[selectedProduct.variant_id] > 0) && (
                        <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: 'bold', marginTop: '4px' }}>
                           ({cartMap[selectedProduct.variant_id]} already in cart)
                        </div>
                     )}
                  </div>
              </div>

              {selectedProduct.sizes && selectedProduct.sizes[0] !== 'Universal' && (
                <div style={{ margin: '24px 0' }}>
                  <p style={{ fontWeight: '800', fontSize: '13px', marginBottom: '12px', color: '#334155' }}>SELECT SIZE <span style={{color: '#dc2626'}}>*</span></p>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {selectedProduct.sizes.map((s: string) => (
                      <button key={s} onClick={() => setSelectedSize(s)} style={{ padding: '10px 24px', borderRadius: '8px', border: selectedSize === s ? '2px solid #0f172a' : '1px solid #cbd5e1', backgroundColor: selectedSize === s ? '#f1f5f9' : 'white', fontWeight: '700', fontSize: '14px', cursor: 'pointer', transition: '0.2s' }}>{s}</button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ margin: '24px 0' }}>
                 <p style={{ fontWeight: '800', fontSize: '13px', marginBottom: '12px', color: '#334155' }}>QUANTITY</p>
                 <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '25px', width: '110px', height: '40px', opacity: isOutOfStockInCart ? 0.5 : 1 }}>
                    <button onClick={() => setQty(q => q > 1 ? q - 1 : 1)} disabled={isOutOfStockInCart} style={{ flex: 1, border: 'none', background: 'transparent', cursor: isOutOfStockInCart ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '18px' }}>-</button>
                    <span style={{ flex: 1, textAlign: 'center', fontSize: '16px', fontWeight: '700' }}>{isOutOfStockInCart ? 0 : qty}</span>
                    <button onClick={() => setQty(q => q < maxAvailable ? q + 1 : q)} disabled={isOutOfStockInCart} style={{ flex: 1, border: 'none', background: 'transparent', cursor: isOutOfStockInCart ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '18px' }}>+</button>
                 </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '36px' }}>
                <button onClick={handleManualAdd} disabled={isOutOfStockInCart} style={{ flex: 1, padding: '12px 6px', borderRadius: '25px', border: '2px solid #0f172a', backgroundColor: 'white', color: '#0f172a', fontWeight: '800', fontSize: '13px', whiteSpace: 'nowrap', cursor: isOutOfStockInCart ? 'not-allowed' : 'pointer', transition: '0.2s', opacity: isOutOfStockInCart ? 0.5 : 1 }}>
                  {isOutOfStockInCart ? "Max in Cart" : "Add to Cart"}
                </button>
                <button onClick={handleManualBuy} disabled={isOutOfStockInCart && !addedItems.has(selectedProduct.variant_id)} style={{ flex: 1.2, padding: '12px 6px', borderRadius: '25px', border: 'none', backgroundColor: '#0f172a', color: 'white', fontWeight: '800', fontSize: '13px', whiteSpace: 'nowrap', cursor: (isOutOfStockInCart && !addedItems.has(selectedProduct.variant_id)) ? 'not-allowed' : 'pointer', transition: '0.2s', opacity: (isOutOfStockInCart && !addedItems.has(selectedProduct.variant_id)) ? 0.5 : 1 }}>
                  {addedItems.has(selectedProduct.variant_id) ? "Go to Checkout" : "Buy Now"}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {toast && (<div style={{ position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', backgroundColor: toast.includes('⚠️') || toast.includes('❌') ? '#dc2626' : '#1e293b', color: 'white', padding: '12px 24px', borderRadius: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', zIndex: 3000, fontSize: '14px', fontWeight: '700', animation: 'fadeIn 0.3s' }}>{toast}</div>)}
      </div>
      <style jsx>{` @keyframes fadeIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } } `}</style>
    </>
  );
}