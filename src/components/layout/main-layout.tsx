"use client";

import { ReactNode } from "react";
import { ChatControls } from "../chat/chat-controls";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen h-[100dvh] w-full overflow-hidden">
      {/* Main content */}
      <main className="flex-1 container mx-auto p-4 overflow-hidden">
        <ChatControls />
        {children}
      </main>
    </div>
  );
} 