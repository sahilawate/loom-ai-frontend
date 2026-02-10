"use client";

import { useEffect, useState } from "react";
import { API } from "../../lib/api";
import Navbar from "../components/Navbar";

export default function AgentsPage() {
  const [events, setEvents] = useState<any[]>([]);

  // Poll for Events
  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const res = await fetch(`${API}/chat/timeline`);
        const data = await res.json();
        setEvents(data);
      } catch (e) { console.error("Timeline Error", e); }
    };

    fetchTimeline();
    const interval = setInterval(fetchTimeline, 3000); // Live updates every 3s
    return () => clearInterval(interval);
  }, []);

  // Helper for Agent Colors based on Flowchart
  const getAgentColor = (name: string) => {
    switch(name) {
      case 'Customer': return '#64748b'; // Grey
      case 'AI Conversational Sales Agent': return '#3b82f6'; // Blue
      case 'Recommendation Agent': return '#8b5cf6'; // Purple
      case 'Inventory Agent': return '#f59e0b'; // Amber
      case 'Loyalty & Offers Agent': return '#ec4899'; // Pink
      case 'Payment Agent': return '#10b981'; // Emerald
      case 'Fulfillment Agent': return '#06b6d4'; // Cyan
      case 'Post-Purchase Support Agent': return '#6366f1'; // Indigo
      default: return '#94a3b8';
    }
  };

  return (
    <>
      <Navbar mode="agent" showBack />
      <div style={{ padding: '30px', fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f1f5f9', minHeight: 'calc(100vh - 60px)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', marginBottom: '10px' }}>
            🤖 Live Agent Flow
          </h1>
          <p style={{ marginBottom: '30px', color: '#64748b' }}>Real-time execution of the multi-agent system.</p>

          <div style={{ position: 'relative', paddingLeft: '20px', borderLeft: '3px solid #cbd5e1' }}>
            {events.map((ev, i) => {
              let meta = ev.metadata;
              if (typeof meta === 'string') {
                 try { meta = JSON.parse(meta); } catch(e){ meta = {message: ''}; }
              }
              const color = getAgentColor(ev.agent_name);

              return (
                <div key={i} style={{ marginBottom: '25px', position: 'relative' }}>
                  {/* Dot */}
                  <div style={{ 
                    position: 'absolute', left: '-29px', top: '5px', 
                    width: '16px', height: '16px', borderRadius: '50%', 
                    backgroundColor: color, border: '3px solid #f1f5f9' 
                  }}></div>

                  {/* Card */}
                  <div style={{ 
                    backgroundColor: 'white', padding: '15px 20px', borderRadius: '12px', 
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', borderLeft: `5px solid ${color}` 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontWeight: 'bold', color, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {ev.agent_name}
                      </span>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {new Date(ev.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <div style={{ fontSize: '16px', color: '#334155' }}>
                       {meta.message || "Action Executed"}
                    </div>
                    <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '5px' }}>
                      Session: {ev.session_id.slice(0,6)}...
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </>
  );
}