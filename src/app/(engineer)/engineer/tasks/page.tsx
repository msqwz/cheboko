"use client";

import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { supabasePublic } from "@/lib/supabase";
import Link from "next/link";
import { Clock, MapPin, ChevronRight, Plus, AlertCircle } from "lucide-react";

export default function EngineerTasks() {
  const { data: session, status } = useSession();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"assigned" | "created">("assigned");

  const fetchTasks = async () => {
    if (!session?.user) return;
    setLoading(true);
    try {
      const { id } = session.user as any;
      const url = activeTab === "assigned" 
        ? `/api/tickets?engineerId=${id}&status=active`
        : `/api/tickets?onlyCreated=true&status=all`;
      const res = await fetch(url);
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
  }, [status, activeTab]);

  return (
    <div className="engineer-tasks page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Заявки</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            {activeTab === "assigned" ? "Активные задачи в работе" : "Созданные вами обращения"}
          </p>
        </div>
        <Link href="/engineer/tasks/new" className="btn-primary" style={{ padding: '10px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', background: 'var(--accent-primary)', color: '#fff', fontSize: '14px', fontWeight: 600 }}>
          <Plus size={18} /> Создать
        </Link>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '20px', 
        padding: '4px', 
        backgroundColor: 'var(--bg-secondary)', 
        borderRadius: '12px',
        border: '1px solid var(--border-color)'
      }}>
        <button 
          onClick={() => setActiveTab("assigned")}
          style={{ 
            flex: 1, 
            padding: '10px', 
            borderRadius: '8px', 
            border: 'none', 
            fontSize: '14px', 
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: activeTab === "assigned" ? 'var(--bg-primary)' : 'transparent',
            color: activeTab === "assigned" ? 'var(--text-primary)' : 'var(--text-muted)',
            boxShadow: activeTab === "assigned" ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          Задачи
        </button>
        <button 
          onClick={() => setActiveTab("created")}
          style={{ 
            flex: 1, 
            padding: '10px', 
            borderRadius: '8px', 
            border: 'none', 
            fontSize: '14px', 
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: activeTab === "created" ? 'var(--bg-primary)' : 'transparent',
            color: activeTab === "created" ? 'var(--text-primary)' : 'var(--text-muted)',
            boxShadow: activeTab === "created" ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          Мои заявки
        </button>
      </div>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Загрузка...</div>
      ) : tasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', backgroundColor: 'var(--bg-secondary)', borderRadius: '16px', border: '1px dashed var(--border-color)' }}>
          {activeTab === "assigned" ? "У вас пока нет активных задач." : "Вы еще не создавали заявок."}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {tasks.map(task => (
            <Link key={task.id} href={activeTab === "assigned" ? `/engineer/tasks/${task.id}` : `/tickets/${task.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ 
                padding: '16px', 
                borderRadius: '16px', 
                backgroundColor: 'var(--bg-secondary)', 
                border: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              className="task-card"
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--accent-primary)', letterSpacing: '0.5px' }}>#{task.ticketNumber.slice(-4)}</span>
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: 700,
                      padding: '4px 10px', 
                      borderRadius: '20px', 
                      backgroundColor: 'var(--bg-primary)', 
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)'
                    }}>{task.status}</span>
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 10px 0', color: 'var(--text-primary)' }}>{task.description.split('\n')[0].substring(0, 50)}...</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={14} /> <span>{task.location?.address?.split(',')[0]}</span>
                    </div>
                    {task.priority === 'HIGH' && (
                       <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--status-high)', fontWeight: 600 }}>
                         <AlertCircle size={14} /> Срочно
                       </div>
                    )}
                  </div>
                </div>
                <ChevronRight size={20} color="var(--text-muted)" style={{ marginLeft: '12px' }} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
