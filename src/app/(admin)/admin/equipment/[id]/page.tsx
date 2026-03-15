import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import pageStyles from "@/app/(admin)/admin/page.module.css";
import { Wrench, Calendar, MapPin, Tag, Clock, ArrowLeft, History } from "lucide-react";
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

export default async function EquipmentDetailPage({ params }: { params: { id: string } }) {
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

  // 2. Получаем историю заявок по этому оборудованию
  const { data: tickets, error: ticketsError } = await supabase
    .from('Ticket')
    .select('*, engineer:User!engineerId(name)')
    .eq('equipmentId', id)
    .order('createdAt', { ascending: false });

  return (
    <div className={clsx("page-container", "animate-fade-in")}>
      <header className={pageStyles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/admin/equipment" className={pageStyles.btnSecondary} style={{ padding: "8px" }}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className={pageStyles.title}>{equipment.name}</h1>
            <p className={pageStyles.subtitle}>Детальная информация и история ремонтов</p>
          </div>
        </div>
      </header>

      <div className={pageStyles.grid1to2}>
        {/* Левая колонка - Спецификации */}
        <section className={pageStyles.card}>
          <div className={pageStyles.cardBody}>
            <div className={pageStyles.sectionTitle}>Характеристики</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Tag size={20} color="var(--text-muted)" />
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>S/N</div>
                  <div style={{ fontWeight: 600 }}>{equipment.serialNumber}</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Tag size={20} color="var(--text-muted)" />
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Тип</div>
                  <div>{equipment.type || "—"}</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <MapPin size={20} color="var(--text-muted)" />
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Локация</div>
                  <div style={{ fontWeight: 500 }}>{equipment.location?.name || equipment.location?.address}</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Calendar size={20} color="var(--text-muted)" />
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Плановое ТО</div>
                  <div style={{ 
                    fontWeight: 600, 
                    color: equipment.nextMaintenance && new Date(equipment.nextMaintenance) < new Date() ? "var(--status-high)" : "var(--status-success)" 
                  }}>
                    {equipment.nextMaintenance ? new Date(equipment.nextMaintenance).toLocaleDateString("ru-RU") : "Не назначено"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Правая колонка - История заявок */}
        <section className={pageStyles.card}>
          <div className={pageStyles.cardBody}>
            <div className={pageStyles.sectionTitle}>
              <History size={18} style={{ marginRight: 8 }} /> История обслуживания
            </div>
            
            {(!tickets || tickets.length === 0) ? (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                Нет истории заявок для этого оборудования
              </div>
            ) : (
              <div className={pageStyles.tableContainer}>
                <table className={pageStyles.table}>
                  <thead>
                    <tr>
                      <th>Дата</th>
                      <th>Номер</th>
                      <th>Описание</th>
                      <th>Инженер</th>
                      <th>Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((ticket) => (
                      <tr key={ticket.id}>
                        <td style={{ fontSize: 12 }}>
                          {new Date(ticket.createdAt).toLocaleDateString("ru-RU")}
                        </td>
                        <td>
                          <Link href={`/admin/tickets/${ticket.id}`} style={{ fontWeight: 600, color: "var(--accent-primary)" }}>
                            #{ticket.ticketNumber.slice(-4)}
                          </Link>
                        </td>
                        <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {ticket.description}
                        </td>
                        <td>{ticket.engineer?.name || "—"}</td>
                        <td>{getStatusBadge(ticket.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
