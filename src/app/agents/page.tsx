"use client";

import { useEffect, useState } from "react";
import { API } from "../../lib/api";
import Navbar from "../components/Navbar";

export default function AgentsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Poll for Events
  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const res = await fetch(`${API}/chat/timeline`);
        const data = await res.json();
        setEvents(data);
      } catch (e) { 
        console.error("Timeline Error", e); 
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
    const interval = setInterval(fetchTimeline, 3000); // Live updates every 3s
    return () => clearInterval(interval);
  }, []);

  // 🟢 Helper: Dynamic Colors based on Flowchart
  const getAgentColor = (name: string) => {
    switch(name) {
      case 'Customer': return '#64748b'; // Grey
      case 'AI Conversational Sales Agent': return '#3b82f6'; // Blue
      case 'Recommendation Agent': return '#8b5cf6'; // Purple
      case 'Inventory Agent': return '#f59e0b'; // Amber
      case 'Loyalty & Offers Agent': return '#ec4899'; // Pink
      case 'Payment Agent': return '#10b981'; // Emerald
      case 'Fulfillment Agent': return '#06b6d4'; // Cyan
      case 'Operations Agent': return '#0f172a'; // Dark Navy (Staff)
      case 'Post-Purchase Support Agent': return '#25d366'; // WhatsApp Green
      default: return '#94a3b8';
    }
  };

  // 🟢 Helper: Dynamic Icons for each Agent Role
  const getAgentIcon = (name: string) => {
    switch(name) {
      case 'Customer': return '👤';
      case 'AI Conversational Sales Agent': return '💬';
      case 'Recommendation Agent': return '✨';
      case 'Inventory Agent': return '📦';
      case 'Loyalty & Offers Agent': return '🎁';
      case 'Payment Agent': return '💳';
      case 'Fulfillment Agent': return '🏭';
      case 'Operations Agent': return '⚙️';
      case 'Post-Purchase Support Agent': return '📱';
      default: return '🤖';
    }
  };

  return (
    <>
      <Navbar mode="agent" showBack />
      <div style={{ padding: '40px 20px', fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 60px)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
             <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
               Live Agent Flow
             </h1>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#10b981', fontWeight: 'bold', backgroundColor: '#ecfdf5', padding: '6px 12px', borderRadius: '20px', border: '1px solid #a7f3d0' }}>
               <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%', animation: 'pulse 2s infinite' }}></span>
               System Online
             </div>
          </div>
          
          <p style={{ marginBottom: '40px', color: '#64748b', fontSize: '15px' }}>Real-time execution logs of the multi-agent neural network.</p>

          {loading ? (
             <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8', fontWeight: 'bold' }}>Connecting to Agent Network...</div>
          ) : events.length === 0 ? (
             <div style={{ textAlign: 'center', padding: '50px', backgroundColor: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>📡</div>
                <div style={{ fontWeight: 'bold', color: '#0f172a' }}>Waiting for signals</div>
                <div style={{ color: '#64748b', fontSize: '14px', marginTop: '5px' }}>No agent activity recorded yet.</div>
             </div>
          ) : (
            <div style={{ position: 'relative', paddingLeft: '24px', borderLeft: '3px solid #e2e8f0', marginLeft: '10px' }}>
              {events.map((ev, i) => {
                let meta = ev.metadata;
                if (typeof meta === 'string') {
                   try { meta = JSON.parse(meta); } catch(e){ meta = {message: ''}; }
                }
                const color = getAgentColor(ev.agent_name);
                const icon = getAgentIcon(ev.agent_name);

                return (
                  <div key={i} style={{ marginBottom: '30px', position: 'relative', animation: 'fadeIn 0.4s ease-out' }}>
                    
                    {/* 🟢 Floating Timeline Node */}
                    <div style={{ 
                      position: 'absolute', left: '-42px', top: '0px', 
                      width: '32px', height: '32px', borderRadius: '50%', 
                      backgroundColor: 'white', border: `3px solid ${color}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', zIndex: 2
                    }}>
                        {icon}
                    </div>

                    {/* 🟢 Event Card */}
                    <div style={{ 
                      backgroundColor: 'white', padding: '20px', borderRadius: '16px', 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9',
                      borderTop: `4px solid ${color}`
                    }}>
                      
                      {/* Header: Agent Name & Timestamp */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: '900', color: color, fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              {ev.agent_name}
                            </span>
                            {/* 🟢 System Action Badge */}
                            {ev.action && (
                                <span style={{ display: 'inline-block', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '6px', marginTop: '6px', width: 'fit-content', border: '1px solid #e2e8f0' }}>
                                    ⚙️ {ev.action}
                                </span>
                            )}
                        </div>
                        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>
                          {new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>

                      {/* Body: Agent Message */}
                      <div style={{ fontSize: '15px', color: '#1e293b', lineHeight: '1.5', fontWeight: '500', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', borderLeft: `3px solid ${color}40` }}>
                         {meta.message || "Action Executed"}
                      </div>

                      {/* Footer: Extra Metadata & Session ID */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', paddingTop: '12px', borderTop: '1px dashed #e2e8f0' }}>
                         <div style={{ display: 'flex', gap: '8px' }}>
                             {meta.orderId && (
                                 <span style={{ fontSize: '11px', backgroundColor: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>Order: #{meta.orderId.slice(0,8)}</span>
                             )}
                             {meta.status && (
                                 <span style={{ fontSize: '11px', backgroundColor: '#fdf4ff', color: '#db2777', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>Status: {meta.status}</span>
                             )}
                         </div>
                         <div style={{ fontSize: '11px', color: '#cbd5e1', fontFamily: 'monospace', fontWeight: 'bold' }}>
                           Session: {ev.session_id.slice(0,8).toUpperCase()}
                         </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
      <style jsx>{`
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); } 70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </>
  );
}