import Sidebar from "@/components/layout/Sidebar";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="client-layout" style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Для клиента тоже можно использовать Sidebar, но с ограниченными пунктами */}
      <Sidebar /> 
      <main className="main-content" style={{ flex: 1, padding: '20px' }}>
        {children}
      </main>
    </div>
  );
}
