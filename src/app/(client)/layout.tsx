import Sidebar from "@/components/layout/Sidebar";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-container" style={{ paddingBottom: 'calc(var(--bottom-nav-height) + 20px)' }}>
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
