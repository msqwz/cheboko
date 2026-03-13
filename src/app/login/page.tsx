"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, LogIn } from "lucide-react";
import styles from "./login.module.css";
import clsx from "clsx";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError(res.error);
        setIsLoading(false);
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("Произошла ошибка при входе");
      setIsLoading(false);
    }
  };

  return (
    <div className={clsx(styles.container, "animate-fade-in")}>
      <div className={styles.gradientBlob1} />
      <div className={styles.gradientBlob2} />

      {/* Левая часть: Брендинг (Скрывается на мобильных) */}
      <div className={styles.leftSidebar}>
        <div className={styles.sidebarBg} />
        <div className={styles.sidebarContent}>
          <div className={styles.logoContainer} style={{ justifyContent: "flex-start", marginBottom: 60 }}>
            <div className={styles.logoIcon}>
              <Image src="/logo.png" alt="Logo" width={40} height={40} />
            </div>
            <span className={styles.logoText} style={{ color: "white" }}>Чебоко</span>
          </div>

          <h1 className={styles.sidebarTitle}>
            Сервис, который работает без перебоев.
          </h1>
          <p className={styles.sidebarText}>
            Единая B2B-платформа для управления заявками, обслуживания кофейных аппаратов и координации инженеров.
          </p>
        </div>
      </div>

      {/* Правая часть: Форма входа */}
      <div className={styles.rightContent}>
        <div className={styles.authCard}>
          {/* Логотип для мобильной версии (Показывается если экран узкий, 
              но в MVP выводим всегда по центру формы для красоты) */}
          <div className={styles.logoContainer}>
             <div className={styles.logoIcon}>
               <Image src="/logo.png" alt="Logo" width={40} height={40} />
             </div>
             <span className={styles.logoText}>Чебоко</span>
          </div>

          <h2 className={styles.title}>С возвращением</h2>
          <p className={styles.subtitle}>Войдите в систему для управления заявками</p>

          <form onSubmit={handleLogin}>
            {error && (
              <div style={{ padding: "12px", background: "var(--status-high-bg, #fee2e2)", color: "var(--status-high, #ef4444)", borderRadius: "8px", marginBottom: "16px", fontSize: "14px" }}>
                {error}
              </div>
            )}
            <div className={styles.formGroup}>
              <label className={styles.label}>Электронная почта</label>
              <div className={styles.inputWrapper}>
                <Mail size={18} className={styles.inputIcon} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@cheboko.ru"
                  className={styles.input}
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Пароль</label>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.inputIcon} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={styles.input}
                  required
                />
              </div>
              <Link href="#" className={styles.forgotPassword}>
                Забыли пароль?
              </Link>
            </div>

            <button type="submit" className={styles.btnSubmit} disabled={isLoading}>
              <LogIn size={20} style={{ marginRight: 8 }} />
              {isLoading ? "Вход..." : "Войти в панель"}
            </button>
          </form>

          <div className={styles.bottomLink}>
            Нет аккаунта?
            <Link href="mailto:support@cheboko.ru">Запросите доступ у администратора</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
