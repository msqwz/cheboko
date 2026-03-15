"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import pageStyles from "@/app/(manager)/manager/page.module.css";
import clsx from "clsx";

type AnalyticsData = {
    total: number;
    totalThisMonth: number;
    completed: number;
    completedThisMonth: number;
    openCount: number;
    highPriorityCount: number;
    equipmentOnRepair: number;
    activeEquipment: number;
    totalEquipment: number;
    avgClosingHours: number | null;
    minClosingHours: number | null;
    maxClosingHours: number | null;
    downtimeHours: number;
    engineerVisits: number;
    engineerVisitsThisMonth: number;
    statusBreakdown: Record<string, number>;
    priorityBreakdown: Record<string, number>;
    monthlyData: { month: string; created: number; completed: number }[];
    avgClosingTimeStr: string;
};

const STATUS_LABELS: Record<string, string> = {
    CREATED: "Создана", OPENED: "Открыта", ASSIGNED: "Назначен",
    ENROUTE: "В пути", IN_WORK: "В работе", ON_HOLD: "Пауза",
    COMPLETED: "Выполнена", CANCELED: "Отменена", REJECTED: "Отклонена",
};

function MetricCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
    return (
        <div className={pageStyles.statCard} style={{ minWidth: 160, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <div className={pageStyles.statInfo}>
                <span className={pageStyles.statLabel}>{label}</span>
                <span className={clsx(pageStyles.statValue, accent && pageStyles.accentText)}>
                    {value ?? "—"}
                </span>
                {sub && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{sub}</div>}
            </div>
        </div>
    );
}


export default function AnalyticsPage() {
    const { data: session } = useSession();
    const role = session?.user?.role;

    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [locations, setLocations] = useState<any[]>([]);
    const [equipment, setEquipment] = useState<any[]>([]);
    const [regions, setRegions] = useState<string[]>([]);

    const [filterFrom, setFilterFrom] = useState("");
    const [filterTo, setFilterTo] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterAddress, setFilterAddress] = useState("");
    const [filterEquipment, setFilterEquipment] = useState("");
    const [filterRegion, setFilterRegion] = useState("");

    const fetchAnalytics = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterFrom) params.set("from", filterFrom);
            if (filterTo) params.set("to", filterTo);
            if (filterStatus !== "all") params.set("status", filterStatus);
            if (filterAddress) params.set("address", filterAddress);
            if (filterEquipment) params.set("equipment", filterEquipment);
            if (filterRegion) params.set("region", filterRegion);

            const res = await fetch(`/api/analytics?${params}`);
            const json = await res.json();
            setData(json);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, [filterFrom, filterTo, filterStatus, filterAddress, filterEquipment, filterRegion]);

    useEffect(() => {
        Promise.all([fetch("/api/locations"), fetch("/api/equipment")]).then(async ([lr, er]) => {
            const locs = await lr.json();
            const eqs = await er.json();
            setLocations(Array.isArray(locs) ? locs : []);
            setEquipment(Array.isArray(eqs) ? eqs : []);
            const uniqueRegions = [...new Set((Array.isArray(locs) ? locs : []).map((l: any) => l.region).filter(Boolean))] as string[];
            setRegions(uniqueRegions);
        });
    }, []);

    const isAdmin = role === "ADMIN" || role === "REGIONAL_MANAGER";
    const isClient = role === "CLIENT_NETWORK_HEAD" || role === "CLIENT_POINT_MANAGER";

    if (!isAdmin && !isClient) {
        return (
            <div className="page-container">
                <div className={pageStyles.card} style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
                    Аналитика недоступна для вашей роли
                </div>
            </div>
        );
    }

    return (
        <div className={clsx("page-container", "animate-fade-in")}>
            <header className={pageStyles.header}>
                <div>
                    <h1 className={pageStyles.title}>Аналитика</h1>
                    <p className={pageStyles.subtitle}>
                        {isAdmin ? "Статистика по заявкам и оборудованию" : "Статистика по вашим точкам"}
                    </p>
                </div>
            </header>

            {/* Фильтры */}
            <div className={pageStyles.card} style={{ padding: "16px 20px", marginBottom: 24 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
                    <div>
                        <label className={pageStyles.formLabel}>Период с</label>
                        <input type="date" className={pageStyles.formInput} value={filterFrom}
                            onChange={e => setFilterFrom(e.target.value)} style={{ width: 150 }} />
                    </div>
                    <div>
                        <label className={pageStyles.formLabel}>по</label>
                        <input type="date" className={pageStyles.formInput} value={filterTo}
                            onChange={e => setFilterTo(e.target.value)} style={{ width: 150 }} />
                    </div>
                    <div>
                        <label className={pageStyles.formLabel}>Статус</label>
                        <select className={pageStyles.formInput} value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)} style={{ width: 160 }}>
                            <option value="all">Все статусы</option>
                            {Object.entries(STATUS_LABELS).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                            ))}
                        </select>
                    </div>
                    {role === "ADMIN" && regions.length > 0 && (
                        <div>
                            <label className={pageStyles.formLabel}>Регион</label>
                            <select className={pageStyles.formInput} value={filterRegion}
                                onChange={e => setFilterRegion(e.target.value)} style={{ width: 160 }}>
                                <option value="">Все регионы</option>
                                {regions.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                    )}
                    {(isAdmin || role === "CLIENT_NETWORK_HEAD") && (
                        <div>
                            <label className={pageStyles.formLabel}>Адрес</label>
                            <select className={pageStyles.formInput} value={filterAddress}
                                onChange={e => setFilterAddress(e.target.value)} style={{ width: 200 }}>
                                <option value="">Все адреса</option>
                                {locations.map((l: any) => (
                                    <option key={l.id} value={l.id}>{l.name || l.address}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div>
                        <label className={pageStyles.formLabel}>Оборудование</label>
                        <select className={pageStyles.formInput} value={filterEquipment}
                            onChange={e => setFilterEquipment(e.target.value)} style={{ width: 180 }}>
                            <option value="">Всё оборудование</option>
                            {equipment.map((eq: any) => (
                                <option key={eq.id} value={eq.id}>{eq.model || eq.name}</option>
                            ))}
                        </select>
                    </div>
                    {(filterFrom || filterTo || filterStatus !== "all" || filterAddress || filterEquipment || filterRegion) && (
                        <button className={pageStyles.btnSecondary} onClick={() => {
                            setFilterFrom(""); setFilterTo(""); setFilterStatus("all");
                            setFilterAddress(""); setFilterEquipment(""); setFilterRegion("");
                        }}>
                            Сбросить
                        </button>
                    )}
                </div>
            </div>

            {isLoading ? (
                <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>Загрузка...</div>
            ) : !data ? (
                <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>Нет данных</div>
            ) : (
                <>
                    {/* Метрики заявок */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
                        <MetricCard label="Всего заявок" value={data.total} sub={`${data.totalThisMonth} за этот месяц`} />
                        <MetricCard label="Выполнено" value={data.completed} sub={`${data.completedThisMonth} за этот месяц`} accent />
                        <MetricCard label="Открытых сейчас" value={data.openCount} />
                        <MetricCard label="Высокий приоритет" value={data.highPriorityCount} accent={data.highPriorityCount > 0} />
                        <MetricCard label="Выездов инженера" value={data.engineerVisits} sub={`${data.engineerVisitsThisMonth} за этот месяц`} />
                    </div>

                    {/* Метрики оборудования (только для admin/manager) */}
                    {isAdmin && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
                            <MetricCard label="Всего оборудования" value={data.totalEquipment} />
                            <MetricCard label="На ремонте" value={data.equipmentOnRepair} accent={data.equipmentOnRepair > 0} />
                            <MetricCard label="Активное" value={data.activeEquipment} />
                            <MetricCard label="Часов простоя" value={data.downtimeHours || "—"} />
                        </div>
                    )}

                    {/* Время выполнения */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
                        <MetricCard label="Среднее время (ч)" value={data.avgClosingHours ?? "—"} sub="от Открыта до Выполнена" />
                        {isAdmin && <>
                            <MetricCard label="Минимальное время (ч)" value={data.minClosingHours ?? "—"} />
                            <MetricCard label="Максимальное время (ч)" value={data.maxClosingHours ?? "—"} />
                        </>}
                    </div>

                    {/* Разбивка по статусам */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                        <div className={pageStyles.card} style={{ padding: "20px 24px" }}>
                            <div style={{ fontWeight: 600, marginBottom: 16 }}>По статусам</div>
                            {Object.entries(data.statusBreakdown).length === 0 ? (
                                <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Нет данных</div>
                            ) : Object.entries(data.statusBreakdown)
                                .sort((a, b) => b[1] - a[1])
                                .map(([status, count]) => {
                                    const pct = data.total > 0 ? Math.round((count / data.total) * 100) : 0;
                                    return (
                                        <div key={status} style={{ marginBottom: 10 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                                                <span>{STATUS_LABELS[status] || status}</span>
                                                <span style={{ fontWeight: 600 }}>{count} ({pct}%)</span>
                                            </div>
                                            <div style={{ height: 6, borderRadius: 3, background: "var(--bg-secondary)" }}>
                                                <div style={{ height: "100%", borderRadius: 3, width: `${pct}%`, background: "var(--accent-primary)", transition: "width 0.3s" }} />
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>

                        <div className={pageStyles.card} style={{ padding: "20px 24px" }}>
                            <div style={{ fontWeight: 600, marginBottom: 16 }}>По приоритетам</div>
                            {[
                                { key: "HIGH", label: "Высокий", color: "var(--status-high)" },
                                { key: "MEDIUM", label: "Средний", color: "var(--status-medium, #f59e0b)" },
                                { key: "LOW", label: "Низкий", color: "var(--status-success)" },
                            ].map(({ key, label, color }) => {
                                const count = data.priorityBreakdown[key] || 0;
                                const pct = data.total > 0 ? Math.round((count / data.total) * 100) : 0;
                                return (
                                    <div key={key} style={{ marginBottom: 10 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                                            <span>{label}</span>
                                            <span style={{ fontWeight: 600 }}>{count} ({pct}%)</span>
                                        </div>
                                        <div style={{ height: 6, borderRadius: 3, background: "var(--bg-secondary)" }}>
                                            <div style={{ height: "100%", borderRadius: 3, width: `${pct}%`, background: color, transition: "width 0.3s" }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Динамика по месяцам */}
                    <div className={pageStyles.card} style={{ padding: "20px 24px", marginBottom: 24 }}>
                        <div style={{ fontWeight: 600, marginBottom: 16 }}>Динамика за 6 месяцев</div>
                        <div style={{ overflowX: "auto" }}>
                            <table className={pageStyles.table}>
                                <thead>
                                    <tr>
                                        <th>Месяц</th>
                                        <th>Создано</th>
                                        <th>Выполнено</th>
                                        <th>Выполнение %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.monthlyData.map(m => (
                                        <tr key={m.month}>
                                            <td>{m.month}</td>
                                            <td>{m.created}</td>
                                            <td>{m.completed}</td>
                                            <td>{m.created > 0 ? `${Math.round((m.completed / m.created) * 100)}%` : "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

