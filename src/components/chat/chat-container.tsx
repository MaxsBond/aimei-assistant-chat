"use client";

import { useEffect, useRef } from "react";
import { Message } from "@/lib/store";
import { MessageItem } from "./message-item";

interface ChatContainerProps {
  messages: Message[];
  isLoading?: boolean;
}

export function ChatContainer({ messages, isLoading = false }: ChatContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(true);
  const lastMessageCountRef = useRef(0);

  // Detect if user has scrolled up manually
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Check if user is near the bottom
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      shouldScrollRef.current = isNearBottom;
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll to the bottom when new messages arrive, but only if we were already at the bottom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Only auto-scroll when a new message is added (not on initial render)
    const messageCountChanged = messages.length !== lastMessageCountRef.current;
    lastMessageCountRef.current = messages.length;

    if (messageCountChanged && shouldScrollRef.current) {
      // Scroll to bottom with smooth animation
      setTimeout(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [messages]);

  // Scroll to bottom when loading state changes (when a response is completed)
  useEffect(() => {
    if (!isLoading && shouldScrollRef.current) {
      const container = containerRef.current;
      if (container) {
        setTimeout(() => {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
          });
        }, 100);
      }
    }
  }, [isLoading]);

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto px-1 scroll-smooth"
    >
      {messages.length === 0 && (
        <div className="h-full flex items-center justify-center">
          <div className="text-center p-6 max-w-md">
            <h3 className="text-xl font-semibold mb-2">Welcome to Smart Assistant Bot</h3>
            <p className="text-muted-foreground">
              Ask me anything and I'll do my best to help you with information, assistance, or creative content.
            </p>
          </div>
        </div>
      )}

      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}

      {isLoading && (
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <div className="w-5 h-5 flex items-center justify-center">
              <div className="w-3 h-3 relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-primary/60 opacity-75" />
              </div>
            </div>
          </div>
          <div className="rounded-lg p-3 bg-muted">
            <div className="text-muted-foreground">Thinking...</div>
          </div>
        </div>
      )}
    </div>
  );
} 