"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, MapPin, User, Settings, CheckCircle, AlertTriangle, Play, Pause, XCircle, Send } from "lucide-react";
import styles from "./detail.module.css";
import clsx from "clsx";
import { useSession } from "next-auth/react";
import TicketHistory from "./TicketHistory";


const getStatusBadge = (status: string) => {
  switch (status) {
    case "CREATED":
      return (
        <div className={styles.statusBadgeLg} style={{ backgroundColor: "rgba(107, 114, 128, 0.15)", color: "var(--text-muted)" }}>
          <Clock size={18} /> Новая
        </div>
      );
    case "OPENED":
      return (
        <div className={styles.statusBadgeLg} style={{ backgroundColor: "rgba(59, 130, 246, 0.15)", color: "var(--status-low)" }}>
          <Settings size={18} /> Ожидает обработки
        </div>
      );
    case "ASSIGNED":
      return (
        <div className={styles.statusBadgeLg} style={{ backgroundColor: "rgba(59, 130, 246, 0.15)", color: "var(--status-low)" }}>
          <User size={18} /> Назначен Инженер
        </div>
      );
    case "ENROUTE":
      return (
        <div className={styles.statusBadgeLg} style={{ backgroundColor: "rgba(59, 130, 246, 0.15)", color: "var(--status-low)" }}>
          <Play size={18} /> Инженер в пути
        </div>
      );
    case "IN_WORK":
      return (
        <div className={styles.statusBadgeLg} style={{ backgroundColor: "rgba(245, 158, 11, 0.15)", color: "var(--status-medium)" }}>
          <Settings size={18} /> В работе
        </div>
      );
    case "ON_HOLD":
      return (
        <div className={styles.statusBadgeLg} style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", color: "var(--status-high)" }}>
          <Pause size={18} /> Приостановлена
        </div>
      );
    case "COMPLETED":
      return (
        <div className={styles.statusBadgeLg} style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", color: "var(--status-success)" }}>
          <CheckCircle size={18} /> Выполнена
        </div>
      );
    case "CANCELED":
      return (
        <div className={styles.statusBadgeLg} style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", color: "var(--status-high)" }}>
          <XCircle size={18} /> Отменена
        </div>
      );
    default:
      return <div className={styles.statusBadgeLg}>{status}</div>;
  }
};

