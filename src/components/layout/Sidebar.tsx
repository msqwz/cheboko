"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useTheme } from "@/lib/useTheme";
import { Coffee, Ticket as TicketIcon, Users, Settings, Bell, LogOut, Moon, Sun } from "lucide-react";
import styles from "./Sidebar.module.css";
import clsx from "clsx";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const { theme, toggleTheme } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);

  // Получаем количество непрочитанных уведомлений
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

  // Не рендерить боковое меню на страницах авторизации
  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  // Меню для CLIENT_MANAGER (клиент)
  const clientNavItems = [
    { href: "/tickets", label: "Заявки", icon: TicketIcon },
    { href: "/equipment", label: "Оборудование", icon: Coffee },
    { href: "/profile", label: "Профиль", icon: Users },
    { href: "/notifications", label: "Уведомления", icon: Bell },
  ];

  // Полное меню для остальных ролей
  const fullNavItems = [
    { href: "/", label: "Дашборд", icon: Coffee },
    { href: "/tickets", label: "Заявки", icon: TicketIcon },
    { href: "/map", label: "Карта техников", icon: Users },
    { href: "/equipment", label: "Оборудование", icon: Coffee },
    { href: "/clients", label: "Клиенты", icon: Coffee },
    { href: "/team", label: "Сотрудники", icon: Users },
    { href: "/notifications", label: "Уведомления", icon: Bell },
    { href: "/settings", label: "Настройки", icon: Settings },
  ];

  const NAV_ITEMS = role === 'CLIENT_MANAGER' ? clientNavItems : fullNavItems;

  const roleText = (userRole: string) => {
    switch (userRole) {
      case 'ADMIN': return 'Админ';

      case 'OPERATOR': return 'Оператор';
      case 'ENGINEER': return 'Инженер';
      case 'CLIENT_MANAGER': return 'Клиент';
      default: return userRole;
    }
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoContainer}>
        <div className={styles.logoIcon}>
          <Image src="/logo.png" alt="Чебоко" width={48} height={48} />
        </div>
        <span className={styles.logoText}>Чебоко</span>
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          const showBadge = item.href === "/notifications" && unreadCount > 0;
          
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
        <Link href="/profile" className={styles.userInfo} style={{ textDecoration: 'none', flex: 1 }}>
          <span className={styles.userName}>{session?.user?.name || "Пользователь"}</span>
          <span className={styles.userRole}>{roleText((session?.user as any)?.role || "")}</span>
        </Link>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button 
            onClick={toggleTheme}
            className={styles.themeToggle}
            title={theme === 'light' ? "Темная тема" : "Светлая тема"}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button 
            onClick={() => signOut()}
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
