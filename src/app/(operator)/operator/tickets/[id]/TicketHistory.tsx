"use client";

import { Clock, User, MessageSquare, ArrowRight, UserPlus } from "lucide-react";
import styles from "./detail.module.css";
import pageStyles from "@/app/(operator)/operator/page.module.css";
import clsx from "clsx";

interface HistoryItem {
  id: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
  user?: {
    name: string;
    role: string;
  };
}

export default function TicketHistory({ history }: { history: HistoryItem[] }) {
  if (!history || history.length === 0) return null;

  const translateStatus = (status: string) => {
    switch (status) {
      case "CREATED": return "Создана";
      case "OPENED": return "Открыта";
      case "ASSIGNED": return "Назначена";
      case "ENROUTE": return "В пути";
      case "IN_WORK": return "В работе";
      case "ON_HOLD": return "Пауза";
      case "COMPLETED": return "Выполнена";
      case "CANCELED": return "Отменена";
      default: return status;
    }
  };

  const renderAction = (item: HistoryItem) => {
    switch (item.action) {
      case 'CREATED':
      case 'Создание заявки': // Fallback for old data
        return (
          <div className={styles.historyAction}>
            Создание заявки
          </div>
        );
      case 'STATUS_CHANGE':
      case 'Смена статуса': // Fallback
        return (
          <div className={styles.historyAction}>
            Смена статуса: <span className={styles.historyValue}>{translateStatus(item.oldValue || "")}</span> 
            <ArrowRight size={12} style={{ margin: '0 4px' }} /> 
            <span className={clsx(styles.historyValue, styles.newValue)}>{translateStatus(item.newValue || "")}</span>
          </div>
        );
      case 'ASSIGNMENT_CHANGE':
      case 'Назначение инженера': // Fallback
        return (
          <div className={styles.historyAction}>
            <UserPlus size={14} style={{ marginRight: 6 }} />
            Назначение инженера
          </div>
        );
      case 'COMMENT_ADDED':
      case 'Добавлен комментарий': // Fallback
        return (
          <div className={styles.historyAction}>
            <MessageSquare size={14} style={{ marginRight: 6 }} />
            Добавлен комментарий: <span className={styles.historyComment}>"{item.newValue}"</span>
          </div>
        );
      case 'PRIORITY_CHANGE':
        return (
          <div className={styles.historyAction}>
            Смена приоритета: <span className={styles.historyValue}>{item.oldValue}</span>
            <ArrowRight size={12} style={{ margin: '0 4px' }} />
            <span className={clsx(styles.historyValue, styles.newValue)}>{item.newValue}</span>
          </div>
        );
      default:
        return item.action;
    }
  };


  return (
    <section className={styles.sectionBlock} style={{ marginTop: 24 }}>
      <h2 className={styles.sectionHeader}>История изменений</h2>
      <div className={styles.timeline}>
        {history.map((item) => (
          <div key={item.id} className={styles.timelineItem}>
            <div className={styles.timelineDot} />
            <div className={styles.timelineContent}>
              <div className={styles.timelineHeader}>
                <span className={styles.timelineUser}>
                  {item.user?.name || "Система"} ({item.user?.role || "System"})
                </span>
                <span className={styles.timelineDate}>
                  {new Date(item.createdAt).toLocaleString("ru-RU", { 
                    day: '2-digit', 
                    month: 'short', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
              <div className={styles.timelineBody}>
                {renderAction(item)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
