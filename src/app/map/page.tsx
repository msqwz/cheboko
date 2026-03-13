"use client";

import { useState, useEffect, useRef } from "react";
import { Users, MapPin, Search, Navigation, Loader2 } from "lucide-react";
import styles from "./map.module.css";
import clsx from "clsx";

// Объявляем тип для YMaps
declare global {
  interface Window {
    ymaps: any;
  }
}

export default function TechnicianMap() {
  const [data, setData] = useState<any>({ engineers: [], locations: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [ymapsLoaded, setYmapsLoaded] = useState(false);
  const [selectedEngineer, setSelectedEngineer] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/map");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to fetch map data", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Загрузка Яндекс.Карт
  useEffect(() => {
    if (typeof window === 'undefined' || window.ymaps) {
      setYmapsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://api-maps.yandex.ru/2.1/?apikey=e1a186ee-6741-4e3f-b7f4-438ed8c61c4b&lang=ru_RU';
    script.async = true;
    script.onload = () => setYmapsLoaded(true);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // Инициализация карты
  useEffect(() => {
    if (!ymapsLoaded || !mapContainerRef.current || data.engineers.length === 0) return;

    window.ymaps.ready(() => {
      const map = new window.ymaps.Map(mapContainerRef.current, {
        center: [47.2357, 39.7015], // Ростов-на-Дону
        zoom: 10,
        controls: ['zoomControl', 'searchControl', 'fullscreenControl']
      });

      mapRef.current = map;

      // Добавляем метки инженеров
      data.engineers.forEach((eng: any) => {
        if (eng.lat && eng.lng) {
          const placemark = new window.ymaps.Placemark([eng.lat, eng.lng], {
            balloonContentHeader: `<b>${eng.name}</b>`,
            balloonContentBody: `
              <div style="padding: 10px;">
                <p>Район: ${eng.region || "Не указан"}</p>
                <p>Статус: На линии</p>
                <p>Активных заявок: ${eng.assignedTickets?.length || 0}</p>
              </div>
            `,
            balloonContentFooter: eng.email
          }, {
            preset: 'islands#blueAutoIcon',
          });
          
          placemark.events.add('click', () => {
            setSelectedEngineer(eng);
          });
          
          map.geoObjects.add(placemark);
        }
      });

      // Добавляем метки локаций
      data.locations.forEach((loc: any) => {
        if (loc.lat && loc.lng) {
          const placemark = new window.ymaps.Placemark([loc.lat, loc.lng], {
            balloonContentHeader: `<b>${loc.legalName || "Точка"}</b>`,
            balloonContentBody: `<p>${loc.address}</p>`,
          }, {
            preset: 'islands#greenAutoIcon'
          });
          map.geoObjects.add(placemark);
        }
      });
    });
  }, [ymapsLoaded, data]);

  const filteredEngineers = data.engineers.filter((eng: any) =>
    eng.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    eng.region?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return (
    <div className="page-container" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
      <Loader2 size={32} className="animate-spin" color="var(--accent-primary)" />
    </div>
  );

  return (
    <div className={clsx("page-container", "animate-fade-in")}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Карта техников</h1>
        <p style={{ color: "var(--text-muted)", marginTop: 4 }}>Мониторинг местоположения инженеров в реальном времени (СПб)</p>
      </header>

      <div className={styles.mapContainer} style={{ display: "flex", gap: 24, height: "calc(100vh - 150px)" }}>
        {/* Карта Яндекс */}
        <div
          ref={mapContainerRef}
          style={{ flex: 1, borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--border-color)" }}
        />

        {/* Сайдбар списка инженеров */}
        <div className={styles.sidebar} style={{
          width: 320,
          background: "var(--bg-secondary)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}>
          <div style={{ padding: 16, borderBottom: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Users size={18} color="var(--accent-primary)" />
              <span style={{ fontWeight: 600 }}>Инженеры на линии ({filteredEngineers.length})</span>
            </div>
            <div style={{ position: "relative" }}>
              <Search size={16} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                placeholder="Поиск инженера..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 36px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-primary)",
                  fontSize: 14,
                }}
              />
            </div>
          </div>
          
          <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
            {filteredEngineers.map((eng: any) => (
              <div key={eng.id} style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px",
                borderRadius: "var(--radius-md)",
                marginBottom: 8,
                background: "var(--bg-hover)",
                transition: "all 0.2s",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--border-color)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
              >
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "var(--accent-glow)",
                  color: "var(--accent-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {eng.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{eng.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{eng.region || "—"}</div>
                </div>
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--status-success)",
                  flexShrink: 0,
                }} />
              </div>
            ))}
            {filteredEngineers.length === 0 && (
              <div style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>
                Инженеры не найдены
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
