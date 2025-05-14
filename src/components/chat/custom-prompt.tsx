"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle, AlertCircle, Save, RefreshCw } from "lucide-react";
import { SYSTEM_PROMPTS, FORMATTING_RULES, GUARD_RULES, CALLBACK_INSTRUCTIONS } from "@/constants/prompts";
import { getAvailablePromptTypes } from "@/lib/promptUtils";

interface CustomPromptProps {
  onClose: () => void;
  onSave: (promptData: CustomPromptData) => void;
  currentPrompt?: CustomPromptData;
}

export interface CustomPromptData {
  id?: string;
  name: string;
  systemPrompt: string;
  formattingRules: string;
  guardRules: string;
  callbackInstructions: string;
}

export function CustomPrompt({ onClose, onSave, currentPrompt }: CustomPromptProps) {
  const [name, setName] = useState(currentPrompt?.name || "");
  const [systemPrompt, setSystemPrompt] = useState(currentPrompt?.systemPrompt || SYSTEM_PROMPTS.default);
  const [formattingRules, setFormattingRules] = useState(currentPrompt?.formattingRules || FORMATTING_RULES);
  const [guardRules, setGuardRules] = useState(currentPrompt?.guardRules || GUARD_RULES);
  const [callbackInstructions, setCallbackInstructions] = useState(currentPrompt?.callbackInstructions || CALLBACK_INSTRUCTIONS);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("default");
  
  // Handle template selection
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const template = e.target.value;
    setSelectedTemplate(template);
    
    if (template !== "custom") {
      setSystemPrompt(SYSTEM_PROMPTS[template as keyof typeof SYSTEM_PROMPTS]);
    }
  };
  
  // Reset to defaults
  const handleReset = () => {
    setSystemPrompt(SYSTEM_PROMPTS.default);
    setFormattingRules(FORMATTING_RULES);
    setGuardRules(GUARD_RULES);
    setCallbackInstructions(CALLBACK_INSTRUCTIONS);
    setSelectedTemplate("default");
  };
  
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage("");
    
    // Validate inputs
    if (!name.trim()) {
      setErrorMessage("Please provide a name for your custom prompt");
      return;
    }
    
    if (!systemPrompt.trim()) {
      setErrorMessage("System prompt cannot be empty");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Create the prompt data
      const promptData: CustomPromptData = {
        name: name.trim(),
        systemPrompt,
        formattingRules,
        guardRules,
        callbackInstructions
      };
      
      // Save the prompt data
      onSave(promptData);
      onClose();
    } catch (error) {
      console.error("Error saving custom prompt:", error);
      setErrorMessage(error instanceof Error ? error.message : "There was an error saving your custom prompt. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Get available prompt types
  const promptTypes = getAvailablePromptTypes();
  
  return (
    <div className="bg-primary/5 border rounded-lg p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-primary mr-2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <h3 className="font-medium">Custom Prompt Editor</h3>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-1 bg-primary text-primary-foreground py-1 px-3 rounded-md hover:bg-primary/90 focus:ring-2 focus:ring-primary/50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? "Saving..." : "Save Prompt"}
          </button>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close custom prompt editor"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <p className="text-sm mb-3">
        Customize the system prompts that control how the AI assistant behaves. This is an advanced feature for testing different prompt configurations.
      </p>
      
      {errorMessage && (
        <div className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 p-2 rounded-md mb-3 flex items-center text-sm">
          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
          {errorMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label htmlFor="name" className="block text-xs font-medium mb-1">
            Prompt Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Custom Prompt"
            className="w-full p-2 rounded-md border bg-background focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
            disabled={isSubmitting}
            required
          />
        </div>
        
        <div>
          <label htmlFor="template" className="block text-xs font-medium mb-1">
            Base Template
          </label>
          <select
            id="template"
            value={selectedTemplate}
            onChange={handleTemplateChange}
            className="w-full p-2 rounded-md border bg-background focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
            disabled={isSubmitting}
          >
            {Object.entries(promptTypes).map(([key, description]) => (
              <option key={key} value={key}>{description}</option>
            ))}
            <option value="custom">Custom</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="systemPrompt" className="block text-xs font-medium mb-1">
            System Prompt
          </label>
          <textarea
            id="systemPrompt"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={4}
            className="w-full p-2 rounded-md border bg-background focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
            disabled={isSubmitting}
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            This is the main instruction to the AI that determines its behavior.
          </p>
        </div>
        
        <div>
          <label htmlFor="formattingRules" className="block text-xs font-medium mb-1">
            Formatting Rules
          </label>
          <textarea
            id="formattingRules"
            value={formattingRules}
            onChange={(e) => setFormattingRules(e.target.value)}
            rows={3}
            className="w-full p-2 rounded-md border bg-background focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
            disabled={isSubmitting}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Controls how the AI formats its responses (markdown, emojis, etc.).
          </p>
        </div>
        
        <div>
          <label htmlFor="guardRules" className="block text-xs font-medium mb-1">
            Guard Rules
          </label>
          <textarea
            id="guardRules"
            value={guardRules}
            onChange={(e) => setGuardRules(e.target.value)}
            rows={2}
            className="w-full p-2 rounded-md border bg-background focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
            disabled={isSubmitting}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Rules to prevent the AI from answering off-topic questions.
          </p>
        </div>
        
        <div>
          <label htmlFor="callbackInstructions" className="block text-xs font-medium mb-1">
            Callback Instructions
          </label>
          <textarea
            id="callbackInstructions"
            value={callbackInstructions}
            onChange={(e) => setCallbackInstructions(e.target.value)}
            rows={3}
            className="w-full p-2 rounded-md border bg-background focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
            disabled={isSubmitting}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Instructions for when the AI should suggest a phone callback.
          </p>
        </div>
        
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSubmitting}
            className="flex items-center gap-1 bg-muted text-muted-foreground py-2 px-4 rounded-md hover:bg-muted/80 focus:ring-2 focus:ring-primary/50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className="w-4 h-4" />
            Reset to Default
          </button>
        </div>
      </form>
    </div>
  );
} 