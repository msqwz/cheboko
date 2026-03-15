"use client";

import { useState, useEffect } from "react";
import pageStyles from "@/app/(admin)/admin/page.module.css";
import { Plus, Search, Shield, Wrench, User, Mail, Phone, MoreVertical, Loader2, X, Edit2, Trash2 } from "lucide-react";
import clsx from "clsx";
import { useSession } from "next-auth/react";

import { ROLE_HIERARCHY, getRoleText } from "@/lib/roles";

export default function TeamPage() {
  const { data: session } = useSession();
  const currentUserRole = session?.user?.role as string;
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
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm("Удалить этого сотрудника?")) return;
    try {
      const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      fetchTeam();
    } catch (err: any) {
      alert("Ошибка: " + err.message);
    }
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingUser.id,
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role,
          phone: editingUser.phone,
          region: editingUser.address, // API uses address for region
        }),
      });

      if (!res.ok) throw new Error("Failed to update");
      setIsEditModalOpen(false);
      fetchTeam();
    } catch (err: any) {
      alert("Ошибка: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [inviteLink, setInviteLink] = useState("");
  const availableRoles = ROLE_HIERARCHY[currentUserRole] || [];

  useEffect(() => {
    if (availableRoles.length > 0 && !availableRoles.includes(newUser.role)) {
      setNewUser(prev => ({ ...prev, role: availableRoles[0] }));
    }
  }, [availableRoles, newUser.role]);

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setInviteLink("");
    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.details || "Не удалось создать приглашение");
      }
      
      setInviteLink(data.inviteLink);
      setNewUser({ name: "", email: "", role: "ENGINEER", phone: "", region: "" });
      fetchTeam();
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
                        <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{user.name} {user.address ? `(${user.address})` : ""}</div>
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
                    {user.isVerified ? (
                      <span className={clsx(pageStyles.badge, pageStyles.completed)}><div className={pageStyles.dot} /> Активен</span>
                    ) : (
                      <span className={clsx(pageStyles.badge, pageStyles.onHold)}><div className={pageStyles.dot} /> Ожидает верификации</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button 
                        onClick={() => handleEditUser(user)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent-primary)" }}
                        title="Редактировать"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--status-high)" }}
                        title="Удалить"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
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
                      {availableRoles.map(role => (
                        <option key={role} value={role}>{getRoleText(role)}</option>
                      ))}
                      {currentUserRole === 'ADMIN' && <option value="ADMIN">Администратор</option>}
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
                {inviteLink ? (
                  <div style={{ width: "100%", textAlign: "left" }}>
                    <div style={{ marginBottom: 12, padding: 12, background: "var(--status-success-bg)", border: "1px solid var(--status-success)", borderRadius: 8, fontSize: 13 }}>
                      <strong>Ссылка для регистрации:</strong><br />
                      <code style={{ wordBreak: "break-all" }}>{inviteLink}</code>
                      <button 
                        type="button"
                        onClick={() => { navigator.clipboard.writeText(inviteLink); alert("Скопировано!"); }}
                        style={{ marginTop: 8, display: "block", color: "var(--primary)", border: "none", background: "none", padding: 0, fontWeight: 600, cursor: "pointer" }}
                      >
                        Копировать ссылку
                      </button>
                    </div>
                    <button type="button" className={pageStyles.btnSecondary} style={{ width: "100%" }} onClick={() => { setIsModalOpen(false); setInviteLink(""); }}>Закрыть</button>
                  </div>
                ) : (
                  <>
                    <button type="button" className={pageStyles.btnSecondary} onClick={() => setIsModalOpen(false)}>Отмена</button>
                    <button type="submit" className={pageStyles.btnPrimary} disabled={isSubmitting}>
                      {isSubmitting ? "Генерация..." : "Создать приглашение"}
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования */}
      {isEditModalOpen && editingUser && (
        <div className={pageStyles.modalOverlay}>
          <div className={pageStyles.modalContent}>
            <div className={pageStyles.modalHeader}>
              <h2>Редактирование сотрудника</h2>
              <button className={pageStyles.closeBtn} onClick={() => setIsEditModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateUser}>
              <div className={pageStyles.modalBody}>
                <div className={pageStyles.formGroup}>
                  <label className={pageStyles.formLabel}>ФИО сотрудника</label>
                  <input 
                    type="text" 
                    className={pageStyles.formInput}
                    value={editingUser.name}
                    onChange={e => setEditingUser({...editingUser, name: e.target.value})}
                    required
                  />
                </div>
                <div className={pageStyles.formGroup}>
                  <label className={pageStyles.formLabel}>Email</label>
                  <input 
                    type="email" 
                    className={pageStyles.formInput}
                    value={editingUser.email}
                    onChange={e => setEditingUser({...editingUser, email: e.target.value})}
                    required
                  />
                </div>
                <div className={pageStyles.grid1to1}>
                  <div className={pageStyles.formGroup}>
                    <label className={pageStyles.formLabel}>Роль</label>
                    <select 
                      className={pageStyles.select}
                      value={editingUser.role}
                      onChange={e => setEditingUser({...editingUser, role: e.target.value})}
                    >
                      {/* Allow keeping existing role if user is admin, or show hierarchy */}
                      {currentUserRole === 'ADMIN' ? (
                        <>
                          <option value="ADMIN">Администратор</option>
                          <option value="OPERATOR">Оператор</option>
                          <option value="REGIONAL_MANAGER">Менеджер региона</option>
                          <option value="CLIENT_NETWORK_HEAD">Клиент. Руководитель сети</option>
                          <option value="ENGINEER">Инженер</option>
                          <option value="CLIENT_POINT_MANAGER">Управляющий</option>
                          <option value="CLIENT_SPECIALIST">Специалист</option>
                        </>
                      ) : (
                        availableRoles.map(role => (
                          <option key={role} value={role}>{getRoleText(role)}</option>
                        ))
                      )}
                    </select>
                  </div>
                  <div className={pageStyles.formGroup}>
                    <label className={pageStyles.formLabel}>Район/Регион</label>
                    <input 
                      type="text" 
                      className={pageStyles.formInput}
                      value={editingUser.address || ""}
                      onChange={e => setEditingUser({...editingUser, address: e.target.value})}
                    />
                  </div>
                </div>
                <div className={pageStyles.formGroup}>
                  <label className={pageStyles.formLabel}>Телефон</label>
                  <input 
                    type="tel" 
                    className={pageStyles.formInput}
                    value={editingUser.phone || ""}
                    onChange={e => setEditingUser({...editingUser, phone: e.target.value})}
                  />
                </div>
              </div>
              <div className={pageStyles.modalFooter}>
                <button type="button" className={pageStyles.btnSecondary} onClick={() => setIsEditModalOpen(false)}>Отмена</button>
                <button type="submit" className={pageStyles.btnPrimary} disabled={isSubmitting}>
                  {isSubmitting ? "Сохранение..." : "Сохранить изменения"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


