"use client";

import pageStyles from "@/app/(admin)/manager/page.module.css";
import clsx from "clsx";
import { Settings, Save, Bell, Shield, PaintBucket, Loader2, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTheme } from "@/lib/useTheme";


type SettingsData = {
  companyName: string;
  currency: string;
  autoAssign: string;
  emailReports: string;
  telegramEnabled: string;
  timezone: string;
  workHoursStart: string;
  workHoursEnd: string;
};

export default function SettingsPage() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === 'ADMIN';
  const [activeTab, setActiveTab] = useState("general");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<SettingsData>({
    companyName: "",
    currency: "RUB",
    autoAssign: "true",
    emailReports: "true",
    telegramEnabled: "true",
    timezone: "Europe/Moscow",
    workHoursStart: "09:00",
    workHoursEnd: "18:00",
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSettings({
        companyName: data.companyName || "ООО Чебоко Сервис",
        currency: data.currency || "RUB",
        autoAssign: data.autoAssign ?? "true",
        emailReports: data.emailReports ?? "true",
        telegramEnabled: data.telegramEnabled ?? "true",
        timezone: data.timezone || "Europe/Moscow",
        workHoursStart: data.workHoursStart || "09:00",
        workHoursEnd: data.workHoursEnd || "18:00",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });

      if (!res.ok) throw new Error("Не удалось сохранить");

      setMessage({ type: 'success', text: "Настройки успешно сохранены!" });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || "Ошибка сохранения" });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (key: keyof SettingsData, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [key]: String(value) }));
  };
  const { theme, setTheme } = useTheme();

  return (
    <div className={clsx("page-container", "animate-fade-in")}>
      <header className={pageStyles.header}>
        <div>
          <h1 className={pageStyles.title}>Настройки</h1>
          <p className={pageStyles.subtitle}>Глобальные настройки системы</p>
        </div>
        <div className={pageStyles.headerActions}>
          <button
            className={pageStyles.btnPrimary}
            onClick={handleSave}
            disabled={isSaving || isLoading}
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isSaving ? "Сохранение..." : "Сохранить изменения"}
          </button>
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

      <div className={pageStyles.flexLayout}>
        <div className={pageStyles.settingsNav}>
          <button
            className={pageStyles.btnSecondary}
            style={{
              justifyContent: "flex-start",
              opacity: activeTab === "general" ? 1 : 0.7,
              background: activeTab === "general" ? "var(--bg-hover)" : "transparent",
            }}
            onClick={() => setActiveTab("general")}
          >
            <Settings size={18} /> Общие
          </button>
          <button
            className={pageStyles.btnSecondary}
            style={{
              justifyContent: "flex-start",
              opacity: activeTab === "notifications" ? 1 : 0.7,
              background: activeTab === "notifications" ? "var(--bg-hover)" : "transparent",
            }}
            onClick={() => setActiveTab("notifications")}
          >
            <Bell size={18} /> Уведомления
          </button>
          <button
            className={pageStyles.btnSecondary}
            style={{
              justifyContent: "flex-start",
              opacity: activeTab === "security" ? 1 : 0.7,
              background: activeTab === "security" ? "var(--bg-hover)" : "transparent",
            }}
            onClick={() => setActiveTab("security")}
          >
            <Shield size={18} /> Безопасность
          </button>
          <button
            className={pageStyles.btnSecondary}
            style={{
              justifyContent: "flex-start",
              opacity: activeTab === "interface" ? 1 : 0.7,
              background: activeTab === "interface" ? "var(--bg-hover)" : "transparent",
            }}
            onClick={() => setActiveTab("interface")}
          >
            <PaintBucket size={18} /> Интерфейс
          </button>
        </div>

        <div className={pageStyles.card} style={{ flex: 3 }}>
          <div className={pageStyles.cardBody} style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* === ОБЩИЕ НАСТРОЙКИ === */}
            {activeTab === "general" && (
              <>
                <h2 style={{ fontSize: 18, fontWeight: 600, borderBottom: "1px solid var(--border-color)", paddingBottom: 16 }}>
                  Общие настройки платформы
                </h2>

                <div className={pageStyles.formGroup}>
                  <label className={pageStyles.formLabel}>Название компании</label>
                  <input
                    type="text"
                    value={settings.companyName}
                    onChange={(e) => updateSetting("companyName", e.target.value)}
                    className={pageStyles.formInput}
                    style={{ maxWidth: 400 }}
                  />
                </div>

                <div className={pageStyles.formGroup}>
                  <label className={pageStyles.formLabel}>Валюта по умолчанию</label>
                  <select
                    value={settings.currency}
                    onChange={(e) => updateSetting("currency", e.target.value)}
                    className={pageStyles.formInput}
                    style={{ maxWidth: 400 }}
                  >
                    <option value="RUB">Рубли (RUB)</option>
                    <option value="USD">Доллары (USD)</option>
                    <option value="EUR">Евро (EUR)</option>
                  </select>
                </div>

                <div className={pageStyles.grid1to1}>
                  <div className={pageStyles.formGroup}>
                    <label className={pageStyles.formLabel}>Начало рабочего дня</label>
                    <input
                      type="time"
                      value={settings.workHoursStart}
                      onChange={(e) => updateSetting("workHoursStart", e.target.value)}
                      className={pageStyles.formInput}
                    />
                  </div>
                  <div className={pageStyles.formGroup}>
                    <label className={pageStyles.formLabel}>Конец рабочего дня</label>
                    <input
                      type="time"
                      value={settings.workHoursEnd}
                      onChange={(e) => updateSetting("workHoursEnd", e.target.value)}
                      className={pageStyles.formInput}
                    />
                  </div>
                </div>

                <div className={pageStyles.formGroup}>
                  <label className={pageStyles.formLabel}>Часовой пояс</label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => updateSetting("timezone", e.target.value)}
                    className={pageStyles.formInput}
                    style={{ maxWidth: 400 }}
                  >
                    <option value="Europe/Moscow">Москва (UTC+3)</option>
                    <option value="Europe/Samara">Самара (UTC+4)</option>
                    <option value="Asia/Yekaterinburg">Екатеринбург (UTC+5)</option>
                    <option value="Asia/Omsk">Омск (UTC+6)</option>
                    <option value="Asia/Krasnoyarsk">Красноярск (UTC+7)</option>
                    <option value="Asia/Irkutsk">Иркутск (UTC+8)</option>
                    <option value="Asia/Yakutsk">Якутск (UTC+9)</option>
                    <option value="Asia/Vladivostok">Владивосток (UTC+10)</option>
                  </select>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
                  <input
                    type="checkbox"
                    id="auto_assign"
                    checked={settings.autoAssign === "true"}
                    onChange={(e) => updateSetting("autoAssign", e.target.checked)}
                    style={{ width: 16, height: 16 }}
                  />
                  <label htmlFor="auto_assign" style={{ fontSize: 14, userSelect: "none" }}>
                    Автоматически переназначать заявки (при отклонении инженером)
                  </label>
                </div>
              </>
            )}

            {/* === УВЕДОМЛЕНИЯ === */}
            {activeTab === "notifications" && (
              <>
                <h2 style={{ fontSize: 18, fontWeight: 600, borderBottom: "1px solid var(--border-color)", paddingBottom: 16 }}>
                  Настройки уведомлений
                </h2>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <input
                    type="checkbox"
                    id="email_notifs"
                    checked={settings.emailReports === "true"}
                    onChange={(e) => updateSetting("emailReports", e.target.checked)}
                    style={{ width: 16, height: 16 }}
                  />
                  <label htmlFor="email_notifs" style={{ fontSize: 14, userSelect: "none" }}>
                    Отправлять Email-отчеты в конце смены
                  </label>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
                  <input
                    type="checkbox"
                    id="telegram_bot"
                    checked={settings.telegramEnabled === "true"}
                    onChange={(e) => updateSetting("telegramEnabled", e.target.checked)}
                    style={{ width: 16, height: 16 }}
                  />
                  <label htmlFor="telegram_bot" style={{ fontSize: 14, userSelect: "none" }}>
                    Telegram-бот активен
                  </label>
                </div>

                <div style={{
                  padding: "16px",
                  background: "var(--bg-hover)",
                  borderRadius: "var(--radius-md)",
                  marginTop: 16,
                  fontSize: 13,
                  color: "var(--text-muted)",
                }}>
                  <strong>Telegram настроен!</strong><br/>
                  Бот готов отправлять уведомления о новых заявках и завершении работ.
                </div>
              </>
            )}

            {/* === БЕЗОПАСНОСТЬ === */}
            {activeTab === "security" && (
              <>
                <h2 style={{ fontSize: 18, fontWeight: 600, borderBottom: "1px solid var(--border-color)", paddingBottom: 16 }}>
                  Настройки безопасности
                </h2>

                {!isAdmin && (
                  <div style={{ padding: "16px", background: "var(--bg-hover)", borderRadius: "var(--radius-md)", marginBottom: 16 }}>
                    <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 8 }}>
                      🔒 Для изменения настроек безопасности обратитесь к главному администратору.
                    </p>
                  </div>
                )}

                <div className={pageStyles.formGroup}>
                  <label className={pageStyles.formLabel}>Сессия (дней)</label>
                  <input type="text" value="30" disabled={!isAdmin} className={pageStyles.formInput} style={{ maxWidth: 200 }} />
                </div>


                <div className={pageStyles.formGroup}>
                  <label className={pageStyles.formLabel}>Политика паролей</label>
                  <input type="text" value="Минимум 8 символов" disabled className={pageStyles.formInput} style={{ maxWidth: 200 }} />
                </div>
              </>
            )}

            {/* === ИНТЕРФЕЙС === */}
            {activeTab === "interface" && (
              <>
                <h2 style={{ fontSize: 18, fontWeight: 600, borderBottom: "1px solid var(--border-color)", paddingBottom: 16 }}>
                  Настройки интерфейса
                </h2>

                <div style={{ padding: "16px", background: "var(--bg-hover)", borderRadius: "var(--radius-md)", marginBottom: 16 }}>
                  <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                    🎨 Настройте внешний вид платформы под свои предпочтения. Изменения применяются мгновенно.
                  </p>
                </div>

                <div className={pageStyles.formGroup}>
                  <label className={pageStyles.formLabel}>Тема оформления</label>
                  <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                    <button 
                      onClick={() => setTheme('light')}
                      className={pageStyles.btnSecondary}
                      style={{ 
                        flex: 1, 
                        justifyContent: "center",
                        border: theme === 'light' ? "2px solid var(--accent-primary)" : "1px solid var(--border-color)",
                        background: theme === 'light' ? "var(--accent-glow)" : "transparent"
                      }}
                    >
                      <Sun size={18} /> Светлая
                    </button>
                    <button 
                      onClick={() => setTheme('dark')}
                      className={pageStyles.btnSecondary}
                      style={{ 
                        flex: 1, 
                        justifyContent: "center",
                        border: theme === 'dark' ? "2px solid var(--accent-primary)" : "1px solid var(--border-color)",
                        background: theme === 'dark' ? "var(--accent-glow)" : "transparent"
                      }}
                    >
                      <Moon size={18} /> Тёмная
                    </button>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
