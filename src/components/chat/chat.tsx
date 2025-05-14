"use client";

import { useState } from "react";
import { useChatStore, Message, MessageRole, Suggestion } from "@/lib/store";
import { ChatContainer } from "./chat-container";
import { ChatInput } from "./chat-input";
import { SuggestionsContainer } from "./suggestions-container";
import { sendMessage, getSuggestions, Message as ApiMessage } from "@/lib/api";
import { BookOpen, BookX, Wrench, SlashIcon, MessageSquare, Settings } from "lucide-react";
import { CustomPrompt, CustomPromptData } from "./custom-prompt";
import { CustomPromptManager } from "./custom-prompt-manager";
import { buildPromptFromCustomData } from "@/lib/promptUtils";

export function Chat() {
  const {
    messages,
    addMessage,
    clearMessages,
    isLoading,
    setLoading,
    suggestions,
    setSuggestions,
    markSuggestionAsUsed,
    getUnusedSuggestions,
    clearSuggestions,
    ragSettings,
    toggleRAG,
    updateRAGSettings,
    functionSettings,
    toggleFunctions,
    updateFunctionSettings,
    setShowCallbackForm,
    customPromptSettings,
    toggleCustomPrompt,
    showCustomPromptForm,
    setShowCustomPromptForm,
    addCustomPrompt,
    getActivePrompt,
  } = useChatStore();
  
  const [showPromptManager, setShowPromptManager] = useState(false);

  const handleSendMessage = async (content: string) => {
    // Add user message to the store
    addMessage(content, "user");
    setLoading(true);
    clearSuggestions();

    try {
      // Convert store messages to API message format
      const apiMessages: ApiMessage[] = messages.map(message => ({
        role: message.role,
        content: message.content,
        citations: message.citations,
      }));
      
      // Add the new user message in API format
      apiMessages.push({ role: "user", content });

      // Send message to API and get response with RAG, function calling and custom prompt options
      const responseMessage = await sendMessage(apiMessages, {
        enableRAG: ragSettings.enabled,
        enableFunctions: functionSettings.enabled,
        useCustomPrompt: customPromptSettings.enabled,
        customPromptContent: customPromptSettings.enabled && getActivePrompt() 
          ? buildPromptFromCustomData(getActivePrompt())
          : undefined
      });

      // Add assistant's response to the store with citations and confidence if available
      const newMessageId = crypto.randomUUID();
      addMessage(
        responseMessage.content,
        "assistant",
        {
          id: newMessageId, // Pass ID so we can reference it immediately
          citations: responseMessage.citations,
          ragEnabled: responseMessage.citations?.length > 0,
          confidence: responseMessage.citations?.length > 0 ? 
            getConfidenceFromCitations(responseMessage.citations) : undefined,
          needsCallback: responseMessage.callback?.needed,
          callbackReason: responseMessage.callback?.reason,
        }
      );

      // If the response needs a callback, show the form immediately
      if (responseMessage.callback?.needed) {
        setShowCallbackForm(true, newMessageId);
      }

      // Generate and set suggestions
      const messagesForSuggestions = [
        ...apiMessages,
        { role: "assistant" as MessageRole, content: responseMessage.content }
      ];
      
      const newSuggestions = await getSuggestions(messagesForSuggestions);
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error("Error processing message:", error);
      addMessage(
        "Sorry, I encountered an error processing your message. Please try again.",
        "assistant"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear the chat history?")) {
      clearMessages();
      clearSuggestions();
    }
  };

  const handleSelectSuggestion = (suggestion: Suggestion) => {
    markSuggestionAsUsed(suggestion.id);
    handleSendMessage(suggestion.content);
  };
  
  // Handle custom prompt save
  const handleSaveCustomPrompt = (promptData: CustomPromptData) => {
    addCustomPrompt(promptData);
    setShowCustomPromptForm(false);
  };
  
  // Open the custom prompt editor
  const handleOpenCustomPromptEditor = () => {
    setShowCustomPromptForm(true);
    setShowPromptManager(false);
  };
  
  // Open the prompt manager
  const handleOpenPromptManager = () => {
    setShowPromptManager(true);
    setShowCustomPromptForm(false);
  };
  
  // Simple heuristic to estimate confidence from citations
  const getConfidenceFromCitations = (citations: any[]) => {
    if (!citations || citations.length === 0) return undefined;
    
    // More citations generally means higher confidence
    const citationCount = Math.min(citations.length, 5);
    
    // Base confidence on citation count (0.6 to 0.9)
    return 0.6 + (citationCount / 5) * 0.3;
  };

  // Get only unused suggestions for display
  const unusedSuggestions = getUnusedSuggestions();
  
  // Get the active custom prompt if any
  const activePrompt = getActivePrompt();

  return (
    <div className="flex flex-col h-[calc(100vh-11rem)]">
      <div className="flex justify-between mb-2">
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
        
        <button
          onClick={handleClearChat}
          disabled={messages.length === 0 || isLoading}
          className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          Clear Chat
        </button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden border rounded-lg bg-background/50">
        {showCustomPromptForm && (
          <CustomPrompt 
            onClose={() => setShowCustomPromptForm(false)}
            onSave={handleSaveCustomPrompt}
            currentPrompt={activePrompt || undefined}
          />
        )}
        
        {showPromptManager && (
          <CustomPromptManager
            onClose={() => setShowPromptManager(false)}
          />
        )}
        
        <ChatContainer 
          messages={messages} 
          isLoading={isLoading} 
          onSendMessage={handleSendMessage}
        />

        <div className="p-4 border-t">
          <SuggestionsContainer
            suggestions={unusedSuggestions}
            onSelectSuggestion={handleSelectSuggestion}
          />
          
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
} 