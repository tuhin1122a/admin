"use client";
import React from "react";
import Header from "./header";
import Menu from "./menu";

interface AppLayoutProps {
  children: React.ReactNode;
}
const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className={`min-h-screen bg-gray-950 text-gray-100`}>
      {/* Header */}
      <Header />
      {/* Sidebar */}
      <Menu />

      {/* Main Content */}
      <main className="pl-64 pt-16  min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
};

export default AppLayout;
