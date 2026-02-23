"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { API } from "../../lib/api";
import { getSession } from "../../lib/session";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  // 🟢 BULLETPROOF LIVE POLLING
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    getSession("mobile").then((sid) => {
      const fetchMyOrders = async () => {
        try {
          const res = await fetch(`${API}/orders/all?sessionId=${sid}`);
          if (!res.ok) throw new Error("Server returned an error");
          
          const data = await res.json();
          setOrders(data);
          setIsOffline(false); // We are connected!
        } catch (e) {
          console.warn("Backend is temporarily unreachable. Retrying silently...");
          setIsOffline(true);
        } finally {
          setLoading(false);
        }
      };

      fetchMyOrders();
      interval = setInterval(fetchMyOrders, 3000); 
    });

    return () => clearInterval(interval);
  }, []);

  const getProgressStep = (status: string) => {
    const s = status?.toLowerCase() || 'pending';
    if (s === 'cancelled') return -1;
    if (s === 'delivered') return 4;
    if (s === 'shipped') return 3;
    if (s === 'packed') return 2;
    return 1; 
  };

  const aggregateItems = (items: any[]) => {
      if (!items || !Array.isArray(items)) return [];
      
      const grouped = items.reduce((acc: any, currentItem: any) => {
          if (!currentItem || !currentItem.name || currentItem.name === 'Item') return acc;
          const sizeKey = currentItem.size || 'Universal';
          const uniqueKey = `${currentItem.name}_${sizeKey}`;

          if (!acc[uniqueKey]) {
              acc[uniqueKey] = { ...currentItem, qty: currentItem.qty || 1, size: sizeKey };
          } else {
              acc[uniqueKey].qty += (currentItem.qty || 1);
          }
          return acc;
      }, {});

      return Object.values(grouped);
  };

  return (
    <>
      <Navbar mode="mobile" showBack />
      <div style={{ padding: '20px', fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 60px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', margin: 0 }}>My Orders</h2>
            {isOffline && <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 'bold', backgroundColor: '#fef2f2', padding: '4px 10px', borderRadius: '12px' }}>Connecting...</span>}
        </div>
        
        {loading ? (
           <div style={{ textAlign: 'center', marginTop: '50px', color: '#64748b', fontWeight: 'bold' }}>Loading timeline...</div>
        ) : orders.length === 0 ? (
           <div style={{ textAlign: 'center', marginTop: '80px', color: '#94a3b8' }}>
              <div style={{ fontSize: '50px', marginBottom: '15px' }}>🛍️</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>No orders yet</div>
              <p>Your future purchases will appear here.</p>
           </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {orders.map((order) => {
              const step = getProgressStep(order.status);
              const consolidatedItems = aggregateItems(order.items);
              
              return (
                <div key={order.id} style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                   
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                      <div>
                         <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>ORDER ID</div>
                         <div style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a' }}>#{order.id.slice(0, 8).toUpperCase()}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                         <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>TOTAL</div>
                         <div style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a' }}>₹{order.total_amount}</div>
                      </div>
                   </div>

                   {/* 🟢 BEAUTIFUL IMAGE + ITEM LIST */}
                   <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px', marginBottom: '25px', border: '1px solid #f1f5f9' }}>
                      {consolidatedItems.map((item: any, idx: number) => (
                        <div key={idx} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '15px', 
                            marginBottom: idx !== consolidatedItems.length - 1 ? '15px' : '0',
                            paddingBottom: idx !== consolidatedItems.length - 1 ? '15px' : '0',
                            borderBottom: idx !== consolidatedItems.length - 1 ? '1px solid #e2e8f0' : 'none'
                        }}>
                           
                           <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: '#e2e8f0', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {item.image || item.image_url ? (
                                 <img src={item.image || item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                 <span style={{ fontSize: '20px' }}>👕</span>
                              )}
                           </div>
                           
                           <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                               <div style={{ display: 'flex', flexDirection: 'column' }}>
                                   <span style={{ fontWeight: '800', color: '#1e293b', fontSize: '15px' }}>{item.name}</span>
                                   {item.size && item.size !== 'Universal' && (
                                       <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 'bold', marginTop: '2px' }}>Size: {item.size}</span>
                                   )}
                               </div>
                               <div style={{ color: '#0f172a', fontSize: '13px', fontWeight: '900', backgroundColor: 'white', padding: '4px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                                   Qty: {item.qty}
                               </div>
                           </div>

                        </div>
                      ))}
                   </div>

                   {/* 🟢 AMAZON-STYLE LIVE TIMELINE */}
                   {step === -1 ? (
                       <div style={{ padding: '15px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', border: '1px dashed #fca5a5' }}>
                           ❌ This order was cancelled.
                       </div>
                   ) : (
                       <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginTop: '10px' }}>
                          <div style={{ position: 'absolute', top: '15px', left: '10%', right: '10%', height: '4px', backgroundColor: '#e2e8f0', zIndex: 0, borderRadius: '2px' }}>
                              <div style={{ height: '100%', backgroundColor: '#10b981', borderRadius: '2px', transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)', width: step === 1 ? '0%' : step === 2 ? '33%' : step === 3 ? '66%' : '100%' }} />
                          </div>

                          {[
                            { label: 'Placed', icon: '📝', nodeStep: 1 },
                            { label: 'Packed', icon: '📦', nodeStep: 2 },
                            { label: 'Shipped', icon: '🚚', nodeStep: 3 },
                            { label: 'Delivered', icon: '🏠', nodeStep: 4 }
                          ].map((s) => (
                              <div key={s.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, width: '60px' }}>
                                 <div style={{ 
                                     width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
                                     backgroundColor: step >= s.nodeStep ? '#10b981' : 'white',
                                     border: step >= s.nodeStep ? '2px solid #10b981' : '2px solid #cbd5e1',
                                     boxShadow: step >= s.nodeStep ? '0 0 10px rgba(16, 185, 129, 0.4)' : 'none',
                                     transition: 'all 0.4s ease'
                                  }}>
                                     {step >= s.nodeStep ? <span style={{ color: 'white', fontSize: '14px' }}>✓</span> : s.icon}
                                 </div>
                                 <div style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '8px', color: step >= s.nodeStep ? '#0f172a' : '#94a3b8' }}>
                                     {s.label}
                                 </div>
                              </div>
                          ))}
                       </div>
                   )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}