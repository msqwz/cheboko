import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import pageStyles from "@/app/(admin)/admin/page.module.css";
import { Wrench, Calendar, MapPin, Tag, History, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "CREATED": return <span className={clsx(pageStyles.badge, pageStyles.created)}>Создана</span>;
    case "IN_WORK": return <span className={clsx(pageStyles.badge, pageStyles.inWork)}>В работе</span>;
    case "COMPLETED": return <span className={clsx(pageStyles.badge, pageStyles.completed)}>Выполнена</span>;
    default: return <span className={pageStyles.badge}>{status}</span>;
  }
};

export default async function EngineerEquipmentDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const { id } = params;

  // 1. Получаем данные оборудования
  const { data: equipment, error: eqError } = await supabase
    .from('Equipment')
    .select('*, location:Location!locationId(*)')
    .eq('id', id)
    .single();

  if (eqError || !equipment) {
    notFound();
  }

  // 2. Получаем историю заявок (ремонтов)
  const { data: tickets, error: ticketsError } = await supabase
    .from('Ticket')
    .select('*, engineer:User!engineerId(name), creator:User!creatorId(name)')
    .eq('equipmentId', id)
    .order('createdAt', { ascending: false });

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <Link href="/engineer/tasks" style={{ color: "var(--text-muted)" }}>
          <ArrowLeft size={20} />
        </Link>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Карточка оборудования</h1>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Информация об аппарате */}
        <section className={pageStyles.card}>
          <div className={pageStyles.cardBody}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px 0" }}>{equipment.name}</h2>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 13 }}>
                   <Tag size={14} /> S/N: {equipment.serialNumber}
                </div>
              </div>
              <div className={clsx(pageStyles.badge, pageStyles.completed)}>
                {equipment.type}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ background: "var(--bg-hover)", padding: 12, borderRadius: 12 }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Локация</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{equipment.location?.name || equipment.location?.address}</div>
              </div>
              <div style={{ background: "var(--bg-hover)", padding: 12, borderRadius: 12 }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Следующее ТО</div>
                <div style={{ 
                  fontSize: 13, 
                  fontWeight: 600,
                  color: equipment.nextMaintenance && new Date(equipment.nextMaintenance) < new Date() ? "var(--status-high)" : "var(--status-success)"
                }}>
                  {equipment.nextMaintenance ? new Date(equipment.nextMaintenance).toLocaleDateString("ru-RU") : "Не назначено"}
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
              <MapPin size={16} color="var(--accent-primary)" />
              {equipment.location?.address}
            </div>
          </div>
        </section>

        {/* Ссылка на создание заявки, если инженер нашел проблему сам */}
        <Link 
          href={`/tickets/new?equipmentId=${id}`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: 14,
            background: "var(--grad-primary)",
            color: "#fff",
            borderRadius: 12,
            textDecoration: "none",
            fontWeight: 600,
            boxShadow: "0 4px 12px var(--accent-glow)"
          }}
        >
          <Wrench size={18} /> Создать заявку на ремонт
        </Link>

        {/* История ремонтов */}
        <section className={pageStyles.card}>
          <div className={pageStyles.cardBody}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, fontWeight: 700 }}>
              <History size={18} color="var(--accent-primary)" />
              История обслуживания
            </div>

            {(!tickets || tickets.length === 0) ? (
              <div style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)", fontSize: 13 }}>
                История пуста
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {tickets.map(ticket => (
                  <div key={ticket.id} style={{ 
                    padding: 12, 
                    border: "1px solid var(--border-color)", 
                    borderRadius: 12,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: "var(--accent-primary)" }}>
                        #{ticket.ticketNumber.slice(-4)}
                      </span>
                      {getStatusBadge(ticket.status)}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-primary)" }}>{ticket.description}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                      <span>{new Date(ticket.createdAt).toLocaleDateString("ru-RU")}</span>
                      <span>Инженер: {ticket.engineer?.name || "—"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
