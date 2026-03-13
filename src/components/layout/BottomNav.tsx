"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListTodo, PlusCircle, User } from "lucide-react";
import styles from "./BottomNav.module.css";
import clsx from "clsx";

import { useSession } from "next-auth/react";

export default function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  // Не рендерим на странице авторизации
  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  // Меню для CLIENT_MANAGER (клиент) - без Главной
  const clientNavItems = [
    { href: "/tickets", label: "Заявки", icon: ListTodo },
    { href: "/tickets/new", label: "Создать", icon: PlusCircle },
    { href: "/profile", label: "Профиль", icon: User },
  ];

  // Полное меню для остальных ролей
  const fullNavItems = [
    { href: "/", label: "Главная", icon: ListTodo },
    { href: "/tickets", label: "Заявки", icon: ListTodo },
    { href: "/tickets/new", label: "Создать", icon: PlusCircle },
    { href: "/profile", label: "Профиль", icon: User },
  ];

  const NAV_ITEMS = role === 'CLIENT_MANAGER' ? clientNavItems : fullNavItems;

  return (
    <nav className={styles.bottomNav}>
      <div className={styles.navList}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={clsx(styles.navItem, isActive && styles.active)}
            >
              <Icon className={styles.icon} strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
