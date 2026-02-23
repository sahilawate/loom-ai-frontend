"use client";

import { useEffect, useState } from "react";
import { API } from "../../lib/api";
import Navbar from "../components/Navbar";

export default function StaffPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); 
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API}/orders/all`);
      const data = await res.json();
      setOrders(data);
    } catch (e) { console.error("Staff Load Error", e); }
  };

  // 🟢 CORE ACTION: Triggers Backend Status Update
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setLoadingAction(orderId);
    try {
      const response = await fetch(`${API}/orders/update`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, status: newStatus })
      });
      
      const textData = await response.text(); 
      try {
          const data = JSON.parse(textData); 
          if (!data.success) throw new Error(data.error);
          
          setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      } catch (e) {
          alert("Server Error: Check backend connection.");
      }
    } catch (error) {
      console.error("Failed to execute update:", error);
    } finally {
      setLoadingAction(null);
    }
  };

  // 🟢 AGENTIC DATA PARSERS (Kept for Insights)
  const getLoyaltyTier = (totalAmount: number) => {
    if (totalAmount >= 5000) return { name: "Platinum", emoji: "💎", color: "#6b21a8", bg: "#eff6ff", border: "#bfdbfe" };
    if (totalAmount >= 2000) return { name: "Gold", emoji: "🏅", color: "#b45309", bg: "#fffbeb", border: "#fef3c7" };
    return { name: "Silver", emoji: "🥈", color: "#334155", bg: "#f8fafc", border: "#e2e8f0" };
  };

  // 🟢 BUG FIX: Strict Deduplication to prevent SQL join cloning!
  const getValidItems = (items: any[]) => {
      if (!Array.isArray(items)) return [];
      
      // 1. Filter out empty/null items
      const valid = items.filter(i => i && i.name && i.name !== 'Item' && i.qty > 0);
      
      // 2. Remove duplicates caused by database cart joins
      const uniqueMap = new Map();
      valid.forEach(item => {
          const key = `${item.name}_${item.size || 'Universal'}`;
          if (!uniqueMap.has(key)) {
              uniqueMap.set(key, item);
          }
      });
      
      return Array.from(uniqueMap.values());
  };

  const inferIntent = (validItems: any[]) => {
    if (validItems.length === 0) return "General Apparel";
    
    const categories = new Set<string>();
    validItems.forEach(i => {
        const n = i.name.toLowerCase();
        if (n.includes("jean") || n.includes("denim")) categories.add("Denim");
        else if (n.includes("shirt") || n.includes("t-shirt") || n.includes("top")) categories.add("Casual Tops");
        else if (n.includes("blazer") || n.includes("suit") || n.includes("formal")) categories.add("Formal Wear");
        else if (n.includes("dress")) categories.add("Dresses");
        else if (n.includes("shoe") || n.includes("sneaker")) categories.add("Footwear");
        else categories.add(i.name.split(" ")[0]); 
    });

    return Array.from(categories).slice(0, 2).join(" & ") + " Enthusiast";
  };

  const analyzeOrderRisk = (totalAmount: number, itemsCount: number) => {
      let riskLevel = "Safe"; let urgency = "Normal";
      if (totalAmount > 10000) riskLevel = "Review - High Value";
      if (itemsCount > 4) urgency = "High - Batch Fulfillment";
      return { riskLevel, urgency };
  };

  return (
    <>
      <Navbar mode="staff" showBack />
      <div style={{ padding: '40px 20px', fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f0f4f8', minHeight: 'calc(100vh - 60px)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
              Operations Command Center
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748b', fontWeight: 'bold', backgroundColor: 'white', padding: '8px 16px', borderRadius: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
               <span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: '#10b981', borderRadius: '50%', animation: 'pulse 2s infinite' }}></span>
               AI Agent Active
            </div>
          </div>
          
          <div style={{ display: 'grid', gap: '30px' }}>
            {orders.map((order) => {
              const status = order.status?.toLowerCase() || 'pending';
              const isCancelled = status === 'cancelled';
              const validItems = getValidItems(order.items);
              const amount = parseFloat(order.total_amount) || 0;
              
              const tier = getLoyaltyTier(amount);
              const interests = inferIntent(validItems);
              const { riskLevel, urgency } = analyzeOrderRisk(amount, validItems.length);

              return (
                <div key={order.id} style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', overflow: 'hidden', animation: 'fadeIn 0.3s ease-out', border: '1px solid #e2e8f0' }}>
                  
                  <div style={{ display: 'flex', width: '100%', flexWrap: 'wrap' }}>
                    
                    {/* 🧠 LEFT: AI PROFILE & INSIGHTS */}
                    <div style={{ flex: '1', minWidth: '300px', padding: '25px', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '15px', backgroundColor: '#f8fafc' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                        <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                           U
                        </div>
                        <div>
                          <div style={{ fontWeight: '900', fontSize: '16px', color: '#0f172a' }}>Guest Session</div>
                          <div style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>{order.session_id.slice(0, 8).toUpperCase()}</div>
                        </div>
                      </div>

                      <div style={{ backgroundColor: tier.bg, padding: '12px', borderRadius: '8px', border: `1px solid ${tier.border}` }}>
                        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px', fontWeight: 'bold' }}>LOYALTY TIER</div>
                        <div style={{ fontWeight: '900', color: tier.color, fontSize: '15px' }}>{tier.emoji} {tier.name}</div>
                      </div>

                      <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px', fontWeight: 'bold' }}>AI INFERRED INTENT</div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#334155' }}>{interests}</div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px' }}>
                          <div style={{ flex: 1, backgroundColor: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold' }}>FRAUD RISK</div>
                            <div style={{ fontSize: '12px', fontWeight: '800', color: riskLevel.includes('High') ? '#ef4444' : '#10b981' }}>{riskLevel}</div>
                          </div>
                          <div style={{ flex: 1, backgroundColor: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold' }}>URGENCY</div>
                            <div style={{ fontSize: '12px', fontWeight: '800', color: urgency.includes('High') ? '#f59e0b' : '#3b82f6' }}>{urgency}</div>
                          </div>
                      </div>
                    </div>

                    {/* 🛒 RIGHT: ORDER & WORKFLOW */}
                    <div style={{ flex: '1.5', minWidth: '400px', padding: '25px', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h3 style={{ margin: 0, fontWeight: '900', fontSize: '20px', color: '#0f172a' }}>#{order.id.slice(0, 8).toUpperCase()}</h3>
                            <div style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '900', backgroundColor: isCancelled ? '#fee2e2' : '#f0fdf4', color: isCancelled ? '#dc2626' : '#15803d', border: isCancelled ? '1px solid #fca5a5' : '1px solid #86efac' }}>
                                {status.toUpperCase()}
                            </div>
                        </div>
                        <div style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a' }}>₹{order.total_amount}</div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, marginBottom: '20px' }}>
                        {validItems.length > 0 ? validItems.map((item: any, idx: number) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                            <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px' }}>
                                {item.name} {item.size && item.size !== 'Universal' && <span style={{ color: '#94a3b8', fontSize: '12px', marginLeft: '6px' }}>({item.size})</span>}
                            </div>
                            <div style={{ color: '#0f172a', fontSize: '13px', fontWeight: '900', backgroundColor: 'white', padding: '2px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>x{item.qty}</div>
                          </div>
                        )) : (
                          <div style={{ padding: '15px', textAlign: 'center', color: '#94a3b8', fontSize: '14px', fontStyle: 'italic', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                             Items hidden (Cart cleared post-purchase)
                          </div>
                        )}
                      </div>

                      {/* 🛠️ MANUAL STATUS ACTIONS */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                         {!isCancelled && (
                             <div style={{ display: 'flex', gap: '10px' }}>
                                {(status === 'pending' || status === 'processing') && (
                                    <button disabled={loadingAction === order.id} onClick={() => updateOrderStatus(order.id, 'packed')} style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: '#0f172a', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                                        {loadingAction === order.id ? 'Updating...' : '📦 Mark as Packed'}
                                    </button>
                                )}
                                {status === 'packed' && (
                                    <button disabled={loadingAction === order.id} onClick={() => updateOrderStatus(order.id, 'shipped')} style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: '#10b981', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', boxShadow: '0 4px 6px rgba(16,185,129,0.2)' }}>
                                        {loadingAction === order.id ? 'Updating...' : '🚚 Dispatch Order'}
                                    </button>
                                )}
                                {status === 'shipped' && (
                                    <button disabled={loadingAction === order.id} onClick={() => updateOrderStatus(order.id, 'delivered')} style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: '#3b82f6', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}>
                                        {loadingAction === order.id ? 'Updating...' : '🏠 Mark Delivered'}
                                    </button>
                                )}
                                {status === 'delivered' && (
                                    <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981', padding: '10px' }}>✅ Fulfillment Complete</span>
                                )}
                             </div>
                         )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {orders.length === 0 && (
              <div style={{ textAlign: 'center', padding: '100px', color: '#94a3b8', backgroundColor: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                <div style={{ fontSize: '40px', marginBottom: '15px' }}>📥</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>Inbox Zero</div>
                <div style={{ marginTop: '8px' }}>No active orders require operations.</div>
              </div>
            )}
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); } 70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </>
  );
}