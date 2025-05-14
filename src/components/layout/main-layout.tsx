"use client";

import { ReactNode } from "react";
import { ThemeToggle } from "../theme/theme-toggle";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background p-4 shadow-sm">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-lg font-semibold">Smart Assistant Bot</h1>
          <ThemeToggle />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto p-4">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-background p-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Smart Assistant Bot</p>
        </div>
      </footer>
    </div>
  );
} 