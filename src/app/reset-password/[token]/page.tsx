"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Lock, CheckCircle, RefreshCw } from "lucide-react";
import styles from "../../login/login.module.css";
import clsx from "clsx";
import { validatePassword } from "@/lib/passwordValidator";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    const passCheck = validatePassword(password);
    if (!passCheck.isValid) {
      setError(passCheck.message);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ошибка при сбросе пароля");
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
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
            <h2 className={styles.title}>Пароль изменен!</h2>
            <p className={styles.subtitle}>Ваш пароль успешно обновлен. Сейчас вы будете перенаправлены на страницу входа...</p>
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

          <h2 className={styles.title}>Новый пароль</h2>
          <p className={styles.subtitle}>Установите новый надежный пароль для вашего аккаунта.</p>

          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ padding: "12px", background: "var(--status-high-bg, #fee2e2)", color: "var(--status-high, #ef4444)", borderRadius: "8px", marginBottom: "16px", fontSize: "14px" }}>
                {error}
              </div>
            )}
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Новый пароль</label>
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
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Подтверждение пароля</label>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.inputIcon} />
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={styles.input}
                  required
                />
              </div>
            </div>

            <button type="submit" className={styles.btnSubmit} disabled={isLoading} style={{ marginTop: "20px" }}>
              <RefreshCw size={20} style={{ marginRight: 8, animation: isLoading ? 'spin 2s linear infinite' : 'none' }} />
              {isLoading ? "Обновление..." : "Сменить пароль"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
