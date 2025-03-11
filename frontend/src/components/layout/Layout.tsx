import { ReactNode, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Show sidebar on all routes except home and connect
  const isPublicRoute = ['/connect', '/'].includes(location.pathname);
  const showSidebar = !isPublicRoute;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900 grid-background relative">
      {/* Decorative glowing orbs */}
      <div className="glow-orb glow-orb-blue w-96 h-96 top-0 right-0"></div>
      <div className="glow-orb glow-orb-purple w-96 h-96 bottom-0 left-0"></div>
      <div className="glow-orb glow-orb-orange w-64 h-64 top-1/2 left-1/3 -translate-y-1/2"></div>
      
      {/* Sidebar */}
      {showSidebar && (
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />
      )}
      
      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden relative z-10">
        {/* Header */}
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
          showMenuButton={showSidebar}
        />
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 