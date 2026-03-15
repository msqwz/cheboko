"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ListTodo, PlusCircle, User, ClipboardList, Bell, QrCode } from "lucide-react";
import dynamic from "next/dynamic";
const QRScanner = dynamic(() => import("@/components/QRScanner"), { ssr: false });



import styles from "./BottomNav.module.css";
import clsx from "clsx";

import { useSession } from "next-auth/react";

export default function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;


  // Не рендерим на странице авторизации
  if (
    pathname === "/login" || 
    pathname === "/register" || 
    pathname === "/forgot-password" || 
    pathname.startsWith("/reset-password") ||
    pathname.includes("/admin")
  ) {
    return null;
  }

  // Меню для ENGINEER (PWA)
  const engineerNavItems = [
    { href: "/engineer/tasks", label: "Задачи", icon: ClipboardList },
    { href: "/engineer/notifications", label: "Оповещения", icon: Bell },
    { href: "/engineer/profile", label: "Профиль", icon: User },
  ];

  // Меню для CLIENT_* (клиент)
  const clientNavItems = [
    { href: "/tickets", label: "Активные", icon: ListTodo },
    { href: "/tickets/new", label: "Создать", icon: PlusCircle },
    { href: "/profile", label: "Профиль", icon: User },
  ];

  // Выбор меню
  const NAV_ITEMS = role === 'ENGINEER' ? engineerNavItems : clientNavItems;

  const [isScannerOpen, setIsScannerOpen] = useState(false);

  return (
    <>
      <nav className={styles.bottomNav}>
        <div className={styles.navList}>
          {NAV_ITEMS.map((item, index) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            // Вставляем кнопку сканера посередине
            if (index === 1) {
              return (
                <div key="center-scan" style={{ display: 'contents' }}>
                  <Link 
                    key={item.href} 
                    href={item.href} 
                    className={clsx(styles.navItem, isActive && styles.active)}
                  >
                    <Icon className={styles.icon} strokeWidth={isActive ? 2.5 : 2} />
                    <span>{item.label}</span>
                  </Link>

                  <button 
                    onClick={() => setIsScannerOpen(true)}
                    className={styles.scanFab}
                  >
                    <QrCode size={24} color="#fff" />
                  </button>
                </div>
              );
            }
            
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

      {isScannerOpen && (
        <QRScanner onClose={() => setIsScannerOpen(false)} />
      )}
    </>
  );
}


