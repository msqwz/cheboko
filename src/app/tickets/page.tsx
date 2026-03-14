"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Plus, Search, MoreVertical, Eye, Trash2, CheckCircle, XCircle } from "lucide-react";
import styles from "./tickets.module.css";
import pageStyles from "@/app/page.module.css";
import clsx from "clsx";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "CREATED":
      return <span className={clsx(pageStyles.badge, pageStyles.created)}><div className={pageStyles.dot} /> Создана</span>;
    case "OPENED":
      return <span className={clsx(pageStyles.badge, pageStyles.inWork)}><div className={pageStyles.dot} /> Открыта</span>;
    case "ASSIGNED":
      return <span className={clsx(pageStyles.badge, pageStyles.enroute)}><div className={pageStyles.dot} /> Назначен</span>;
    case "ENROUTE":
      return <span className={clsx(pageStyles.badge, pageStyles.enroute)}><div className={pageStyles.dot} /> В пути</span>;
    case "IN_WORK":
      return <span className={clsx(pageStyles.badge, pageStyles.inWork)}><div className={pageStyles.dot} /> В работе</span>;
    case "ON_HOLD":
      return <span className={clsx(pageStyles.badge, pageStyles.hold)}><div className={pageStyles.dot} /> Пауза</span>;
    case "REJECTED":
      return <span className={clsx(pageStyles.badge, pageStyles.hold)}><div className={pageStyles.dot} style={{ backgroundColor: 'var(--status-high)' }} /> Отклонена</span>;
    case "COMPLETED":
      return <span className={clsx(pageStyles.badge, pageStyles.completed)}><div className={pageStyles.dot} /> Выполнена</span>;
    case "CANCELED":
      return <span className={clsx(pageStyles.badge, pageStyles.hold)}><div className={pageStyles.dot} /> Отменена</span>;
    default:
      return <span className={pageStyles.badge}>{status}</span>;
  }
};

const getPriorityClass = (priority: string | null) => {
  switch (priority) {
    case "HIGH": return pageStyles.priorityHigh;
    case "MEDIUM": return pageStyles.priorityMed;
    case "LOW": return pageStyles.priorityLow;
    default: return "";
  }
};

const getPriorityText = (priority: string | null) => {
  switch (priority) {
    case "HIGH": return "Высокий";
    case "MEDIUM": return "Средний";
    case "LOW": return "Низкий";
    default: return "—";
  }
};

