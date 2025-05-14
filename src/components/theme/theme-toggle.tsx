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
    return <div className="w-9 h-9"></div>; // Placeholder with same size
  }

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary hover:bg-muted"
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </button>
  );
} 