"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useTheme } from "@/lib/useTheme";
import { 
  LayoutDashboard,
  Ticket, 
  MapPin, 
  Coffee, 
  Building2, 
  Users, 
  Bell, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  BarChart2,
  TicketIcon,
  Map,
  Wrench,
  Moon,
  Sun
} from "lucide-react";
import styles from "./Sidebar.module.css";
import clsx from "clsx";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";

// Навигация по ролям согласно ТЗ
const NAV_BY_ROLE: Record<string, { href: string; label: string; icon: any }[]> = {
  ADMIN: [
    { href: "/admin", label: "Дашборд", icon: BarChart2 },
    { href: "/admin/tickets", label: "Заявки", icon: TicketIcon },
    { href: "/admin/map", label: "Карта", icon: Map },
    { href: "/admin/equipment", label: "Оборудование", icon: Coffee },
    { href: "/admin/analytics", label: "Аналитика", icon: BarChart2 },
    { href: "/admin/clients", label: "Клиенты", icon: Users },
    { href: "/admin/team", label: "Сотрудники", icon: Wrench },
    { href: "/admin/notifications", label: "Уведомления", icon: Bell },
    { href: "/admin/settings", label: "Настройки", icon: Settings },
  ],
  OPERATOR: [
    { href: "/operator", label: "Обзор", icon: LayoutDashboard },
    { href: "/operator/tickets", label: "Заявки", icon: TicketIcon },
    { href: "/operator/map", label: "Карта", icon: MapPin },
    { href: "/operator/equipment", label: "Оборудование", icon: Coffee },
    { href: "/operator/clients", label: "Клиенты", icon: Building2 },
    { href: "/operator/team", label: "Команда", icon: Users },
    { href: "/operator/notifications", label: "Уведомления", icon: Bell },
  ],
  REGIONAL_MANAGER: [
    { href: "/admin/analytics", label: "Аналитика", icon: BarChart2 },
    { href: "/admin/clients", label: "Клиенты", icon: Users },
    { href: "/admin/team", label: "Сотрудники", icon: Wrench },
    { href: "/admin/notifications", label: "Уведомления", icon: Bell },
  ],
  ENGINEER: [
    { href: "/engineer/tasks", label: "Мои заявки", icon: TicketIcon },
    { href: "/engineer/map", label: "Карта", icon: Map },
    { href: "/engineer/notifications", label: "Уведомления", icon: Bell },
    { href: "/engineer/profile", label: "Профиль", icon: Users },
  ],
  CLIENT_NETWORK_HEAD: [
    { href: "/network", label: "Обзор", icon: LayoutDashboard },
    { href: "/network/tickets", label: "Заявки", icon: TicketIcon },
    { href: "/network/map", label: "Карта", icon: MapPin },
    { href: "/network/analytics", label: "Аналитика", icon: BarChart2 },
    { href: "/network/clients", label: "Мои точки", icon: Building2 },
    { href: "/network/notifications", label: "Уведомления", icon: Bell },
    { href: "/network/profile", label: "Профиль", icon: Users },
  ],
  CLIENT_POINT_MANAGER: [
    { href: "/point", label: "Обзор", icon: LayoutDashboard },
    { href: "/point/tickets", label: "Заявки", icon: TicketIcon },
    { href: "/point/notifications", label: "Уведомления", icon: Bell },
    { href: "/point/profile", label: "Профиль", icon: Users },
  ],
  CLIENT_SPECIALIST: [
    { href: "/tickets", label: "Мои заявки", icon: TicketIcon },
    { href: "/notifications", label: "Уведомления", icon: Bell },
    { href: "/profile", label: "Профиль", icon: Users },
  ],
  CLIENT_MANAGER: [
    { href: "/tickets", label: "Заявки", icon: TicketIcon },
    { href: "/notifications", label: "Уведомления", icon: Bell },
    { href: "/profile", label: "Профиль", icon: Users },
  ],
};

export function getRoleText(role: string): string {
  switch (role) {
    case "ADMIN": return "Администратор";
    case "OPERATOR": return "Оператор";
    case "ENGINEER": return "Инженер";
    case "REGIONAL_MANAGER": return "Менеджер региона";
    case "CLIENT_NETWORK_HEAD": return "Руководитель сети";
    case "CLIENT_POINT_MANAGER": return "Управляющий точкой";
    case "CLIENT_SPECIALIST": return "Специалист";
    case "CLIENT_MANAGER": return "Клиент";
    default: return role;
  }
}

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as string;
  const { theme, toggleTheme } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!session?.user) return;
    const fetchUnread = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [session]);

  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/invite/")
  ) {
    return null;
  }

  const navItems = NAV_BY_ROLE[role] ?? NAV_BY_ROLE["ADMIN"];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoContainer}>
        <div className={styles.logoIcon}>
          <Image src="/logo.png" alt="Чебоко" width={48} height={48} />
        </div>
        <span className={styles.logoText}>Чебоко</span>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
          const Icon = item.icon;
          const showBadge = item.href.includes("notifications") && unreadCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(styles.navItem, isActive && styles.activeNavItem)}
              style={{ position: "relative" }}
            >
              <Icon className={styles.icon} />
              {item.label}
              {showBadge && (
                <span style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  minWidth: 18,
                  height: 18,
                  borderRadius: "var(--radius-full)",
                  background: "var(--status-high)",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <div className={styles.avatar}>
          {session?.user?.name ? session.user.name.substring(0, 1) : <Users size={20} color="var(--text-muted)" />}
        </div>
        <Link href="/admin/profile" className={styles.userInfo} style={{ textDecoration: "none", flex: 1 }}>
          <span className={styles.userName}>{session?.user?.name || "Пользователь"}</span>
          <span className={styles.userRole}>{getRoleText(role || "")}</span>
        </Link>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={toggleTheme}
            className={styles.themeToggle}
            title={theme === "light" ? "Темная тема" : "Светлая тема"}
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={styles.logoutBtn}
            title="Выйти"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
