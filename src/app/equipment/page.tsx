"use client";

import { useState, useEffect } from "react";
import pageStyles from "@/app/page.module.css";
import { Plus, Search, Trash2, Edit2, Loader2, X, Save, MapPin, Wrench } from "lucide-react";
import clsx from "clsx";

type Equipment = {
  id: string;
  serialNumber: string;
  model: string;
  type: string;
  nextMaintenance: string | null;
  locationId: string;
  location?: { address: string; legalName?: string };
};

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);
  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({
    serialNumber: "",
    model: "",
    type: "Суперавтомат",
    nextMaintenance: "",
    locationId: "",
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [eqRes, locRes] = await Promise.all([
        fetch("/api/equipment"),
        fetch("/api/locations")
      ]);

      const eqData = await eqRes.json();
      const locData = await locRes.json();

      setEquipment(eqData);
      setLocations(locData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editingItem 
        ? `/api/equipment?id=${editingItem.id}`
        : "/api/equipment";
      
      const method = editingItem ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          id: editingItem?.id,
          nextMaintenance: formData.nextMaintenance || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save");
      }


      setIsModalOpen(false);
      setEditingItem(null);
      setFormData({
        serialNumber: "",
        model: "",
        type: "Суперавтомат",
        nextMaintenance: "",
        locationId: "",
      });
      fetchData();
    } catch (err: any) {
      alert("Ошибка: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item: Equipment) => {
    setEditingItem(item);
    setFormData({
      serialNumber: item.serialNumber,
      model: item.model,
      type: item.type,
      nextMaintenance: item.nextMaintenance ? new Date(item.nextMaintenance).toISOString().split('T')[0] : "",
      locationId: item.locationId,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Удалить это оборудование?")) return;

    
    try {
      const res = await fetch(`/api/equipment?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete");
      }
      fetchData();
    } catch (err: any) {
      alert("Ошибка: " + err.message);
    }

  };

  const filteredEquipment = equipment.filter(eq =>
    eq.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
    eq.model.toLowerCase().includes(search.toLowerCase()) ||
    eq.location?.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={clsx("page-container", "animate-fade-in")}>
      <header className={pageStyles.header}>
        <div>
          <h1 className={pageStyles.title}>Оборудование</h1>
          <p className={pageStyles.subtitle}>Управление кофейными аппаратами и техникой</p>
        </div>
        <div className={pageStyles.headerActions}>
          <button className={pageStyles.btnPrimary} onClick={() => {
            setEditingItem(null);
            setFormData({ serialNumber: "", model: "", type: "Суперавтомат", nextMaintenance: "", locationId: "" });
            setIsModalOpen(true);
          }}>
            <Plus size={18} /> Добавить оборудование
          </button>
        </div>
      </header>

      <div style={{ marginBottom: 24, display: "flex", gap: 16 }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 400 }}>
          <Search size={18} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            placeholder="Поиск по модели или серийному номеру..."
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
                <th>Модель</th>
                <th>Серийный номер</th>
                <th>Тип</th>
                <th>Локация</th>
                <th>След. ТО</th>
                <th style={{ width: 120 }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <Loader2 size={20} className="animate-spin" /> Загрузка...
                    </div>
                  </td>
                </tr>
              ) : filteredEquipment.map((eq) => (
                <tr key={eq.id}>
                  <td>
                    <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                      <Wrench size={16} color="var(--accent-primary)" />
                      {eq.model}
                    </div>
                  </td>
                  <td style={{ fontFamily: "monospace", fontSize: 13 }}>{eq.serialNumber}</td>
                  <td>
                    <span className={clsx(pageStyles.badge, pageStyles.completed)}>
                      <div className={pageStyles.dot} /> {eq.type}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: 13 }}>
                      <div style={{ fontWeight: 500 }}>{eq.location?.legalName || eq.location?.address}</div>
                      <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{eq.location?.address}</div>
                    </div>
                  </td>
                  <td>
                    {eq.nextMaintenance ? (
                      <span style={{ color: new Date(eq.nextMaintenance) < new Date() ? "var(--status-high)" : "var(--status-success)", fontWeight: 600 }}>
                        {new Date(eq.nextMaintenance).toLocaleDateString("ru-RU")}
                      </span>
                    ) : "—"}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => {
                          const url = `${window.location.origin}/tickets/new?equipmentId=${eq.id}`;
                          window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`, '_blank');
                        }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-primary)", padding: 4 }}
                        title="QR-код для заявки"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16h.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/></svg>
                      </button>
                      <button
                        onClick={() => handleEdit(eq)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent-primary)", padding: 4 }}
                        title="Редактировать"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(eq.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--status-high)", padding: 4 }}
                        title="Удалить"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                  </td>
                </tr>
              ))}
              {!isLoading && filteredEquipment.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    Оборудование не найдено
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Модальное окно */}
      {isModalOpen && (
        <div className={pageStyles.modalOverlay}>
          <div className={pageStyles.modalContent}>
            <div className={pageStyles.modalHeader}>
              <h2>{editingItem ? "Редактировать оборудование" : "Новое оборудование"}</h2>
              <button className={pageStyles.closeBtn} onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className={pageStyles.modalBody}>
                <div className={pageStyles.grid1to1}>
                  <div className={pageStyles.formGroup}>
                    <label className={pageStyles.formLabel}>Модель *</label>
                    <input
                      type="text"
                      placeholder="Напр: WMF 1500 S"
                      className={pageStyles.formInput}
                      value={formData.model}
                      onChange={(e) => setFormData({...formData, model: e.target.value})}
                      required
                    />
                  </div>
                  <div className={pageStyles.formGroup}>
                    <label className={pageStyles.formLabel}>Серийный номер *</label>
                    <input
                      type="text"
                      placeholder="S/N"
                      className={pageStyles.formInput}
                      value={formData.serialNumber}
                      onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className={pageStyles.grid1to1}>
                  <div className={pageStyles.formGroup}>
                    <label className={pageStyles.formLabel}>Тип</label>
                    <select
                      className={pageStyles.formInput}
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="Суперавтомат">Суперавтомат</option>
                      <option value="Рожковая">Рожковая</option>
                      <option value="Капельная">Капельная</option>
                      <option value="Другое">Другое</option>
                    </select>
                  </div>
                  <div className={pageStyles.formGroup}>
                    <label className={pageStyles.formLabel}>Следующее ТО</label>
                    <input
                      type="date"
                      className={pageStyles.formInput}
                      value={formData.nextMaintenance}
                      onChange={(e) => setFormData({...formData, nextMaintenance: e.target.value})}
                    />
                  </div>
                </div>

                <div className={pageStyles.formGroup}>
                  <label className={pageStyles.formLabel}>Локация *</label>
                  <select
                    className={pageStyles.formInput}
                    value={formData.locationId}
                    onChange={(e) => setFormData({...formData, locationId: e.target.value})}
                    required
                  >
                    <option value="">Выберите локацию...</option>
                    {locations.map((loc: any) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.legalName || loc.address} - {loc.address}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={pageStyles.modalFooter}>
                <button type="button" className={pageStyles.btnSecondary} onClick={() => setIsModalOpen(false)}>
                  Отмена
                </button>
                <button type="submit" className={pageStyles.btnPrimary} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {isSubmitting ? "Сохранение..." : "Сохранить"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
