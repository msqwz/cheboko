import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import styles from "./page.module.css";
import { Plus, Ticket, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "CREATED":
      return <span className={clsx(styles.badge, styles.created)}><div className={styles.dot} /> Создана</span>;
    case "OPENED":
      return <span className={clsx(styles.badge, styles.in_work)}><div className={styles.dot} /> Открыта</span>;
    case "ASSIGNED":
    case "ENROUTE":
      return <span className={clsx(styles.badge, styles.assigned)}><div className={styles.dot} /> Назначен</span>;
    case "IN_WORK":
      return <span className={clsx(styles.badge, styles.in_work)}><div className={styles.dot} /> В работе</span>;
    case "COMPLETED":
      return <span className={clsx(styles.badge, styles.completed)}><div className={styles.dot} /> Выполнена</span>;
    case "CANCELED":
      return <span className={clsx(styles.badge, styles.hold)}><div className={styles.dot} /> Отменена</span>;
    case "OPEN": // Legacy support
      return <span className={clsx(styles.badge, styles.created)}><div className={styles.dot} /> Открыта</span>;
    default:
      return <span className={clsx(styles.badge, styles.hold)}><div className={styles.dot} /> {status}</span>;
  }
};

const getPriorityClass = (priority: string | null) => {
  switch (priority) {
    case "HIGH": return styles.priorityHigh;
    case "MEDIUM": return styles.priorityMed;
    case "LOW": return styles.priorityLow;
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

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;


  // Инженер — редирект на список задач (PWA)
  if (role === 'ENGINEER') {
    redirect("/engineer/tasks");
  }

  // Клиентские роли — редирект на их список заявок
  const clientRoles = ['CLIENT_MANAGER', 'CLIENT_NETWORK_HEAD', 'CLIENT_POINT_MANAGER', 'CLIENT_SPECIALIST'];
  if (clientRoles.includes(role)) {
    redirect("/tickets");
  }

  const { data: newTickets, error } = await supabase
    .from('Ticket')
    .select(`
      *,
      location:Location!locationId(*),
      equipment:Equipment!equipmentId(*)
    `)
    .or('status.eq.CREATED,status.eq.OPENED,status.eq.OPEN')
    .order('createdAt', { ascending: true })
    .limit(10);

  if (error) {
    console.error("Error fetching tickets:", error.message || error);
  }


  const { data: allTickets, error: allTicketsError } = await supabase
    .from('Ticket')
    .select('*');

  if (allTicketsError) {
    console.error("Error fetching all tickets:", allTicketsError.message || allTicketsError);
  }


  const newTicketsCount = allTickets?.filter(t => t.status === 'CREATED' || t.status === 'OPENED').length || 0;
  const highPriorityCount = allTickets?.filter(t => t.priority === 'HIGH' && t.status !== 'COMPLETED' && t.status !== 'CANCELED').length || 0;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const completedThisMonth = allTickets?.filter(t =>
    t.status === 'COMPLETED' &&
    new Date(t.updatedAt) >= startOfMonth
  ).length || 0;

  const completedTickets = allTickets?.filter(t => t.status === 'COMPLETED') || [];
  let avgClosingTimeStr = "—";

  if (completedTickets.length > 0) {
    const totalMs = completedTickets.reduce((acc, t) => {
      // По ТЗ: от статуса OPENED до COMPLETED
      // Используем openedAt если есть, иначе createdAt
      const start = new Date(t.openedAt || t.createdAt).getTime();
      const end = new Date(t.completedAt || t.updatedAt).getTime();
      return acc + (end - start);
    }, 0);

    const avgMs = totalMs / completedTickets.length;
    const avgHours = Math.round(avgMs / (1000 * 60 * 60));

    if (avgHours < 24) {
      avgClosingTimeStr = `${avgHours} ч.`;
    } else {
      const avgDays = Math.round(avgHours / 24);
      avgClosingTimeStr = `${avgDays} д.`;
    }
  }

  return (
    <div className={clsx("page-container", styles.container, "animate-fade-in")}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Обзор</h1>
          <p className={styles.subtitle}>Необработанные заявки</p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/manager/tickets" className={styles.btnSecondary}>
            Все заявки
          </Link>
          <Link href="/manager/tickets/new" className={styles.btnPrimary}>
            <Plus size={18} /> Создать заявку
          </Link>
        </div>
      </header>

      <section className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{newTicketsCount}</span>
            <span className={styles.statLabel}>Новых заявок</span>
          </div>
          <div className={clsx(styles.statIconWrapper, styles.blue)}>
            <Ticket size={24} />
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{highPriorityCount}</span>
            <span className={styles.statLabel}>Критичный приоритет</span>
          </div>
          <div className={clsx(styles.statIconWrapper, styles.red)}>
            <AlertTriangle size={24} />
          </div>
        </div>


        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{avgClosingTimeStr}</span>
            <span className={styles.statLabel}>Среднее время закрытия</span>
          </div>
          <div className={clsx(styles.statIconWrapper, styles.orange)}>
            <Clock size={24} />
          </div>
        </div>


        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{completedThisMonth}</span>
            <span className={styles.statLabel}>Выполнено (Месяц)</span>
          </div>
          <div className={clsx(styles.statIconWrapper, styles.green)}>
            <CheckCircle2 size={24} />
          </div>
        </div>

      </section>


      <section>
        <div className={styles.sectionTitle}>
          Входящие заявки (Ожидают распределения)
        </div>
        <div className={styles.card}>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>№</th>
                  <th>Проблема & Оборудование</th>
                  <th>Клиент (Точка)</th>
                  <th>Статус</th>
                  <th>Приоритет</th>
                </tr>
              </thead>
              <tbody>
                {newTickets?.map((ticket) => {
                  const title = ticket.description.split(']')[0].replace('[', '') || "Проблема";

                  return (
                    <tr key={ticket.id}>
                      <td><Link href={`/manager/tickets/${ticket.id}`} className={styles.idLink}>#{ticket.ticketNumber.slice(-4)}</Link></td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                          {ticket.equipment?.name || "Без оборудования"} &middot; {new Date(ticket.createdAt).toLocaleDateString("ru-RU", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td>{ticket.location?.address}</td>
                      <td>{getStatusBadge(ticket.status)}</td>
                      <td className={getPriorityClass(ticket.priority)}>{getPriorityText(ticket.priority)}</td>
                    </tr>
                  )
                })}
                {(!newTickets || newTickets.length === 0) && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Нет новых заявок</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

