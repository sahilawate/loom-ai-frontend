"use client";

import { useEffect, useState } from "react";
import { get } from "../../lib/api";

export default function AgentTimeline({ sessionId }: any) {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!sessionId) return;
    get(`/agents/${sessionId}`).then(setEvents);
  }, [sessionId]);

  return (
    <div className="timeline">
      <h4>Agent Activity</h4>

      {events.map((e, i) => (
        <div key={i} className="agent">
          <div className="agent-dot" />
          <p>
            <strong>{e.agent_name}</strong>: {e.action}
          </p>
        </div>
      ))}
    </div>
  );
}
