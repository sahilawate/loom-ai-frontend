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
      
      if (response.ok) {
          setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      } else {
          alert("Update failed. Check backend logs.");
      }
    } catch (error) {
      console.error("Failed to execute update:", error);
    } finally {
      setLoadingAction(null);
    }
  };

  // 🟢 FIXED: Dynamic Tier Logic (Matches threshold logic in Checkout)
  const getLoyaltyTier = (amountStr: string) => {
    const amount = parseFloat(amountStr) || 0;
    
    if (amount >= 5000) {
        return { name: "Gold", emoji: "🏅", color: "#eab308", bg: "#fefce8", border: "#fef08a" };
    } else if (amount >= 2000) {
        return { name: "Silver", emoji: "🥈", color: "#64748b", bg: "#f8fafc", border: "#e2e8f0" };
    } else {
        return { name: "Bronze", emoji: "🥉", color: "#cd7f32", bg: "#fff7ed", border: "#ffedd5" };
    }
  };

  // 🟢 BUG FIX: Strict Deduplication to prevent SQL join cloning
  const getValidItems = (items: any[]) => {
      if (!Array.isArray(items)) return [];
      
      const uniqueMap = new Map();
      items.filter(i => i && i.name && i.name !== 'Item' && i.qty > 0).forEach(item => {
          // Create a unique key per product and size
          const key = `${item.name}_${item.size || 'Universal'}`;
          if (!uniqueMap.has(key)) {
              uniqueMap.set(key, item);
          }
      });
      
      return Array.from(uniqueMap.values());
  };

  // 🟢 DYNAMIC INTENT: Inferred from ordered items
  const inferIntent = (validItems: any[]) => {
    if (validItems.length === 0) return "Browsing Enthusiast";
    
    const categories = new Set<string>();
    validItems.forEach(i => {
        const n = i.name.toLowerCase();
        if (n.includes("jean") || n.includes("denim")) categories.add("Denim");
        else if (n.includes("shirt") || n.includes("t-shirt") || n.includes("top")) categories.add("Casualwear");
        else if (n.includes("blazer") || n.includes("suit") || n.includes("formal")) categories.add("Formalwear");
        else if (n.includes("dress")) categories.add("Dresses");
        else if (n.includes("shoe") || n.includes("sneaker")) categories.add("Footwear");
        else categories.add("Apparel"); 
    });

    const list = Array.from(categories).slice(0, 2).join(" & ");
    return list ? `${list} Interest` : "General Interest";
  };

  return (
    <>
      <Navbar mode="staff" showBack />
      <div style={{ padding: '40px 20px', fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f0f4f8', minHeight: 'calc(100vh - 60px)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', margin: 0 }}>
              Staff Command Center
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#10b981', fontWeight: 'bold', backgroundColor: 'white', padding: '8px 16px', borderRadius: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
               <span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: '#10b981', borderRadius: '50%', animation: 'pulse 2s infinite' }}></span>
               AI Agent Monitoring
            </div>
          </div>
          
          <div style={{ display: 'grid', gap: '30px' }}>
            {orders.map((order) => {
              const status = order.status?.toLowerCase() || 'pending';
              const isCancelled = status === 'cancelled';
              const validItems = getValidItems(order.items);
              
              // Apply dynamic tier and intent
              const tier = getLoyaltyTier(order.total_amount);
              const interests = inferIntent(validItems);

              return (
                <div key={order.id} style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  
                  <div style={{ display: 'flex', width: '100%', flexWrap: 'wrap' }}>
                    
                    {/* LEFT: AI PROFILE INSIGHTS */}
                    <div style={{ flex: '1', minWidth: '300px', padding: '25px', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '15px', backgroundColor: '#f8fafc' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>U</div>
                        <div>
                          <div style={{ fontWeight: '800', fontSize: '15px', color: '#0f172a' }}>Guest Session</div>
                          <div style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>{order.session_id.slice(0, 8).toUpperCase()}</div>
                        </div>
                      </div>

                      <div style={{ backgroundColor: tier.bg, padding: '12px', borderRadius: '10px', border: `1px solid ${tier.border}` }}>
                        <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '2px', fontWeight: '900', textTransform: 'uppercase' }}>Loyalty Tier</div>
                        <div style={{ fontWeight: '900', color: tier.color, fontSize: '16px' }}>{tier.emoji} {tier.name}</div>
                      </div>

                      <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '2px', fontWeight: '900', textTransform: 'uppercase' }}>AI Profile</div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#334155' }}>{interests}</div>
                      </div>
                    </div>

                    {/* RIGHT: ORDER CONTENT */}
                    <div style={{ flex: '1.8', minWidth: '400px', padding: '25px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h3 style={{ margin: 0, fontWeight: '900', fontSize: '18px' }}>#{order.id.slice(0, 8).toUpperCase()}</h3>
                            <div style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '900', backgroundColor: isCancelled ? '#fee2e2' : '#f0fdf4', color: isCancelled ? '#dc2626' : '#15803d' }}>
                                {status.toUpperCase()}
                            </div>
                        </div>
                        <div style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a' }}>₹{order.total_amount}</div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '25px' }}>
                        {validItems.map((item: any, idx: number) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                            <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px' }}>
                                {item.name} {item.size && item.size !== 'Universal' && <span style={{ color: '#64748b', fontSize: '12px', marginLeft: '6px' }}>({item.size})</span>}
                            </div>
                            <div style={{ color: '#0f172a', fontSize: '13px', fontWeight: '900' }}>x{item.qty}</div>
                          </div>
                        ))}
                      </div>

                      {/* ACTIONS */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                         {!isCancelled && (
                             <div style={{ display: 'flex', gap: '10px' }}>
                                {status === 'processing' && (
                                    <button disabled={!!loadingAction} onClick={() => updateOrderStatus(order.id, 'packed')} style={btnStyle}>📦 Mark Packed</button>
                                )}
                                {status === 'packed' && (
                                    <button disabled={!!loadingAction} onClick={() => updateOrderStatus(order.id, 'shipped')} style={{ ...btnStyle, backgroundColor: '#10b981' }}>🚚 Dispatch</button>
                                )}
                                {status === 'shipped' && (
                                    <button disabled={!!loadingAction} onClick={() => updateOrderStatus(order.id, 'delivered')} style={{ ...btnStyle, backgroundColor: '#3b82f6' }}>🏠 Mark Delivered</button>
                                )}
                                {status === 'delivered' && (
                                    <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#10b981' }}>✅ Fully Fulfilled</span>
                                )}
                             </div>
                         )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); } 70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
      `}</style>
    </>
  );
}

const btnStyle = {
    padding: '10px 20px',
    borderRadius: '10px',
    backgroundColor: '#0f172a',
    color: 'white',
    border: 'none',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '13px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};