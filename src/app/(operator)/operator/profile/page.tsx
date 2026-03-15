"use client";

import pageStyles from "@/app/(operator)/operator/page.module.css";
import clsx from "clsx";
import { User, Mail, Phone, MapPin, KeyRound, LogOut, Save, Loader2 } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: session?.user?.name || "",
    phone: session?.user?.phone || "",
    region: session?.user?.region || "",

  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const getRoleText = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Администратор';
      case 'OPERATOR': return 'Оператор';
      case 'ENGINEER': return 'Инженер';
      case 'CLIENT_MANAGER': return 'Клиент (Менеджер)';
      default: return role;
    }
  };

  const initials = session?.user?.name
    ? session.user.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
    : "??";

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      if (!res.ok) throw new Error("Не удалось сохранить");

      const updated = await res.json();
      await updateSession();
      setMessage({ type: 'success', text: "Профиль успешно обновлён!" });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || "Ошибка сохранения" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: "Пароли не совпадают" });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: "Пароль должен быть не менее 8 символов" });
      return;
    }

    setIsChangingPassword(true);
    setMessage(null);
    try {
      const res = await fetch("/api/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");

      setMessage({ type: 'success', text: "Пароль успешно изменён!" });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className={clsx("page-container", "animate-fade-in")}>
      <header className={pageStyles.header}>
        <div>
          <h1 className={pageStyles.title}>Мой профиль</h1>
          <p className={pageStyles.subtitle}>Управление учетной записью и безопасностью</p>
        </div>
      </header>

      {message && (
        <div style={{
          padding: "12px 16px",
          borderRadius: "var(--radius-md)",
          marginBottom: 24,
          background: message.type === 'success' ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
          color: message.type === 'success' ? "var(--status-success)" : "var(--status-high)",
          fontSize: 14,
          fontWeight: 500,
        }}>
          {message.text}
        </div>
      )}

      <div className={pageStyles.grid1to2}>

        {/* Карточка профиля */}
        <div className={pageStyles.card}>
          <div className={pageStyles.cardBody} style={{ display: "flex", flexDirection: "column", alignItems: "center", borderBottom: "1px solid var(--border-color)" }}>
            <div style={{ width: 96, height: 96, borderRadius: "50%", background: "var(--accent-glow)", color: "var(--accent-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 700, marginBottom: 16 }}>
              {initials}
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--text-primary)" }}>{session?.user?.name || "Загрузка..."}</h2>
            <p style={{ fontSize: 14, color: "var(--accent-primary)", fontWeight: 500, marginTop: 4 }}>
              {getRoleText(session?.user?.role || "")}
            </p>
          </div>
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", gap: 12, color: "var(--text-muted)", fontSize: 14 }}>
              <Mail size={16} /> {session?.user?.email || "—"}
            </div>
            <div style={{ display: "flex", gap: 12, color: "var(--text-muted)", fontSize: 14 }}>
              <Phone size={16} /> {session?.user?.phone || "Нет телефона"}

            </div>
            <div style={{ display: "flex", gap: 12, color: "var(--text-muted)", fontSize: 14 }}>
              <MapPin size={16} /> Санкт-Петербург, РФ
            </div>
          </div>
        </div>

        {/* Формы редактирования */}
        <div className={pageStyles.card}>
          <div className={pageStyles.cardBody} style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>Основная информация</h3>

              <div className={pageStyles.grid1to1}>
                <div className={pageStyles.formGroup}>
                  <label className={pageStyles.formLabel}>Имя и фамилия</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className={pageStyles.formInput}
                  />
                </div>
                <div className={pageStyles.formGroup}>
                  <label className={pageStyles.formLabel}>Должность</label>
                  <input
                    type="text"
                    value={getRoleText(session?.user?.role || "")}
                    disabled
                    className={pageStyles.formInput}
                  />
                </div>
              </div>

              <div className={pageStyles.grid1to1}>
                <div className={pageStyles.formGroup}>
                  <label className={pageStyles.formLabel}>Email</label>
                  <input
                    type="email"
                    value={session?.user?.email || ""}
                    disabled
                    className={pageStyles.formInput}
                  />
                </div>
                <div className={pageStyles.formGroup}>
                  <label className={pageStyles.formLabel}>Телефон</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className={pageStyles.formInput}
                    placeholder="+7 (___) ___-__-__"
                  />
                </div>
              </div>

              <div className={pageStyles.formGroup}>
                <label className={pageStyles.formLabel}>Регион / Район</label>
                <input
                  type="text"
                  value={profileData.region}
                  onChange={(e) => setProfileData({ ...profileData, region: e.target.value })}
                  className={pageStyles.formInput}
                  placeholder="Напр: Приморский"
                />
              </div>

              <div>
                <button
                  className={pageStyles.btnPrimary}
                  style={{ marginTop: 8 }}
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {isSaving ? "Сохранение..." : "Сохранить изменения"}
                </button>
              </div>
            </section>

            <section style={{ display: "flex", flexDirection: "column", gap: 16, borderTop: "1px solid var(--border-color)", paddingTop: 32 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                <KeyRound size={20} color="var(--status-medium)" />
                Безопасность
              </h3>

              <div className={pageStyles.grid1to1}>
                <div className={pageStyles.formGroup}>
                  <label className={pageStyles.formLabel}>Текущий пароль</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className={pageStyles.formInput}
                    placeholder="••••••••"
                  />
                </div>
                <div className={pageStyles.formGroup}>
                  <label className={pageStyles.formLabel}>Новый пароль</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className={pageStyles.formInput}
                    placeholder="Минимум 8 символов"
                  />
                </div>
              </div>

              <div className={pageStyles.formGroup}>
                <label className={pageStyles.formLabel}>Повторите новый пароль</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className={pageStyles.formInput}
                  placeholder="••••••••"
                />
              </div>

              <div>
                <button
                  className={pageStyles.btnSecondary}
                  style={{ marginTop: 8 }}
                  onClick={handleChangePassword}
                  disabled={isChangingPassword || !passwordData.currentPassword || !passwordData.newPassword}
                >
                  {isChangingPassword ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                  {isChangingPassword ? "Изменение..." : "Обновить пароль"}
                </button>
              </div>
            </section>

            <section style={{ borderTop: "1px solid var(--border-color)", paddingTop: 32, marginTop: 'auto' }}>
              <button
                onClick={() => signOut()}
                className={pageStyles.btnSecondary}
                style={{ color: "var(--status-high)", background: "rgba(239, 68, 68, 0.1)" }}
              >
                <LogOut size={16} />
                Выйти из аккаунта
              </button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}



