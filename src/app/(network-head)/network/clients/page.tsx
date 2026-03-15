"use client";

import { useState, useEffect } from "react";
import pageStyles from "@/app/(network-head)/network/page.module.css";
import { Plus, Search, MapPin, Coffee, MoreVertical, Edit2, Loader2, X, Trash2 } from "lucide-react";

import clsx from "clsx";
import { getRoleText } from "@/lib/roles";

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [locations, setLocations] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingItem, setEditingItem] = useState<any>(null);
  const [newLocation, setNewLocation] = useState({
    legalName: "",
    address: "",
    managerId: "",
  });


  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [locRes, userRes] = await Promise.all([
        fetch("/api/locations"),
        fetch("/api/users")
      ]);
      
      const locData = await locRes.json();
      const userData = await userRes.json();
      
      setLocations(Array.isArray(locData) ? locData : []);
      setManagers(Array.isArray(userData) ? userData.filter((u: any) => u.role?.startsWith('CLIENT_')) : []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Автозаполнение менеджера при выборе существующей организации
  useEffect(() => {
    if (!editingItem && newLocation.legalName) {
      const match = locations.find(l => (l.legalName || l.name) === newLocation.legalName);
      if (match && match.clientId) {
        setNewLocation(prev => ({ ...prev, managerId: match.clientId }));
      }
    }
  }, [newLocation.legalName, locations, editingItem]);

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocation.managerId) {
      alert("Необходимо выбрать менеджера (Клиента)");
      return;
    }
    setIsSubmitting(true);
    try {
      const url = editingItem ? `/api/locations` : "/api/locations";
      const method = editingItem ? "PATCH" : "POST";
      
      const payload = editingItem 
        ? { ...newLocation, id: editingItem.id }
        : newLocation;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {

        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save");
      }

      
      setIsModalOpen(false);
      setEditingItem(null);
      setNewLocation({ legalName: "", address: "", managerId: "" });
      fetchData();
    } catch (err: any) {
      alert("Ошибка: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (loc: any) => {
    setEditingItem(loc);
    setNewLocation({
      legalName: loc.legalName || loc.name || "",
      address: loc.address || "",
      managerId: loc.clientId || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Удалить эту точку? Все связанные кофемашины и заявки будут удалены!")) return;

    
    try {
      const res = await fetch(`/api/locations?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete");
      }
      setLocations(locations.filter(l => l.id !== id));
    } catch (err: any) {
      alert("Ошибка: " + err.message);
    }

  };


  const filteredClients = locations.filter(c => 
    (c.legalName?.toLowerCase() || "").includes(search.toLowerCase()) || 
    (c.address?.toLowerCase() || "").includes(search.toLowerCase())
  );

  return (
    <div className={clsx("page-container", "animate-fade-in")}>
      <header className={pageStyles.header}>
        <div>
          <h1 className={pageStyles.title}>Клиенты</h1>
          <p className={pageStyles.subtitle}>Управление базой клиентов, локациями и кофемашинами</p>
        </div>
        <div className={pageStyles.headerActions}>
          <button className={pageStyles.btnPrimary} onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Добавить точку/клиента
          </button>
        </div>
      </header>

      <div style={{ marginBottom: 24, display: "flex", gap: 16 }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 400 }}>
          <Search size={18} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input 
            type="text" 
            placeholder="Поиск по названию или адресу..." 
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
                <th>Организация (Точка)</th>
                <th>Адрес</th>
                <th>Менеджер</th>
                <th>Статус</th>
                <th style={{ width: 80 }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <Loader2 size={20} className="animate-spin" /> Загрузка объектов...
                    </div>
                  </td>
                </tr>
              ) : [...filteredClients]
                  .sort((a, b) => (a.legalName || a.name || "").localeCompare(b.legalName || b.name || ""))
                  .map((loc, index, array) => {
                    const orgName = loc.legalName || loc.name || "Объект без названия";
                    const isFirstInOrg = index === 0 || (array[index - 1].legalName || array[index - 1].name) !== (loc.legalName || loc.name);
                    
                    return (
                      <tr key={loc.id} style={{ borderTop: isFirstInOrg && index !== 0 ? "2px solid var(--border-color)" : undefined }}>
                        <td>
                          {isFirstInOrg ? (
                            <>
                              <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "15px" }}>{orgName}</div>
                              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>ID: {loc.clientId.substring(0, 8)}...</div>
                            </>
                          ) : (
                            <div style={{ color: "var(--text-muted)", paddingLeft: 12, fontSize: 12 }}>— продолжение —</div>
                          )}
                        </td>
                        <td style={{ paddingLeft: isFirstInOrg ? undefined : 24 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <MapPin size={14} color={isFirstInOrg ? "var(--text-muted)" : "var(--accent-primary)"} />
                            <span style={{ fontWeight: isFirstInOrg ? 500 : 400 }}>{loc.address}</span>
                          </div>
                          {!isFirstInOrg && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>ID точки: {loc.id.substring(0, 8)}...</div>}
                        </td>
                        <td>
                          {isFirstInOrg ? (
                            <>
                              <div>{managers.find(m => m.id === loc.managerId)?.name || "—"}</div>
                              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{managers.find(m => m.id === loc.managerId)?.phone}</div>
                            </>
                          ) : (
                            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Тот же менеджер</div>
                          )}
                        </td>
                        <td>
                          <span className={clsx(pageStyles.badge, pageStyles.completed)}><div className={pageStyles.dot} /> Активен</span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button 
                              onClick={() => handleEdit(loc)}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent-primary)" }}
                              title="Редактировать"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={(e) => handleDelete(loc.id, e)}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--status-high)" }}
                              title="Удалить"
                            >
                              <Trash2 size={16} />
                            </button>
                            <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                              <MoreVertical size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              {!isLoading && filteredClients.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    Клиенты не найдены
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Модальное окно создания */}
      {isModalOpen && (
        <div className={pageStyles.modalOverlay}>
          <div className={pageStyles.modalContent}>
            <div className={pageStyles.modalHeader}>
              <h2>{editingItem ? "Редактировать точку" : "Новая точка / Клиент"}</h2>
              <button className={pageStyles.closeBtn} onClick={() => {
                setIsModalOpen(false);
                setEditingItem(null);
                setNewLocation({ legalName: "", address: "", managerId: "" });
              }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveLocation}>

              <div className={pageStyles.modalBody}>
                <div className={pageStyles.formGroup}>
                  <label className={pageStyles.formLabel}>Название организации</label>
                  <input 
                    type="text" 
                    list="orgNames"
                    placeholder="Напр: ООО Кофе Лайф"
                    className={pageStyles.formInput}
                    value={newLocation.legalName}
                    onChange={e => setNewLocation({...newLocation, legalName: e.target.value})}
                    required
                  />
                  <datalist id="orgNames">
                    {Array.from(new Set(locations.map(l => l.legalName || l.name))).filter(Boolean).map(name => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                </div>
                <div className={pageStyles.formGroup}>
                  <label className={pageStyles.formLabel}>Адрес (СПБ)</label>
                  <input 
                    type="text" 
                    placeholder="Напр: Невский проспект, 1"
                    className={pageStyles.formInput}
                    value={newLocation.address}
                    onChange={e => setNewLocation({...newLocation, address: e.target.value})}
                    required
                  />
                </div>
                <div className={pageStyles.formGroup}>
                  <label className={pageStyles.formLabel}>Назначить менеджера (Клиент)</label>
                  <select 
                    className={pageStyles.select}
                    value={newLocation.managerId}
                    onChange={e => setNewLocation({...newLocation, managerId: e.target.value})}
                  >
                    <option value="">Без менеджера</option>
                    {managers.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={pageStyles.modalFooter}>
                <button type="button" className={pageStyles.btnSecondary} onClick={() => {
                  setIsModalOpen(false);
                  setEditingItem(null);
                  setNewLocation({ legalName: "", address: "", managerId: "" });
                }}>Отмена</button>
                <button type="submit" className={pageStyles.btnPrimary} disabled={isSubmitting}>
                  {isSubmitting ? "Сохранение..." : (editingItem ? "Сохранить изменения" : "Создать точку")}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}


