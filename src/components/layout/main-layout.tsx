"use client";

import { ReactNode } from "react";
import { ChatControls } from "../chat/chat-controls";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Main content */}
      <main className="flex-1 container mx-auto p-4">
        <ChatControls />
        {children}
      </main>
    </div>
  );
} 