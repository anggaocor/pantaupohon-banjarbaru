// src/app/(dashboard)/layout.tsx
import Sidebar from '@/src/components/layout/Sidebar';
import Header from '@/src/components/layout/Header';
import NotificationBell from '@/src/components/notifications/NotificationBell';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="lg:pl-64 min-h-screen flex flex-col">
        {/* Header dengan NotificationBell sebagai children */}
        <Header>
          <NotificationBell />
        </Header>
        
        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}