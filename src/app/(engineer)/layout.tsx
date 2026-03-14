import BottomNav from "@/components/layout/BottomNav";

export default function EngineerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-layout">
      <main className="main-content">
        <header style={{ 
          padding: '16px', 
          borderBottom: '1px solid var(--border-color)', 
          backgroundColor: 'var(--bg-primary)', 
          position: 'sticky', 
          top: 0, 
          zIndex: 10 
        }}>
          <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Чебоко: Инженер</h1>
        </header>
        <div className="page-container" style={{ paddingBottom: 'calc(var(--bottom-nav-height) + 20px)' }}>
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
