"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "../providers/theme-provider";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only show the toggle when component is mounted on client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything during SSR or when hydrating
  if (!mounted) {
    return <div className="w-4 h-4"></div>; // Placeholder with same size as other icons
  }

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="flex items-center gap-1 text-sm px-2 py-1 rounded-md bg-muted text-muted-foreground hover:bg-muted/80"
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <Moon className="w-4 h-4" />
      ) : (
        <Sun className="w-4 h-4" />
      )}
    </button>
  );
} 