"use client";

import { useEffect, useRef } from "react";
import { Message } from "@/lib/store";
import { MessageItem } from "./message-item";
import Image from "next/image";
import { WelcomeSuggestions } from "./welcome-suggestions";
import { useChatStore } from "@/lib/store";
import { MessageSquare } from "lucide-react";

interface ChatContainerProps {
  messages: Message[];
  isLoading?: boolean;
  onSendMessage?: (content: string) => void;
}

export function ChatContainer({ messages, isLoading = false, onSendMessage }: ChatContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(true);
  const lastMessageCountRef = useRef(0);
  const { customPromptSettings } = useChatStore();

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

  const handleSuggestionClick = (content: string) => {
    if (onSendMessage) {
      onSendMessage(content);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto px-10 py-10 md:px-12 scroll-smooth relative"
    >
      {customPromptSettings.enabled && (
        <div className="absolute top-2 right-2 text-xs bg-primary/10 text-primary rounded-md px-2 py-1 flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity">
          <MessageSquare className="w-3 h-3" />
          <span>Custom Prompt</span>
        </div>
      )}
      
      {messages.length === 0 && (
        <div className="h-full flex items-center justify-center">
          <div className="text-center p-6 max-w-xl">
            <div className="w-28 h-28 overflow-hidden mx-auto mb-4 rounded-full flex items-center justify-center">
              <Image 
                src="/rectangle-avatar.svg" 
                alt="AI Assistant"
                width={112} 
                height={112}
                className="rounded-full"
              />
            </div>
            <h3 className="text-xl font-semibold mb-2">Hi, I'm Aimei smart assistant!</h3>
            <p className="text-muted-foreground">
              Ready to answer all your questions about franchise framework.
            </p>
            
            {onSendMessage && <WelcomeSuggestions onClick={handleSuggestionClick} />}
          </div>
        </div>
      )}

      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}

      {isLoading && (
        <div className="flex items-center gap-3 mb-4 mx-2">
          <div className="flex-shrink-0 w-8 h-8 overflow-hidden rounded-full flex items-center justify-center">
            <Image 
              src="/rectangle-avatar.svg" 
              alt="AI Assistant"
              width={32} 
              height={32}
              className="rounded-full"
            />
          </div>
          <div className="rounded-lg p-3 bg-muted">
            <div className="text-muted-foreground flex items-center">
              <span>Thinking</span>
              <span className="ml-1 inline-flex">
                <span className="animate-bounce [animation-delay:0ms]">.</span>
                <span className="animate-bounce [animation-delay:150ms]">.</span>
                <span className="animate-bounce [animation-delay:300ms]">.</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 