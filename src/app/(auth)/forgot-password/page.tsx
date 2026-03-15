"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, ArrowLeft, Send, CheckCircle } from "lucide-react";
import styles from "../login/login.module.css";
import clsx from "clsx";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Произошла ошибка");
      }

      setMessage(data.message);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const BrandedSidebar = () => (
    <div className={styles.leftSidebar}>
      <div className={styles.sidebarBg} />
      <div className={styles.sidebarContent}>
        <div className={styles.logoContainer} style={{ justifyContent: "flex-start", marginBottom: 60 }}>
          <div className={styles.logoIcon}>
            <Image src="/logo.png" alt="Logo" width={64} height={64} />
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
  );

  if (isSuccess) {
    return (
      <div className={clsx(styles.container, "animate-fade-in")}>
        <div className={styles.gradientBlob1} />
        <div className={styles.gradientBlob2} />
        
        <BrandedSidebar />

        <div className={styles.rightContent}>
          <div className={styles.authCard} style={{ textAlign: "center" }}>
            <CheckCircle size={64} color="var(--status-low)" style={{ margin: "0 auto 20px" }} />
            <h2 className={styles.title}>Проверьте почту</h2>
            <p className={styles.subtitle}>{message}</p>
            <Link href="/login" className={styles.btnSubmit} style={{ marginTop: 20, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Вернуться ко входу
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx(styles.container, "animate-fade-in")}>
      <div className={styles.gradientBlob1} />
      <div className={styles.gradientBlob2} />

      <BrandedSidebar />

      <div className={styles.rightContent}>
        <div className={styles.authCard}>
          <div className={styles.logoContainer}>
             <div className={styles.logoIcon}>
               <Image src="/logo.png" alt="Logo" width={60} height={60} />
             </div>
             <span className={styles.logoText}>Чебоко</span>
          </div>

          <h2 className={styles.title}>Восстановление доступа</h2>
          <p className={styles.subtitle}>Введите email, указанный при регистрации, и мы отправим ссылку для сброса пароля.</p>

          <form onSubmit={handleSubmit}>
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
                  placeholder="example@mail.ru"
                  className={styles.input}
                  required
                />
              </div>
            </div>

            <button type="submit" className={styles.btnSubmit} disabled={isLoading} style={{ marginTop: "20px" }}>
              <Send size={20} style={{ marginRight: 8 }} />
              {isLoading ? "Отправка..." : "Отправить ссылку"}
            </button>
          </form>

          <div className={styles.bottomLink}>
            <Link href="/login" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <ArrowLeft size={16} /> Вернуться назад
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

