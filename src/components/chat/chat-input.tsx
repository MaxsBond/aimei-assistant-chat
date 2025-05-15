"use client";

import { useState, KeyboardEvent, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus on page load
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      // Limit max height on smaller screens 
      const maxHeight = window.innerWidth < 640 ? 120 : 200;
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;
    }
  }, [message]);

  // Re-focus after sending a message
  useEffect(() => {
    if (!isLoading && message === "" && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading, message]);

  const handleSendMessage = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !isLoading) {
      onSendMessage(trimmedMessage);
      setMessage("");
      
      // Reset height after sending
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send message with Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
    
    // Allow Shift+Enter for new line
    // (No additional code needed, as this is the default behavior)
    
    // Keyboard shortcut: Ctrl+Enter or Cmd+Enter also sends message
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`border rounded-md p-1 sm:p-2 flex items-end gap-1 sm:gap-2 bg-background/60 shadow-sm transition-colors ${isLoading ? 'border-primary/50' : ''}`}>
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isLoading ? "Waiting for response..." : "Type a message..."}
        className="flex-1 bg-transparent border-0 outline-none resize-none p-1 sm:p-2 text-sm sm:text-base max-h-[120px] sm:max-h-[200px] min-h-[40px] sm:min-h-[56px] transition-opacity"
        rows={1}
        disabled={isLoading}
        style={{ opacity: isLoading ? 0.7 : 1 }}
        aria-label="Message input"
      />
      <button
        onClick={handleSendMessage}
        disabled={isLoading || !message.trim()}
        className="rounded-md p-1.5 sm:p-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        aria-label="Send message"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
        ) : (
          <Send className="h-4 w-4 sm:h-5 sm:w-5" />
        )}
      </button>
    </div>
  );
} 