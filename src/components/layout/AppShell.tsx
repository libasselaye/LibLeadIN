'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import AppFooter from './AppFooter';
import { Menu } from 'lucide-react';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-[#0a0a14]/90 backdrop-blur-xl border-b border-white/[0.06] flex items-center px-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 -ml-1 rounded-lg hover:bg-white/[0.06] text-white/60 hover:text-white transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="ml-3 text-lg font-bold bg-gradient-to-r from-blue-400 to-blue-400 bg-clip-text text-transparent">
          LibLeadIN
        </span>
      </div>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen pt-14 lg:pt-0 p-4 sm:p-6 lg:p-8 flex flex-col">
        <div className="flex-1">{children}</div>
        <AppFooter />
      </main>
    </div>
  );
}
