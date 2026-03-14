"use client";

import pageStyles from "@/app/(point-manager)/point/page.module.css";
import clsx from "clsx";
import { Bell, CheckCircle2, AlertTriangle, Coffee, Trash2, Loader2, Clock } from "lucide-react";
import { useState, useEffect } from "react";

type Notification = {
  id: string;
  type: 'alert' | 'success' | 'info';
  title: string;
  description: string | null;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/point/notifications");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Автообновление каждые 30 секунд
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (notificationId?: string) => {
    setIsUpdating(true);
    try {
      await fetch("/api/point/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notificationId,
          markAllRead: !notificationId,
        }),
      });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteNotification = async (id: string) => {
    if (!confirm("Удалить это уведомление?")) return;
    
    try {
      const res = await fetch(`/api/point/notifications?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete");
      }
      fetchNotifications();
    } catch (err: any) {
      alert("Ошибка: " + err.message);
    }

  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'alert': return <AlertTriangle size={20} color="var(--status-high)" />;
      case 'success': return <CheckCircle2 size={20} color="var(--status-success)" />;
      default: return <Coffee size={20} color="var(--accent-primary)" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Только что";
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays < 7) return `${diffDays} дн назад`;
    return date.toLocaleDateString("ru-RU");
  };
  return (
    <div className={clsx("page-container", "animate-fade-in")}>
      <header className={pageStyles.header}>
        <div>
          <h1 className={pageStyles.title}>
            Уведомления
            {unreadCount > 0 && (
              <span style={{
                marginLeft: 8,
                padding: "2px 8px",
                background: "var(--accent-primary)",
                color: "#fff",
                borderRadius: "var(--radius-full)",
                fontSize: 12,
                fontWeight: 600,
              }}>
                {unreadCount}
              </span>
            )}
          </h1>
          <p className={pageStyles.subtitle}>События, статусы заявок и системные сообщения</p>
        </div>
        <div className={pageStyles.headerActions}>
          <button
            className={pageStyles.btnSecondary}
            onClick={() => markAsRead()}
            disabled={isUpdating}
          >
            <CheckCircle2 size={18} /> {isUpdating ? "..." : "Отметить все как прочитанные"}
          </button>
        </div>
      </header>

      <div className={pageStyles.card} style={{ maxWidth: 800 }}>
        <div style={{ padding: "24px" }}>
          {isLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
              <Loader2 size={24} className="animate-spin" color="var(--text-muted)" />
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
              Уведомлений нет
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {notifications.map(n => (
                <div
                  key={n.id}
                  style={{
                    display: "flex",
                    gap: 16,
                    padding: "16px",
                    borderRadius: "var(--radius-lg)",
                    background: n.isRead ? "var(--bg-secondary)" : "var(--bg-hover)",
                    border: "1px solid var(--border-color)",
                    position: "relative",
                    transition: "all 0.2s ease",
                    boxShadow: n.isRead ? "none" : "0 4px 12px rgba(0,0,0,0.05)"
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: n.isRead ? 'var(--bg-primary)' : 'var(--bg-secondary)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    border: '1px solid var(--border-color)'
                  }}>
                    {getIcon(n.type)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2, lineHeight: 1.2 }}>{n.title}</h3>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                       <span style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                         <Clock size={12} /> {formatTimeAgo(n.createdAt)}
                       </span>
                    </div>
                    {n.description && (
                      <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.5, wordBreak: "break-word" }}>
                        {n.description}
                      </p>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
                    {!n.isRead && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        style={{ background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: 8, cursor: "pointer", color: "var(--accent-primary)", padding: 6, display: "flex" }}
                        title="Отметить как прочитанное"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(n.id)}
                      style={{ background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: 8, cursor: "pointer", color: "var(--text-muted)", padding: 6, display: "flex" }}
                      title="Удалить"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
