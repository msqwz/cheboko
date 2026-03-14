import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import styles from "./page.module.css";
import { Ticket, Clock, CheckCircle2, AlertTriangle, Plus } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

export default async function PointDashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any).role;
  if (role !== 'CLIENT_POINT_MANAGER') {
    redirect("/");
  }

  // Получаем заявки для текущего пользователя (управляющего точки)
  // В идеале мы должны фильтровать по точке, но пока фильтруем по создателю
  const { data: tickets, error } = await supabase
    .from('Ticket')
    .select(`
      *,
      location:Location!locationId(*),
      equipment:Equipment!equipmentId(*)
    `)
    .eq('creatorId', (session.user as any).id)
    .order('createdAt', { ascending: false })
    .limit(5);

  const activeTicketsCount = tickets?.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELED').length || 0;
  const completedTicketsCount = tickets?.filter(t => t.status === 'COMPLETED').length || 0;

  return (
    <div className={clsx("page-container", styles.container, "animate-fade-in")}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Обзор точки</h1>
          <p className={styles.subtitle}>Состояние оборудования и заявок</p>
        </div>
        <Link href="/point/point/tickets/new" className={styles.btnPrimary}>
          <Plus size={18} /> Новая заявка
        </Link>
      </header>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{activeTicketsCount}</span>
            <span className={styles.statLabel}>Активные заявки</span>
          </div>
          <div className={clsx(styles.statIconWrapper, styles.blue)}>
            <Clock size={24} />
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{completedTicketsCount}</span>
            <span className={styles.statLabel}>Выполнено</span>
          </div>
          <div className={clsx(styles.statIconWrapper, styles.green)}>
            <CheckCircle2 size={24} />
          </div>
        </div>
      </div>

      <section className={styles.ticketsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Последние заявки</h2>
          <Link href="/point/point/tickets" className={styles.link}>Смотреть все</Link>
        </div>

        <div className={styles.ticketList}>
          {tickets?.map(ticket => (
            <Link key={ticket.id} href={`/point/point/tickets/${ticket.id}`} className={styles.ticketCard}>
              <div className={styles.ticketMain}>
                <div className={styles.ticketBadge}>#{ticket.ticketNumber.slice(-4)}</div>
                <div className={styles.ticketInfo}>
                  <div className={styles.ticketTitle}>{ticket.description.substring(0, 50)}...</div>
                  <div className={styles.ticketMeta}>
                    {ticket.equipment?.model || "Оборудование"} • {new Date(ticket.createdAt).toLocaleDateString("ru-RU")}
                  </div>
                </div>
              </div>
              <div className={clsx(styles.statusIcon, styles[ticket.status.toLowerCase()])}>
                {ticket.status === 'COMPLETED' ? <CheckCircle2 size={20} /> : <Clock size={20} />}
              </div>
            </Link>
          ))}
          {(!tickets || tickets.length === 0) && (
            <div className={styles.emptyState}>Заявок пока нет</div>
          )}
        </div>
      </section>
    </div>
  );
}
