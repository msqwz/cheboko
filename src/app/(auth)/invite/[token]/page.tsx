"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Lock, User, Phone, ShieldCheck, LogIn } from "lucide-react";
import styles from "../../login/login.module.css";
import clsx from "clsx";
import { validatePassword } from "@/lib/passwordValidator";

export default function InvitePage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // 1. Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const res = await fetch(`/api/invite/verify?token=${token}`);
        if (!res.ok) throw new Error("Неверная или истекшая ссылка");
        
        const data = await res.json();
        setEmail(data.email);
        setRole(data.role);
        setFormData(prev => ({ ...prev, name: data.name || "", phone: data.phone || "" }));
        setIsValid(true);
      } catch (err: any) {
        setError(err.message);
        setIsValid(false);
      }
    };
    verifyToken();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    const passwordCheck = validatePassword(formData.password);
    if (!passwordCheck.isValid) {
      setError(passwordCheck.message);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/invite/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Ошибка активации");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login?activated=true");
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isValid === false) {
    return (
      <div className={styles.container}>
        <div className={styles.authCard} style={{ textAlign: "center" }}>
          <h2 className={styles.title}>Ошибка ссылки</h2>
          <p className={styles.subtitle}>{error || "Эта ссылка некорректна или срок её действия истёк."}</p>
          <Link href="/login" className={styles.btnSubmit} style={{ marginTop: 20, display: "flex", justifyContent: "center" }}>Вернуться ко входу</Link>
        </div>
      </div>
    );
  }

  if (isValid === null) {
    return <div className={styles.container}><div className={styles.authCard}>Проверка приглашения...</div></div>;
  }

  return (
    <div className={clsx(styles.container, "animate-fade-in")}>
      <div className={styles.gradientBlob1} />
      <div className={styles.gradientBlob2} />

      <div className={styles.rightContent} style={{ margin: "0 auto", width: "100%", maxWidth: 500 }}>
        <div className={styles.authCard}>
          <div className={styles.logoContainer}>
             <div className={styles.logoIcon}>
               <Image src="/logo.png" alt="Logo" width={40} height={40} />
             </div>
             <span className={styles.logoText}>Чебоко</span>
          </div>

          <h2 className={styles.title}>Активация аккаунта</h2>
          <p className={styles.subtitle}>
            Вы приглашены как <strong>{role}</strong> ({email}). 
            Установите пароль и дополните данные профиля.
          </p>

          {success ? (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <ShieldCheck size={64} color="var(--status-low)" style={{ margin: "0 auto 16px" }} />
              <h3 style={{ color: "var(--status-low)", marginBottom: "10px" }}>Аккаунт успешно активирован!</h3>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                Теперь вы можете войти в систему под своим паролем.
              </p>
            </div>
          ) : (
            <form onSubmit={handleActivate}>
              {error && (
                <div style={{ padding: "12px", background: "#fee2e2", color: "#ef4444", borderRadius: "8px", marginBottom: "16px", fontSize: "14px" }}>
                  {error}
                </div>
              )}
              
              <div className={styles.formGroup}>
                <label className={styles.label}>ФИО</label>
                <div className={styles.inputWrapper}>
                  <User size={18} className={styles.inputIcon} />
                  <input 
                    name="name"
                    type="text" 
                    value={formData.name}
                    onChange={handleChange}
                    className={styles.input}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Номер телефона</label>
                <div className={styles.inputWrapper}>
                  <Phone size={18} className={styles.inputIcon} />
                  <input 
                    name="phone"
                    type="tel" 
                    value={formData.phone}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="+7 (___) ___-__-__"
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Установите пароль</label>
                <div className={styles.inputWrapper}>
                  <Lock size={18} className={styles.inputIcon} />
                  <input 
                    name="password"
                    type="password" 
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Минимум 8 символов"
                    className={styles.input}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Подтвердите пароль</label>
                <div className={styles.inputWrapper}>
                  <Lock size={18} className={styles.inputIcon} />
                  <input 
                    name="confirmPassword"
                    type="password" 
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={styles.input}
                    required
                  />
                </div>
              </div>

              <button type="submit" className={styles.btnSubmit} disabled={isLoading} style={{ marginTop: 20 }}>
                {isLoading ? "Активация..." : "Активировать аккаунт"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