export default function TicketsPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const userRole = (session?.user as any)?.role;
  
  const [activeTab, setActiveTab] = useState("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleDeleteTicket = async (ticketId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Удалить эту заявку?")) return;
    
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setTickets(tickets.filter(t => t.id !== ticketId));
    } catch (err: any) {
      alert("Ошибка: " + err.message);
    }
    setOpenMenuId(null);
  };

  const handleQuickComplete = async (ticketId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      if (!res.ok) throw new Error("Failed to complete");
      setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: "COMPLETED" } : t));
    } catch (err: any) {
      alert("Ошибка: " + err.message);
    }
    setOpenMenuId(null);
  };

  const handleQuickCancel = async (ticketId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELED" }),
      });
      if (!res.ok) throw new Error("Failed to cancel");
      setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: "CANCELED" } : t));
    } catch (err: any) {
      alert("Ошибка: " + err.message);
    }
    setOpenMenuId(null);
  };

  useEffect(() => {
    const fetchTickets = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('status', statusFilter !== 'all' ? statusFilter : activeTab);
        if (priorityFilter !== 'all') params.append('priority', priorityFilter);
        if (searchQuery) params.append('search', searchQuery);
        if (userRole === 'CLIENT_MANAGER') {
          params.append('creatorId', userId || '');
        }

        const res = await fetch(`/api/tickets?${params.toString()}`);
        const data = await res.json();
        setTickets(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch tickets:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets();

    // Realtime subscription
    const { supabase } = require("@/lib/supabase");
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Ticket' },
        () => {
          fetchTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab, statusFilter, priorityFilter, searchQuery, userId, userRole]);


  const handleExportCSV = () => {
    if (tickets.length === 0) return;
    
    // CSV Header
    const headers = ["Номер", "Описание", "Оборудование", "Локация", "Статус", "Приоритет", "Инженер", "Дата создания"];
    
    // CSV Data
    const rows = tickets.map(t => [
      `"${t.ticketNumber.slice(-4)}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      `"${(t.equipment?.model || "—").replace(/"/g, '""')}"`,
      `"${(t.location?.address || "—").replace(/"/g, '""')}"`,
      `"${t.status}"`,
      `"${t.priority}"`,
      `"${(t.engineer?.name || "—").replace(/"/g, '""')}"`,
      `"${new Date(t.createdAt).toLocaleDateString("ru-RU")}"`
    ]);

    
    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `tickets_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={clsx("page-container", "animate-fade-in")}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={pageStyles.title}>Управление заявками</h1>
          <p className={pageStyles.subtitle}>Полный список обращений на ремонт и ТО</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={handleExportCSV} className={pageStyles.btnSecondary}>
            Экспорт CSV
          </button>
          <Link href="/tickets/new" className={pageStyles.btnPrimary}>
            <Plus size={18} /> Создать заявку
          </Link>
        </div>
      </header>


      {/* Блок фильтров */}
      <div className={styles.filtersContainer}>
        <div className={styles.filterGroup} style={{ flex: 2 }}>
          <label className={styles.filterLabel}>Поиск</label>
          <div style={{ position: "relative" }}>
            <Search size={16} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input 
              type="text" 
              placeholder="Поиск по номеру, клиенту или инженеру..." 
              className={styles.input} 
              style={{ paddingLeft: 36 }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Статус</label>
          <select 
            className={styles.select}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Все (по вкладке)</option>
            <option value="CREATED">Создана</option>
            <option value="OPENED">Открыта</option>
            <option value="ASSIGNED">Назначен</option>
            <option value="ENROUTE">В пути</option>
            <option value="IN_WORK">В работе</option>
            <option value="ON_HOLD">Пауза</option>
            <option value="COMPLETED">Выполнена</option>
            <option value="CANCELED">Отменена</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Приоритет</label>
          <select 
            className={styles.select}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="all">Все приоритеты</option>
            <option value="HIGH">Высокий</option>
            <option value="MEDIUM">Средний</option>
            <option value="LOW">Низкий</option>
          </select>
        </div>
      </div>

      <div className={styles.tabsContainer}>
        <button 
          className={clsx(styles.tab, activeTab === "active" && styles.tabActive)}
          onClick={() => setActiveTab("active")}
        >
          Активные {activeTab === 'active' ? `(${tickets.length})` : ''}
        </button>
        <button 
          className={clsx(styles.tab, activeTab === "history" && styles.tabActive)}
          onClick={() => setActiveTab("history")}
        >
          История {activeTab === 'history' ? `(${tickets.length})` : ''}
        </button>
      </div>

      <div className={clsx(pageStyles.card, styles.ticketsWrapper)}>
        {/* Desktop Table */}
        <div className={clsx(pageStyles.tableContainer, styles.desktopOnly)}>
          <table className={pageStyles.table}>
            <thead>
              <tr>
                <th>№</th>
                <th>Проблема & Оборудование</th>
                <th>Клиент (Точка)</th>
                <th>Статус</th>
                <th>Приоритет</th>
                <th>Инженер</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "40px" }}>Загрузка...</td>
                </tr>
              ) : tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td><Link href={`/tickets/${ticket.id}`} className={pageStyles.idLink}>#{ticket.ticketNumber.slice(-4)}</Link></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{ticket.description.split('\n')[0].substring(0, 40)}{ticket.description.length > 40 ? '...' : ''}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      {ticket.equipment?.model || "Общее"} &middot; {new Date(ticket.createdAt).toLocaleDateString("ru-RU", { day: '2-digit', month: 'short' })}
                      {ticket.attachments && ticket.attachments.length > 0 && ` • 📷 ${ticket.attachments.length}`}
                    </div>
                  </td>
                  <td>{ticket.location?.legalName || ticket.location?.address}</td>
                  <td>{getStatusBadge(ticket.status)}</td>
                  <td className={getPriorityClass(ticket.priority)}>{getPriorityText(ticket.priority)}</td>
                  <td style={{ color: !ticket.engineer ? 'var(--text-muted)' : 'inherit', fontStyle: !ticket.engineer ? 'italic' : 'normal' }}>
                    {ticket.engineer?.name || "—"}
                  </td>
                  <td className={styles.actionWrapper}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === ticket.id ? null : ticket.id);
                      }}
                      className={styles.actionBtn}
                    >
                      <MoreVertical size={18} />
                    </button>
                    
                    {openMenuId === ticket.id && (
                      <div className={styles.dropdownMenu} onClick={(e) => e.stopPropagation()}>
                        <Link href={`/tickets/${ticket.id}`} className={styles.dropdownItem}>
                          <Eye size={16} /> Просмотр
                        </Link>
                        
                        <button
                          className={clsx(styles.dropdownItem, styles.successItem)}
                          onClick={(e) => {
                            if (ticket.status !== "COMPLETED") handleQuickComplete(ticket.id, e);
                          }}
                        >
                          <CheckCircle size={16} /> Завершить
                        </button>

                        {(userRole === 'ADMIN' || userRole === 'REGIONAL_MANAGER' || userRole === 'OPERATOR' || (userRole && userRole.startsWith('CLIENT_'))) && (
                          <button
                            className={clsx(styles.dropdownItem, styles.dangerItem)}
                            onClick={(e) => {
                              if (ticket.status !== "CANCELED" && ticket.status !== "COMPLETED") handleQuickCancel(ticket.id, e);
                            }}
                          >
                            <XCircle size={16} /> Отменить
                          </button>
                        )}
                        
                        {(userRole === 'ADMIN' || userRole === 'REGIONAL_MANAGER') && (
                          <button
                            className={clsx(styles.dropdownItem, styles.dangerItem)}
                            onClick={(e) => handleDeleteTicket(ticket.id, e)}
                          >
                            <Trash2 size={16} /> Удалить
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!isLoading && tickets.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    Заявок в этой категории пока нет.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className={styles.mobileOnly}>
          {isLoading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Загрузка...</div>
          ) : tickets.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Заявок в этой категории пока нет.</div>
          ) : (
            tickets.map((ticket) => (
              <div key={ticket.id} className={styles.mobileCard}>
                <div className={styles.cardTop}>
                  <div className={styles.cardNumber}>
                    <Link href={`/tickets/${ticket.id}`} className={pageStyles.idLink}>
                      #{ticket.ticketNumber.slice(-4)}
                    </Link>
                  </div>
                  <div>{getStatusBadge(ticket.status)}</div>
                </div>

                <div className={styles.cardMenu}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === ticket.id ? null : ticket.id);
                    }}
                    className={styles.actionBtn}
                  >
                    <MoreVertical size={20} />
                  </button>
                  
                  {openMenuId === ticket.id && (
                    <div className={styles.dropdownMenu} style={{ right: 0, top: 32 }} onClick={(e) => e.stopPropagation()}>
                      <Link href={`/tickets/${ticket.id}`} className={styles.dropdownItem}>
                         Просмотр
                      </Link>
                      <button className={clsx(styles.dropdownItem, styles.successItem)} onClick={(e) => handleQuickComplete(ticket.id, e)}>
                        Завершить
                      </button>
                    </div>
                  )}
                </div>

                <Link href={`/tickets/${ticket.id}`} style={{ textDecoration: 'none' }}>
                  <h3 className={styles.cardTitle}>
                    {ticket.description.split('\n')[0].substring(0, 50)}
                    {ticket.description.length > 50 ? '...' : ''}
                  </h3>
                  
                  <div className={styles.cardMeta}>
                    <span>{ticket.equipment?.model || "Общее оборудование"}</span>
                    <span>&middot;</span>
                    <span>{new Date(ticket.createdAt).toLocaleDateString("ru-RU", { day: '2-digit', month: 'short' })}</span>
                  </div>

                  <div className={styles.cardFooter}>
                    <div className={styles.cardLocation}>
                       {ticket.location?.name || ticket.location?.address}
                    </div>
                    <div className={clsx(getPriorityClass(ticket.priority))} style={{ fontSize: 11 }}>
                      {getPriorityText(ticket.priority).toUpperCase()}
                    </div>
                  </div>
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
