"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, User, Phone, LogIn, CheckCircle, Shield, ShieldCheck, ArrowRight } from "lucide-react";
import styles from "../login/login.module.css"; // Reuse login styles
import clsx from "clsx";
import { validatePassword } from "@/lib/passwordValidator";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<"register" | "verify">("register");
  const [verificationCode, setVerificationCode] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "OPERATOR",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [debugCode, setDebugCode] = useState("");

  const handleResendForEmail = async (email: string) => {
    setIsLoading(true);
    setError(""); // Сбрасываем старую ошибку
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Ошибка запроса кода");
      }
      if (data.debugCode) {
        setDebugCode(data.debugCode);
      }
    } catch (e: any) {
      setError(e.message);
      console.error("Auto-resend failed:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const emailParam = searchParams.get("email");
    const stepParam = searchParams.get("step");
    
    if (emailParam) {
      setFormData(prev => ({ ...prev, email: emailParam }));
    }
    
    if (stepParam === "verify") {
      setStep("verify");
      if (emailParam) {
        handleResendForEmail(emailParam);
      }
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Введите корректный e-mail");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    const passwordCheck = validatePassword(formData.password);
    if (!passwordCheck.isValid) {
      setError(passwordCheck.message);
      return;
    }

    if (!formData.agreeToTerms) {
      setError("Необходимо согласие на обработку персональных данных");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ошибка при регистрации");
      }

      if (data.debugCode) {
        setDebugCode(data.debugCode);
      }
      setStep("verify");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (formData.email) {
      handleResendForEmail(formData.email);
    } else {
      setError("Email не найден");
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (verificationCode.length !== 6) {
      setError("Код должен состоять из 6 цифр");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, code: verificationCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ошибка верификации");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login?verified=true");
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className={clsx(styles.container, "flex items-center justify-center")}>
        <div className={styles.authCard} style={{ textAlign: "center", maxWidth: 450 }}>
          <ShieldCheck size={64} color="var(--status-low)" style={{ margin: "0 auto 20px" }} />
          <h2 className={styles.title}>Email подтвержден!</h2>
          <p className={styles.subtitle}>
            Ваш аккаунт активирован. Мы перенаправляем вас на страницу входа...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx(styles.container, "animate-fade-in")}>
      <div className={styles.gradientBlob1} />
      <div className={styles.gradientBlob2} />

      <div className={styles.leftSidebar}>
        <div className={styles.sidebarBg} />
        <div className={styles.sidebarContent}>
          <div className={styles.logoContainer} style={{ justifyContent: "flex-start", marginBottom: 60 }}>
            <div className={styles.logoIcon}>
              <Image src="/logo.png" alt="Logo" width={40} height={40} />
            </div>
            <span className={styles.logoText} style={{ color: "white" }}>Чебоко</span>
          </div>
          <h1 className={styles.sidebarTitle}>Присоединяйтесь к нам</h1>
          <p className={styles.sidebarText}>
            Создайте аккаунт, чтобы управлять обслуживанием оборудования и отслеживать заявки в реальном времени.
          </p>
        </div>
      </div>

      <div className={styles.rightContent}>
        <div className={styles.authCard} style={{ maxWidth: 500 }}>
          <div className={styles.logoContainer}>
             <div className={styles.logoIcon}>
               <Image src="/logo.png" alt="Logo" width={60} height={60} />
             </div>
             <span className={styles.logoText}>Чебоко</span>
          </div>

          {step === "register" ? (
            <>
              <h2 className={styles.title}>Регистрация</h2>
              <p className={styles.subtitle}>Заполните данные для создания аккаунта</p>

              <form onSubmit={handleRegister}>
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
                      placeholder="Иванов Иван Иванович"
                      className={styles.input}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Электронная почта</label>
                  <div className={styles.inputWrapper}>
                    <Mail size={18} className={styles.inputIcon} />
                    <input 
                      name="email"
                      type="email" 
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="example@mail.ru"
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
                      placeholder="+7 (___) ___-__-__"
                      className={styles.input}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Ваша роль в системе</label>
                  <div className={styles.inputWrapper}>
                    <Shield size={18} className={styles.inputIcon} />
                    <select 
                      name="role"
                      value={formData.role}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                      className={styles.input}
                      required
                      style={{ appearance: "none", width: "100%", background: "transparent", border: "none" }}
                    >
                      <option value="OPERATOR">Оператор</option>
                      <option value="REGIONAL_MANAGER">Менеджер региона</option>
                      <option value="CLIENT_NETWORK_HEAD">Клиент. Руководитель сети</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Пароль</label>
                  <div className={styles.inputWrapper}>
                    <Lock size={18} className={styles.inputIcon} />
                    <input 
                      name="password"
                      type="password" 
                      value={formData.password}
                      onChange={handleChange}
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
                      name="confirmPassword"
                      type="password" 
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={styles.input}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup} style={{ flexDirection: "row", alignItems: "flex-start", gap: "10px", marginTop: "10px" }}>
                  <input 
                    name="agreeToTerms"
                    type="checkbox" 
                    id="terms"
                    checked={formData.agreeToTerms}
                    onChange={handleChange}
                    style={{ marginTop: "4px" }}
                  />
                  <label htmlFor="terms" style={{ fontSize: "13px", color: "var(--text-secondary)", cursor: "pointer" }}>
                    Согласие на обработку персональных данных (Пользовательское соглашение)
                  </label>
                </div>

                <button type="submit" className={styles.btnSubmit} disabled={isLoading} style={{ marginTop: "20px" }}>
                  <LogIn size={20} style={{ marginRight: 8 }} />
                  {isLoading ? "Регистрация..." : "Зарегистрироваться"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className={styles.title}>Подтверждение Email</h2>
              <p className={styles.subtitle}>
                Мы отправили 6-значный код на <strong>{formData.email}</strong>. 
                Введите его ниже для активации аккаунта.
              </p>

              <form onSubmit={handleVerify}>
                {error && (
                  <div style={{ padding: "12px", background: "#fee2e2", color: "#ef4444", borderRadius: "8px", marginBottom: "16px", fontSize: "14px" }}>
                    {error}
                  </div>
                )}
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>Код подтверждения</label>
                  <div className={styles.inputWrapper}>
                    <Mail size={18} className={styles.inputIcon} />
                    <input 
                      type="text" 
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="123456"
                      className={styles.input}
                      style={{ letterSpacing: "8px", textAlign: "center", fontSize: "20px", fontWeight: "bold" }}
                      required
                    />
                  </div>
                  {debugCode && (
                    <p style={{ marginTop: "8px", fontSize: "14px", color: "var(--accent-primary)", textAlign: "center", fontWeight: "bold" }}>
                      Временный код для теста: {debugCode}
                    </p>
                  )}
                </div>

                <button type="submit" className={styles.btnSubmit} disabled={isLoading || verificationCode.length !== 6} style={{ marginTop: "20px" }}>
                  {isLoading ? "Проверка..." : "Подтвердить Email"}
                  {!isLoading && <ArrowRight size={20} style={{ marginLeft: 8 }} />}
                </button>
              </form>

              <div className={styles.bottomLink}>
                Не получили код?
                <button 
                  onClick={handleResend}
                  style={{ background: "none", border: "none", color: "var(--accent-primary)", cursor: "pointer", padding: 0, marginLeft: "5px", fontSize: "inherit", fontWeight: "inherit" }}
                >
                  Отправить еще раз
                </button>
              </div>
            </>
          )}

          <div className={styles.bottomLink}>
            {step === "register" ? (
              <>
                Уже есть аккаунт? <Link href="/login">Войти</Link>
              </>
            ) : (
              <button 
                onClick={() => setStep("register")}
                style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "inherit" }}
              >
                ← Вернуться к регистрации
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
