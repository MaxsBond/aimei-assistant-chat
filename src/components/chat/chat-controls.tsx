"use client";

import { 
  BookOpen, 
  BookX, 
  Wrench, 
  SlashIcon, 
  Trash2,
  ChevronDown,
  ChevronUp,
  Settings,
  MessageSquare
} from "lucide-react";
import { useChatStore } from "@/lib/store";
import { ThemeToggle } from "../theme/theme-toggle";
import { useState } from "react";
import { CustomPromptEditor } from "@/components/chat/custom-prompt-editor";

export function ChatControls() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
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
  } = useChatStore();
  
  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear the chat history?")) {
      clearMessages();
      clearSuggestions();
    }
  };
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  const togglePromptEditor = () => {
    if (!isExpanded) {
      setIsExpanded(true);
    }
    setShowPromptEditor(!showPromptEditor);
  };

  return (
    <div className="flex flex-col w-full mb-2 bg-background/60 rounded-md transition-all duration-300">
      <div className="flex items-center justify-between w-full p-1">
        <button 
          onClick={toggleExpand}
          className="flex items-center gap-1 text-sm px-2 py-1 rounded-md bg-muted text-muted-foreground hover:bg-muted/80"
          aria-label={isExpanded ? "Collapse menu" : "Expand menu"}
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
          <span>Controls</span>
        </button>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearChat}
            disabled={messages.length === 0 || isLoading}
            className="flex items-center gap-1 text-sm px-2 py-1 rounded-md bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-50"
            title="Clear Chat"
          >
            <Trash2 className="w-4 h-4" />
            <span className={isExpanded ? "" : "sr-only"}>Clear</span>
          </button>
          <ThemeToggle />
        </div>
      </div>
      
      {isExpanded && (
        <div className="flex items-center justify-between w-full p-1 overflow-hidden transition-all duration-300 ease-in-out">
          <div className="flex gap-2 flex-wrap">
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
                customPromptSettings.enabled 
                  ? 'bg-primary/10 text-primary' 
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {customPromptSettings.enabled ? (
                <>
                  <MessageSquare className="w-4 h-4" />
                  <span>Custom Prompt: ON</span>
                </>
              ) : (
                <>
                  <div className="relative w-4 h-4">
                    <MessageSquare className="w-4 h-4" />
                    <SlashIcon className="w-4 h-4 absolute top-0 left-0 text-red-500" />
                  </div>
                  <span>Custom Prompt: OFF</span>
                </>
              )}
            </button>
            
            <button
              onClick={togglePromptEditor}
              className={`flex items-center gap-1 text-sm px-2 py-1 rounded-md ${
                customPromptSettings.enabled 
                  ? 'bg-primary/10 text-primary' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Edit Prompt</span>
            </button>
          </div>
        </div>
      )}
      
      {showPromptEditor && <CustomPromptEditor onClose={togglePromptEditor} />}
    </div>
  );
} 