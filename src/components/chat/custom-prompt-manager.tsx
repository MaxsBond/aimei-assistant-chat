"use client";

import { useState } from "react";
import { X, Edit, Trash, Check } from "lucide-react";
import { useChatStore } from "@/lib/store";
import { CustomPrompt, CustomPromptData } from "./custom-prompt";

interface CustomPromptManagerProps {
  onClose: () => void;
}

export function CustomPromptManager({ onClose }: CustomPromptManagerProps) {
  const { 
    customPromptSettings, 
    setActivePrompt, 
    deleteCustomPrompt, 
    addCustomPrompt,
    updateCustomPrompt
  } = useChatStore();
  
  const [editPromptId, setEditPromptId] = useState<string | null>(null);
  const [showAddPrompt, setShowAddPrompt] = useState(false);
  
  // Handle setting active prompt
  const handleSetActive = (id: string) => {
    setActivePrompt(id);
  };
  
  // Handle deleting a prompt
  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this prompt?")) {
      deleteCustomPrompt(id);
    }
  };
  
  // Handle editing a prompt
  const handleEdit = (id: string) => {
    setEditPromptId(id);
    setShowAddPrompt(false);
  };
  
  // Handle saving an edited prompt
  const handleSaveEdit = (promptData: CustomPromptData) => {
    if (editPromptId) {
      updateCustomPrompt(editPromptId, promptData);
      setEditPromptId(null);
    }
  };
  
  // Handle adding a new prompt
  const handleAdd = () => {
    setShowAddPrompt(true);
    setEditPromptId(null);
  };
  
  // Handle saving a new prompt
  const handleSaveNew = (promptData: CustomPromptData) => {
    addCustomPrompt(promptData);
    setShowAddPrompt(false);
  };
  
  const { customPrompts, activePromptId } = customPromptSettings;
  
  // If we're editing a prompt
  if (editPromptId) {
    const promptToEdit = customPrompts.find(p => p.id === editPromptId);
    if (!promptToEdit) return null;
    
    return (
      <CustomPrompt 
        onClose={() => setEditPromptId(null)}
        onSave={handleSaveEdit}
        currentPrompt={{
          name: promptToEdit.name,
          systemPrompt: promptToEdit.systemPrompt,
          formattingRules: promptToEdit.formattingRules,
          guardRules: promptToEdit.guardRules,
          callbackInstructions: promptToEdit.callbackInstructions
        }}
      />
    );
  }
  
  // If we're adding a new prompt
  if (showAddPrompt) {
    return (
      <CustomPrompt 
        onClose={() => setShowAddPrompt(false)}
        onSave={handleSaveNew}
      />
    );
  }
  
  return (
    <div className="bg-primary/5 border rounded-lg p-4 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-primary mr-2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <h3 className="font-medium">Custom Prompts Manager</h3>
        </div>
        <button 
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Close custom prompt manager"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <p className="text-sm mb-4">
        Manage your custom prompts below. Click a prompt to make it active, or use the buttons to edit or delete.
      </p>
      
      {customPrompts.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <p>No custom prompts yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
          {customPrompts.map((prompt) => (
            <div 
              key={prompt.id} 
              className={`p-3 rounded-md border flex justify-between items-center ${
                prompt.id === activePromptId 
                  ? 'bg-primary/10 border-primary/30' 
                  : 'bg-background'
              }`}
            >
              <div className="flex items-center gap-2">
                {prompt.id === activePromptId && (
                  <Check className="w-4 h-4 text-primary" />
                )}
                <span 
                  className="font-medium cursor-pointer hover:text-primary"
                  onClick={() => handleSetActive(prompt.id)}
                >
                  {prompt.name}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(prompt.id)}
                  className="text-muted-foreground hover:text-foreground p-1"
                  aria-label={`Edit ${prompt.name}`}
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(prompt.id)}
                  className="text-muted-foreground hover:text-red-500 p-1"
                  aria-label={`Delete ${prompt.name}`}
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex justify-end">
        <button
          onClick={handleAdd}
          className="bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 focus:ring-2 focus:ring-primary/50 focus:outline-none"
        >
          Create New Prompt
        </button>
      </div>
    </div>
  );
} 