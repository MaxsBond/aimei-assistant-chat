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
  } = useChatStore();

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
      }));
      
      // Add the new user message in API format
      apiMessages.push({ role: "user", content });

      // Send message to API and get response
      const responseContent = await sendMessage(apiMessages);

      // Add assistant's response to the store
      addMessage(responseContent, "assistant");

      // Generate and set suggestions
      const messagesForSuggestions = [
        ...apiMessages,
        { role: "assistant" as MessageRole, content: responseContent }
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

  // Get only unused suggestions for display
  const unusedSuggestions = getUnusedSuggestions();

  return (
    <div className="flex flex-col h-[calc(100vh-11rem)]">
      <div className="flex justify-end mb-2">
        <button
          onClick={handleClearChat}
          disabled={messages.length === 0 || isLoading}
          className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          Clear Chat
        </button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden border rounded-lg bg-background/50">
        <ChatContainer messages={messages} isLoading={isLoading} />

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