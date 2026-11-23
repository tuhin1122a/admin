"use client";
import React, { useState } from "react";
import Header from "./header";
import Menu from "./menu";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Header with mobile hamburger toggle */}
      <Header
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
      />

      {/* Sidebar - desktop static & mobile slide-out drawer */}
      <Menu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content - responsive margin on desktop, full width on mobile */}
      <main className="lg:pl-64 pl-0 pt-16 min-h-screen transition-all duration-300 w-full overflow-x-hidden">
        <div className="p-3 sm:p-4 md:p-6 max-w-full">{children}</div>
      </main>
    </div>
  );
};

export default AppLayout;
