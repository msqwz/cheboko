import BottomNav from "@/components/layout/BottomNav";

export default function EngineerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="engineer-layout" style={{ minHeight: '100vh', paddingBottom: '70px' }}>
      <header style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', position: 'sticky', top: 0, zIndex: 10 }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Чебоко: Инженер</h1>
      </header>
      <main style={{ padding: '16px' }}>
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
