"use client";

import { useState, useEffect } from "react";
import pageStyles from "@/app/page.module.css";
import { Plus, Search, Shield, Wrench, User, Mail, Phone, MoreVertical, Loader2, X } from "lucide-react";
import clsx from "clsx";

export default function TeamPage() {
  const [search, setSearch] = useState("");
  const [team, setTeam] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "ENGINEER",
    phone: "",
    region: "",
  });

  const fetchTeam = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setTeam(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create");
      }
      
      setIsModalOpen(false);
      setNewUser({ name: "", email: "", role: "ENGINEER", phone: "", region: "" });
      fetchTeam();
      alert("Сотрудник успешно добавлен! Пароль по умолчанию: 12345678");
    } catch (err: any) {
      alert("Ошибка: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleIcon = (role: string) => {
    if (role === "ADMIN") return <Shield size={16} color="var(--accent-primary)" />;
    if (role === "ENGINEER") return <Wrench size={16} color="var(--status-medium)" />;
    if (role === "OPERATOR") return <User size={16} color="var(--status-success)" />;
    return <User size={16} color="var(--text-muted)" />;
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Администратор';
      case 'OPERATOR': return 'Оператор';
      case 'ENGINEER': return 'Инженер';
      case 'CLIENT_MANAGER': return 'Клиент';
      default: return role;
    }
  };

  const filteredTeam = team.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    getRoleText(u.role).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={clsx("page-container", "animate-fade-in")}>
      <header className={pageStyles.header}>
        <div>
          <h1 className={pageStyles.title}>Сотрудники</h1>
          <p className={pageStyles.subtitle}>Управление доступом, ролями и учетными записями команды</p>
        </div>
        <div className={pageStyles.headerActions}>
          <button className={pageStyles.btnPrimary} onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Пригласить сотрудника
          </button>
        </div>
      </header>

      <div style={{ marginBottom: 24, display: "flex", gap: 16 }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 400 }}>
          <Search size={18} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input 
            type="text" 
            placeholder="Поиск по имени или роли..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={pageStyles.formInput}
            style={{ paddingLeft: 36 }}
          />
        </div>
      </div>

      <div className={pageStyles.card}>
        <div className={pageStyles.tableContainer}>
          <table className={pageStyles.table}>
            <thead>
              <tr>
                <th>Сотрудник</th>
                <th>Роль</th>
                <th>Контакты</th>
                <th>Статус</th>
                <th style={{ width: 80 }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <Loader2 size={20} className="animate-spin" /> Загрузка команды...
                    </div>
                  </td>
                </tr>
              ) : filteredTeam.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div className={pageStyles.engineerAvatar}>
                        {user.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{user.name} {user.region ? `(${user.region})` : ""}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>ID: {user.id.substring(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {getRoleIcon(user.role)}
                      {getRoleText(user.role)}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Mail size={12} color="var(--text-muted)" /> {user.email}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Phone size={12} color="var(--text-muted)" /> {user.phone || "—"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={clsx(pageStyles.badge, pageStyles.completed)}><div className={pageStyles.dot} /> Активен</span>
                  </td>
                  <td>
                    <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && filteredTeam.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    Сотрудники не найдены
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Модальное окно приглашения */}
      {isModalOpen && (
        <div className={pageStyles.modalOverlay}>
          <div className={pageStyles.modalContent}>
            <div className={pageStyles.modalHeader}>
              <h2>Добавление сотрудника</h2>
              <button className={pageStyles.closeBtn} onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleInviteUser}>
              <div className={pageStyles.modalBody}>
                <div className={pageStyles.formGroup}>
                  <label className={pageStyles.formLabel}>ФИО сотрудника</label>
                  <input 
                    type="text" 
                    placeholder="Напр: Петр Петров"
                    className={pageStyles.formInput}
                    value={newUser.name}
                    onChange={e => setNewUser({...newUser, name: e.target.value})}
                    required
                  />
                </div>
                <div className={pageStyles.formGroup}>
                  <label className={pageStyles.formLabel}>Email (для логина)</label>
                  <input 
                    type="email" 
                    placeholder="example@cheboko.ru"
                    className={pageStyles.formInput}
                    value={newUser.email}
                    onChange={e => setNewUser({...newUser, email: e.target.value})}
                    required
                  />
                </div>
                <div className={pageStyles.grid1to1}>
                  <div className={pageStyles.formGroup}>
                    <label className={pageStyles.formLabel}>Роль в системе</label>
                    <select 
                      className={pageStyles.select}
                      value={newUser.role}
                      onChange={e => setNewUser({...newUser, role: e.target.value})}
                    >
                      <option value="ENGINEER">Инженер</option>
                      <option value="OPERATOR">Оператор</option>
                      <option value="ADMIN">Администратор</option>
                      <option value="CLIENT_MANAGER">Клиент (директор/менеджер)</option>
                    </select>
                  </div>
                  <div className={pageStyles.formGroup}>
                    <label className={pageStyles.formLabel}>Район/Регион</label>
                    <input 
                      type="text" 
                      placeholder="Напр: Приморский"
                      className={pageStyles.formInput}
                      value={newUser.region}
                      onChange={e => setNewUser({...newUser, region: e.target.value})}
                    />
                  </div>
                </div>
                <div className={pageStyles.formGroup}>
                  <label className={pageStyles.formLabel}>Телефон</label>
                  <input 
                    type="tel" 
                    placeholder="+7 (___) ___-__-__"
                    className={pageStyles.formInput}
                    value={newUser.phone}
                    onChange={e => setNewUser({...newUser, phone: e.target.value})}
                  />
                </div>
              </div>
              <div className={pageStyles.modalFooter}>
                <button type="button" className={pageStyles.btnSecondary} onClick={() => setIsModalOpen(false)}>Отмена</button>
                <button type="submit" className={pageStyles.btnPrimary} disabled={isSubmitting}>
                  {isSubmitting ? "Сохранение..." : "Добавить в команду"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