export default function TicketDetail() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<any>(null);
  const [engineers, setEngineers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [engineerComment, setEngineerComment] = useState("");
  const { data: session } = useSession();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [ticketRes, engRes] = await Promise.all([
          fetch(`/api/tickets/${ticketId}`),
          fetch('/api/users/engineers')
        ]);
        
        if (!ticketRes.ok) throw new Error("Ticket not found");
        
        const ticketData = await ticketRes.json();
        const engData = await engRes.json();
        
        setTicket(ticketData);
        setEngineers(engData);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [ticketId]);

  const updateTicket = async (data: any) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) throw new Error("Failed to update ticket");
      
      const updatedTicket = await res.json();
      setTicket(updatedTicket);
      setEngineerComment(""); // Сброс комментария
    } catch (err) {
      alert("Ошибка при обновлении. Попробуйте снова.");
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) return <div className="page-container">Загрузка данных заявки...</div>;
  if (!ticket) return <div className="page-container">Заявка не найдена.</div>;

  return (
    <div className={clsx("page-container", "animate-fade-in")}>
      <button 
        onClick={() => router.back()} 
        style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px", fontSize: "14px", fontWeight: 500, background: "none", border: "none", cursor: "pointer" }}
      >
        <ArrowLeft size={16} /> Назад к списку
      </button>

      <header className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.ticketId}>#{ticket.ticketNumber.slice(-4)}</span>
          <h1 className={styles.ticketTitle}>{ticket.description.split('\n')[0].substring(0, 60)}</h1>
        </div>
        <div className={styles.metaRow}>
          <div className={styles.metaItem}>
            <Clock size={16} /> Создана: {new Date(ticket.createdAt).toLocaleString("ru-RU")}
          </div>
          <div className={styles.metaItem} style={{ color: ticket.priority === 'HIGH' ? "var(--status-high)" : "inherit", fontWeight: 600 }}>
            <AlertTriangle size={16} /> {ticket.priority === 'HIGH' ? 'Высокий' : ticket.priority === 'MEDIUM' ? 'Средний' : 'Низкий'} Приоритет
          </div>
        </div>
      </header>

      <div className={styles.grid}>
        <div>
          <section className={styles.sectionBlock}>
            <h2 className={styles.sectionHeader}>Описание проблемы (от клиента)</h2>
            <p style={{ color: "var(--text-primary)", fontSize: "15px", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {ticket.description}
            </p>
            
            {(ticket.attachments || ticket.photos) && (() => {
              let urls: string[] = [];
              try {
                const photosData = ticket.attachments || ticket.photos;
                urls = typeof photosData === 'string' ? JSON.parse(photosData) : photosData;
              } catch { 
                urls = []; 
              }
              return urls && Array.isArray(urls) && urls.length > 0 ? (
                <>
                  <div className={styles.divider} />
                  <h3 className={styles.sectionHeader} style={{ fontSize: "14px", marginBottom: "12px" }}>Прикрепленные фото ({urls.length})</h3>
                  <div className={styles.photoGrid}>
                    {urls.map((url: string, i: number) => (
                      <a
                        key={i}
                        href={url.startsWith('/') ? url : `/${url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.photoThumbnail}
                        style={{ position: "relative", display: "block", overflow: "hidden" }}
                      >
                        <img
                          src={url.startsWith('/') ? url : `/${url}`}
                          alt={`Фото ${i + 1}`}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EНет фото%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      </a>
                    ))}
                  </div>
                </>
              ) : null;
            })()}
          </section>

          <section className={styles.sectionBlock}>
            <h2 className={styles.sectionHeader}>Детали и Оборудование</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Модель аппарата</span>
                <span className={styles.infoValue}>{ticket.equipment?.model || "Не указано"}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Серийный номер</span>
                <span className={styles.infoValue}>{ticket.equipment?.serialNumber || "—"}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Адрес кофейни</span>
                <span className={styles.infoValue} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                  <MapPin size={16} style={{ marginTop: 2, minWidth: 16 }} color="var(--accent-primary)"/> 
                  {ticket.location?.address}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Точка</span>
                <span className={styles.infoValue}>{ticket.location?.legalName || "—"}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Создатель заявки</span>
                <span className={styles.infoValue}>{ticket.creator?.name || ticket.creator?.email}</span>
              </div>
              {ticket.problemType && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Тип проблемы</span>
                  <span className={styles.infoValue}>{ticket.problemType}</span>
                </div>
              )}
            </div>
          </section>

          <TicketHistory history={ticket.history} />
        </div>


        <div>
          <aside className={styles.sectionBlock}>
            <h2 className={styles.sectionHeader}>Статус и Управление</h2>

            {getStatusBadge(ticket.status)}

            <div className={styles.controlGroup}>
              <span className={styles.infoLabel} style={{ marginBottom: 4, display: "block" }}>Назначенный Инженер</span>
              <span className={styles.infoValue} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8}}>
                <div style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "var(--accent-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>
                  {ticket.engineer?.name?.substring(0, 1) || "?"}
                </div>
                {ticket.engineer?.name || "Не назначен"}
              </span>
            </div>

            <div className={styles.divider} />

            {/* Блок действий для Инженера */}
            <div className={styles.controlGroup}>
               <span className={styles.infoLabel} style={{ marginBottom: 8, display: "block" }}>Действия по заявке</span>
               
               <div className={styles.actionBtnRow}>
                 {/* Инженер видит свои кнопки, или Админ видит всё */}
                 {(session?.user as any)?.role === 'ADMIN' || (session?.user as any)?.id === ticket.engineerId ? (
                   <>
                     {ticket.status === "ASSIGNED" && (
                       <button className={styles.btnPrimary} onClick={() => updateTicket({ status: "ENROUTE" })} disabled={isUpdating}>
                         <Play size={18} /> Выехать на адрес
                       </button>
                     )}
                     {ticket.status === "ENROUTE" && (
                       <button className={styles.btnPrimary} onClick={() => updateTicket({ status: "IN_WORK" })} disabled={isUpdating}>
                         <Settings size={18} /> Начать работу
                       </button>
                     )}
                     {(ticket.status === "IN_WORK" || ticket.status === "ENROUTE") && (
                       <div style={{ width: '100%', marginTop: 8 }}>
                         <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Комментарий (необязательно):</label>
                         <textarea 
                           className={styles.textarea} 
                           placeholder="Что сделано / причина паузы..."
                           value={engineerComment}
                           onChange={(e) => setEngineerComment(e.target.value)}
                           style={{ width: '100%', marginBottom: 12 }}
                         />
                         
                         <div className={styles.actionBtnRow}>
                           <button className={styles.btnWarning} onClick={() => updateTicket({ status: "ON_HOLD", engineerComment })} disabled={isUpdating}>
                             <Pause size={18} /> Пауза
                           </button>
                           {ticket.status === "IN_WORK" && (
                             <button className={styles.btnPrimary} style={{ backgroundColor: "var(--status-success)" }} onClick={() => updateTicket({ status: "COMPLETED", engineerComment })} disabled={isUpdating}>
                               <CheckCircle size={18} /> Выполнено
                             </button>
                           )}
                         </div>
                       </div>
                     )}
                     {ticket.status === "ON_HOLD" && (
                       <button className={styles.btnPrimary} onClick={() => updateTicket({ status: "IN_WORK" })} disabled={isUpdating}>
                         <Play size={18} /> Возобновить
                       </button>
                     )}
                     {ticket.status === "COMPLETED" && (
                       <p style={{ color: 'var(--status-success)', fontSize: 13, fontWeight: 500 }}>Заявка успешно закрыта.</p>
                     )}
                   </>
                 ) : (
                   <p style={{ fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>
                     {ticket.status === "CREATED" || ticket.status === "OPENED" 
                       ? "Ожидайте назначения инженера или смены статуса диспетчером."
                       : "Только назначенный инженер может менять статус."}
                   </p>
                 )}
               </div>
            </div>

            <div className={styles.divider} />

             {/* Панель Оператора */}
            <div className={styles.controlGroup}>
              <span className={styles.infoLabel} style={{ marginBottom: 8, display: "block", fontSize: 12 }}>Панель Оператора (Изменить)</span>
              
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Приоритет:</label>
                <select 
                  className={styles.select} 
                  value={ticket.priority || ""} 
                  onChange={(e) => updateTicket({ priority: e.target.value })}
                  disabled={isUpdating}
                >
                  <option value="LOW">Низкий</option>
                  <option value="MEDIUM">Средний</option>
                  <option value="HIGH">Высокий</option>
                </select>
              </div>

               <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Назначить инженера:</label>
                <select 
                  className={styles.select} 
                  value={ticket.engineerId || ""} 
                  onChange={(e) => updateTicket({ engineerId: e.target.value, status: e.target.value ? "ASSIGNED" : "OPENED" })}
                  disabled={isUpdating}
                >
                  <option value="">-- Выбрать инженера --</option>
                  {engineers.map(eng => (
                    <option key={eng.id} value={eng.id}>{eng.name}</option>
                  ))}
                </select>
              </div>

               <button 
                className={styles.btnDanger} 
                style={{ width: "100%", marginTop: "12px" }}
                onClick={() => updateTicket({ status: "CANCELED" })}
                disabled={isUpdating || ticket.status === "CANCELED"}
               >
                  <XCircle size={18} /> Отменить заявку
               </button>
            </div>

          </aside>
        </div>

      </div>
    </div>
  );
}
