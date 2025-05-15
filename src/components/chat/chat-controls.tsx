"use client";

import { 
  BookOpen, 
  BookX, 
  Wrench, 
  SlashIcon, 
  MessageSquare, 
  Settings, 
  Trash2 
} from "lucide-react";
import { useChatStore } from "@/lib/store";
import { ThemeToggle } from "../theme/theme-toggle";

export function ChatControls() {
  const {
    messages,
    clearMessages,
    isLoading,
    clearSuggestions,
    ragSettings,
    toggleRAG,
    functionSettings,
    toggleFunctions,
    customPromptSettings,
    toggleCustomPrompt,
    setShowCustomPromptForm,
    getActivePrompt,
  } = useChatStore();
  
  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear the chat history?")) {
      clearMessages();
      clearSuggestions();
    }
  };
  
  const handleOpenPromptManager = () => {
    setShowCustomPromptForm(true);
  };
  
  // Get the active custom prompt if any
  const activePrompt = getActivePrompt();

  return (
    <div className="flex items-center justify-between w-full mb-2 bg-background/60 rounded-md">
      <div className="flex gap-2">
        <button
          onClick={toggleRAG}
          className={`flex items-center gap-1 text-sm px-2 py-1 rounded-md ${
            ragSettings.enabled 
              ? 'bg-primary/10 text-primary' 
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {ragSettings.enabled ? (
            <>
              <BookOpen className="w-4 h-4" />
              <span>Knowledge Base: ON</span>
            </>
          ) : (
            <>
              <BookX className="w-4 h-4" />
              <span>Knowledge Base: OFF</span>
            </>
          )}
        </button>
        
        <button
          onClick={toggleFunctions}
          className={`flex items-center gap-1 text-sm px-2 py-1 rounded-md ${
            functionSettings.enabled 
              ? 'bg-primary/10 text-primary' 
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {functionSettings.enabled ? (
            <>
              <Wrench className="w-4 h-4" />
              <span>Functions: ON</span>
            </>
          ) : (
            <>
              <div className="relative w-4 h-4">
                <Wrench className="w-4 h-4" />
                <SlashIcon className="w-4 h-4 absolute top-0 left-0 text-red-500" />
              </div>
              <span>Functions: OFF</span>
            </>
          )}
        </button>
        
        <button
          onClick={toggleCustomPrompt}
          className={`flex items-center gap-1 text-sm px-2 py-1 rounded-md ${
            customPromptSettings.enabled && activePrompt 
              ? 'bg-primary/10 text-primary' 
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {customPromptSettings.enabled && activePrompt ? (
            <>
              <MessageSquare className="w-4 h-4" />
              <span>{`Custom: ${activePrompt.name}`}</span>
            </>
          ) : (
            <>
              <MessageSquare className="w-4 h-4" />
              <span>Custom Prompt: OFF</span>
            </>
          )}
        </button>
        
        <button
          onClick={handleOpenPromptManager}
          className="flex items-center gap-1 text-sm px-2 py-1 rounded-md bg-muted text-muted-foreground hover:bg-muted/80"
          title="Manage Custom Prompts"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={handleClearChat}
          disabled={messages.length === 0 || isLoading}
          className="flex items-center gap-1 text-sm px-2 py-1 rounded-md bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-50"
          title="Clear Chat"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear</span>
        </button>
        <ThemeToggle />
      </div>
    </div>
  );
} 