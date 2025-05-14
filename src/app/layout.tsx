import "@/app/globals.css";
import type { Metadata } from "next";
import { Providers } from "@/components/providers/providers";

export const metadata: Metadata = {
  title: "Smart Assistant Bot",
  description: "A chat interface for interacting with the OpenAI API",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
