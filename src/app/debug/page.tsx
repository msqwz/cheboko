"use client";

import { useEffect, useState } from "react";

export default function DebugPage() {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const testSupabase = async () => {
    addLog("Testing Supabase connection...");
    try {
      const res = await fetch("/api/debug/db");
      const data = await res.json();
      addLog(`Response: ${JSON.stringify(data)}`);
    } catch (err: any) {
      addLog(`Error: ${err.message}`);
    }
  };

  const createUser = async () => {
    addLog("Creating test user...");
    try {
      const res = await fetch("/api/debug/create-user", { method: "POST" });
      const data = await res.json();
      addLog(`Response: ${JSON.stringify(data)}`);
    } catch (err: any) {
      addLog(`Error: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      <h1>Debug</h1>
      <button onClick={testSupabase} style={{ marginRight: 10, padding: "8px 16px" }}>
        Test DB
      </button>
      <button onClick={createUser} style={{ padding: "8px 16px" }}>
        Create User
      </button>
      <pre style={{ marginTop: 20, background: "#f5f5f5", padding: 10 }}>
        {logs.join("\n")}
      </pre>
    </div>
  );
}
