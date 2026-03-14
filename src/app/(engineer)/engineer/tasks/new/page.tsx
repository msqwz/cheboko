"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera, AlertCircle, ArrowLeft, Send, MapPin, X, Loader2 } from "lucide-react";
import styles from "@/app/(client)/tickets/new/newTicket.module.css";
import clsx from "clsx";
import Image from "next/image";

export default function EngineerNewTicketPage() {
  const router = useRouter();
  
  const [locations, setLocations] = useState<any[]>([]);
  const [filteredEquipments, setFilteredEquipments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Фото
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    locationId: "",
    equipmentId: "",
    problemType: "TECHNICAL",
    description: "",
  });

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await fetch("/api/locations");
        const data = await res.json();
        setLocations(data);
      } catch (err) {
        console.error("Failed to fetch locations:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLocations();
  }, []);


  const handleLocationChange = (locId: string) => {
    setFormData({ ...formData, locationId: locId, equipmentId: "" });
    const loc = locations.find(l => l.id === locId);
    setFilteredEquipments(loc?.equipments || []);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 3 - photoFiles.length;
    const toAdd = files.slice(0, remaining);

    const newPreviews = toAdd.map(f => URL.createObjectURL(f));
    setPhotoFiles(prev => [...prev, ...toAdd]);
    setPhotoPreviews(prev => [...prev, ...newPreviews]);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photoPreviews[index]);
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.locationId) {
      alert("Пожалуйста, выберите торговую точку");
      return;
    }
    
    setIsSubmitting(true);
    try {
      let photoUrls: string[] = [];
      if (photoFiles.length > 0) {
        setIsUploading(true);
        const uploadForm = new FormData();
        photoFiles.forEach(f => uploadForm.append("files", f));
        const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadForm });
        if (!uploadRes.ok) throw new Error("Ошибка загрузки фото");
        const uploadData = await uploadRes.json();
        photoUrls = uploadData.urls;
        setIsUploading(false);
      }

      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, attachments: photoUrls }),
      });
      
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Не удалось создать заявку");
      
      alert(`Заявка успешно создана! Номер: ${resData.ticketNumber}`);
      router.push("/engineer/tasks");
      router.refresh();
    } catch (err: any) {
      alert("Ошибка создания заявки: " + err.message);
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  if (isLoading) return <div className="page-container">Загрузка данных...</div>;

  return (
    <div className={clsx("page-container", styles.container, "animate-fade-in")}>
      <button 
        onClick={() => router.back()} 
        style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px", fontSize: "14px", fontWeight: 500, background: "none", border: "none", cursor: "pointer" }}
      >
        <ArrowLeft size={16} /> Назад
      </button>

      <div className={styles.header}>
        <h1 className={styles.title}>Создать заявку (Инженер)</h1>
        <p className={styles.subtitle}>Опишите проблему, зафиксированную на точке.</p>
      </div>

      <form className={styles.formCard} onSubmit={handleSubmit}>
        
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <MapPin size={20} color="var(--accent-primary)" />
            Оборудование и Локация
          </h2>
          
          <div className={styles.grid2}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Торговая точка <span className={styles.required}>*</span></label>
              <select 
                className={styles.select} 
                required
                value={formData.locationId}
                onChange={e => handleLocationChange(e.target.value)}
              >
                <option value="">Выберите точку...</option>
                {locations.map(loc => (
                   <option key={loc.id} value={loc.id}>{loc.legalName || loc.address}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Оборудование</label>
              <select 
                className={styles.select}
                value={formData.equipmentId}
                onChange={e => setFormData({ ...formData, equipmentId: e.target.value })}
                disabled={!formData.locationId}
              >
                <option value="">Общая проблема на точке</option>
                {filteredEquipments.map(eq => (
                  <option key={eq.id} value={eq.id}>{eq.model} (S/N: {eq.serialNumber})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <AlertCircle size={20} color="var(--status-medium)" />
            Детали проблемы
          </h2>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Тип обращения <span className={styles.required}>*</span></label>
            <select 
              className={styles.select} 
              required
              value={formData.problemType}
              onChange={e => setFormData({ ...formData, problemType: e.target.value })}
            >
              <option value="TECHNICAL">Техническая поломка</option>
              <option value="RECIPE">Вкус / Рецепты</option>
              <option value="MAINTENANCE">Плановое ТО</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Описание <span className={styles.required}>*</span></label>
            <textarea 
              className={styles.textarea} 
              placeholder="Что именно произошло?"
              required
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <Camera size={20} color="var(--text-secondary)" />
            Фотографии
          </h2>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={handlePhotoSelect}
          />

          <div className={styles.photoUploader}>
            {photoPreviews.map((src, i) => (
              <div key={i} className={styles.photoUploadBox} style={{ position: "relative", padding: 0, overflow: "hidden" }}>
                <Image src={src} alt="Preview" fill style={{ objectFit: "cover" }} />
                <button type="button" onClick={() => removePhoto(i)} style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.5)", color: "#fff", border: "none", borderRadius: "50%", width: 22, height: 22 }}>×</button>
              </div>
            ))}
            {photoFiles.length < 3 && (
              <div className={styles.photoUploadBox} onClick={() => fileInputRef.current?.click()} style={{ cursor: "pointer" }}>
                <Camera size={24} />
                <span className={styles.photoText}>Добавить фото</span>
              </div>
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.btnCancel} onClick={() => router.back()} disabled={isSubmitting}>Отмена</button>
          <button type="submit" className={styles.btnSubmit} disabled={isSubmitting}>
             {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
             {isSubmitting ? "Отправка..." : "Создать"}
          </button>
        </div>
      </form>
    </div>
  );
}
