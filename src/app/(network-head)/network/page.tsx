import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import styles from "./page.module.css";
import { Ticket, BarChart3, Map as MapIcon, Users, Plus, TrendingUp } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

export default async function NetworkDashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;

  if (role !== 'CLIENT_NETWORK_HEAD') {
    redirect("/");
  }

  // В реальном приложении здесь будет фильтрация по networkId пользователя
  const { data: tickets } = await supabase
    .from('Ticket')
    .select('*, location:Location(*)')
    .order('createdAt', { ascending: false })
    .limit(5);

  const { data: locations } = await supabase
    .from('Location')
    .select('id')
    .limit(10);

  const activeTicketsCount = tickets?.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELED').length || 0;
  const totalPoints = locations?.length || 0;

  return (
    <div className={clsx("page-container", styles.container, "animate-fade-in")}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Обзор сети</h1>
          <p className={styles.subtitle}>Аналитика и мониторинг всех торговых точек</p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/network/analytics" className={styles.btnSecondary}>
            Отчеты
          </Link>
          <Link href="/network/tickets/new" className={styles.btnPrimary}>
            <Plus size={18} /> Создать заявку
          </Link>
        </div>
      </header>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{activeTicketsCount}</span>
            <span className={styles.statLabel}>Активные заявки</span>
          </div>
          <div className={clsx(styles.statIconWrapper, styles.blue)}>
            <Ticket size={24} />
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{totalPoints}</span>
            <span className={styles.statLabel}>Точек в сети</span>
          </div>
          <div className={clsx(styles.statIconWrapper, styles.purple)}>
            <MapIcon size={24} />
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>—</span>
            <span className={styles.statLabel}>KPI выполнения</span>
          </div>
          <div className={clsx(styles.statIconWrapper, styles.green)}>
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Последние события</h2>
            <Link href="/network/tickets" className={styles.link}>Все заявки</Link>
          </div>
          <div className={styles.list}>
            {tickets?.map(ticket => (
              <Link key={ticket.id} href={`/network/tickets/${ticket.id}`} className={styles.listItem}>
                <div className={styles.ticketBadge}>#{ticket.ticketNumber.slice(-4)}</div>
                <div className={styles.itemContent}>
                  <div className={styles.itemTitle}>{ticket.description.substring(0, 40)}...</div>
                  <div className={styles.itemMeta}>{ticket.location?.name} • {new Date(ticket.createdAt).toLocaleDateString("ru-RU")}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Быстрый доступ</h2>
          </div>
          <div className={styles.toolsGrid}>
            <Link href="/network/map" className={styles.toolCard}>
              <MapIcon size={32} />
              <span>Карта объектов</span>
            </Link>
            <Link href="/network/analytics" className={styles.toolCard}>
              <BarChart3 size={32} />
              <span>Аналитика</span>
            </Link>
            <Link href="/network/clients" className={styles.toolCard}>
              <Users size={32} />
              <span>Мои точки</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

