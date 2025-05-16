"use client";

import { useState } from "react";
import { useChatStore, Message, MessageRole, Suggestion } from "@/lib/store";
import { ChatContainer } from "./chat-container";
import { ChatInput } from "./chat-input";
import { SuggestionsContainer } from "./suggestions-container";
import { sendMessage, getSuggestions, Message as ApiMessage } from "@/lib/api";

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
  } = useChatStore();
  
  const [showSuggestions, setShowSuggestions] = useState(true);

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

      // Send message to API and get response with RAG and function calling options
      const responseMessage = await sendMessage(apiMessages, {
        enableRAG: ragSettings.enabled,
        enableFunctions: functionSettings.enabled,
        useDirectRAG: ragSettings.useDirectRAG
      });

      // Add assistant's response to the store with citations and confidence if available
      const newMessageId = crypto.randomUUID();
      addMessage(
        responseMessage.content,
        "assistant",
        {
          id: newMessageId, // Pass ID so we can reference it immediately
          citations: responseMessage.citations,
          ragEnabled: ragSettings.useDirectRAG || (responseMessage.citations && responseMessage.citations.length > 0),
          confidence: (responseMessage as any).confidence || 
            (responseMessage.citations && responseMessage.citations.length > 0 ? 
              getConfidenceFromCitations(responseMessage.citations || []) : undefined),
          needsCallback: responseMessage.callback?.needed,
          callbackReason: responseMessage.callback?.reason,
          showCalendly: responseMessage.calendly?.show
        }
      );

      // If the response needs a callback, show the form immediately
      if (responseMessage.callback?.needed) {
        setShowCallbackForm(true, newMessageId);
      }

      // Generate and set suggestions only if there's no callback request or calendly booking
      if (!responseMessage.callback?.needed && !responseMessage.calendly?.show) {
        const messagesForSuggestions = [
          ...apiMessages,
          { role: "assistant" as MessageRole, content: responseMessage.content }
        ];
        
        const newSuggestions = await getSuggestions(messagesForSuggestions);
        setSuggestions(newSuggestions);
      }
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

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)] max-h-[calc(100vh-5rem)]">
      <div className="flex-1 flex flex-col overflow-hidden rounded-md bg-background/60 shadow-lg">
        <ChatContainer 
          messages={messages} 
          isLoading={isLoading} 
          onSendMessage={handleSendMessage}
        />

        <div className="p-4">
          <SuggestionsContainer
            suggestions={unusedSuggestions}
            onSelectSuggestion={handleSelectSuggestion}
            showSuggestions={showSuggestions}
            setShowSuggestions={setShowSuggestions}
          />
          
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
} 