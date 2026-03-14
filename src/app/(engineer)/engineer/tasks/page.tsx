"use client";

import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { supabasePublic } from "@/lib/supabase";
import Link from "next/link";
import { Clock, MapPin, ChevronRight } from "lucide-react";

export default function EngineerTasks() {
  const { data: session, status } = useSession();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    if (!session?.user) return;
    setLoading(true);
    try {
      const { id } = session.user as any;
      const res = await fetch(`/api/tickets?engineerId=${id}&status=active`);
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
    if (status === "authenticated") fetchTasks();
  }, [status]);

  if (loading) return <div>Загрузка ваших задач...</div>;

  return (
    <div className="engineer-tasks">
      <h2 style={{ marginBottom: '16px', fontSize: '20px' }}>Ваши задачи ({tasks.length})</h2>
      
      {tasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          У вас пока нет активных задач.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {tasks.map(task => (
            <Link key={task.id} href={`/engineer/tasks/${task.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ 
                padding: '16px', 
                borderRadius: '12px', 
                backgroundColor: 'var(--bg-secondary)', 
                border: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '14px' }}>#{task.ticketNumber.slice(-4)}</span>
                    <span style={{ 
                      fontSize: '11px', 
                      padding: '2px 8px', 
                      borderRadius: '10px', 
                      backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                      color: 'var(--accent-primary)' 
                    }}>{task.status}</span>
                  </div>
                  <h3 style={{ fontSize: '16px', margin: '0 0 8px 0' }}>{task.description.split('\n')[0].substring(0, 40)}...</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <MapPin size={14} /> {task.location?.address}
                  </div>
                </div>
                <ChevronRight size={20} color="var(--text-muted)" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
