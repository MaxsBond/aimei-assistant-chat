"use client";

import { useState, useEffect } from "react";
import { useChatStore } from "@/lib/store";
import { X, Save, RefreshCw, Sparkles, Code, User } from "lucide-react";
import { SYSTEM_PROMPTS } from "@/constants/prompts";

interface CustomPromptEditorProps {
  onClose: () => void;
}

export function CustomPromptEditor({ onClose }: CustomPromptEditorProps) {
  const { customPromptSettings, updateCustomPromptSettings } = useChatStore();
  const [prompt, setPrompt] = useState(customPromptSettings.content || SYSTEM_PROMPTS.default);
  
  useEffect(() => {
    // If the custom prompt is empty, initialize with the default system prompt
    if (!customPromptSettings.content) {
      updateCustomPromptSettings({ content: SYSTEM_PROMPTS.default });
      setPrompt(SYSTEM_PROMPTS.default);
    }
  }, [customPromptSettings.content, updateCustomPromptSettings]);
  
  const handleSave = () => {
    // Update content and automatically enable custom prompt
    updateCustomPromptSettings({ 
      content: prompt,
      enabled: true 
    });
    onClose();
  };
  
  const handleReset = () => {
    setPrompt(SYSTEM_PROMPTS.default);
    updateCustomPromptSettings({ content: SYSTEM_PROMPTS.default });
  };
  
  const applyPreset = (presetPrompt: string) => {
    setPrompt(presetPrompt);
  };
  
  return (
    <div className="p-3 border rounded-md mb-2 bg-card">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">Custom System Prompt</h3>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-muted">
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="mb-2">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full h-40 p-2 text-sm border rounded-md bg-background resize-y"
          placeholder="You are an AI assistant. You are helpful, creative, and provide accurate information..."
        />
        <div className="text-xs text-muted-foreground mt-1 text-right">
          {prompt.length} characters
        </div>
      </div>
      
      <div className="flex justify-between">
        <button
          onClick={handleReset}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground hover:bg-muted/80"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reset</span>
        </button>
        
        <button
          onClick={handleSave}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Save className="w-3 h-3" />
          <span>Save</span>
        </button>
      </div>
    </div>
  );
} 