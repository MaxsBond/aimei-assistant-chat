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
    customPromptSettings,
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

      // Create an ID for the new message upfront
      const newMessageId = crypto.randomUUID();
      
      // Add an empty placeholder message that will be updated as chunks arrive
      addMessage("", "assistant", { id: newMessageId });
      
      // Send message to API with streaming support
      const responseMessage = await sendMessage(apiMessages, {
        enableRAG: ragSettings.enabled,
        enableFunctions: functionSettings.enabled,
        useCustomPrompt: customPromptSettings.enabled,
        customPromptContent: customPromptSettings.content,
        // Handle streaming chunks
        onChunk: (chunk) => {
          // Incrementally update the message content as chunks arrive
          const currentMessages = useChatStore.getState().messages;
          const lastMessage = currentMessages[currentMessages.length - 1];
          
          console.log(`🔄 CLIENT-CHUNK: Received chunk of ${chunk.length} characters`);
          
          if (lastMessage && lastMessage.id === newMessageId) {
            console.log(`🔄 CLIENT-CHUNK: Updating message ${newMessageId.slice(0, 8)}...`);
            
            // Update the message with the accumulated content
            useChatStore.getState().updateMessage(
              newMessageId,
              lastMessage.content + chunk
            );
          } else {
            console.error(`🔄 CLIENT-CHUNK: Failed to find message with ID ${newMessageId.slice(0, 8)}`);
            console.log('Current messages:', currentMessages.map(m => ({id: m.id.slice(0, 8), role: m.role})));
          }
        }
      });

      // Update the assistant's message with complete information once streaming is finished
      useChatStore.getState().updateMessage(
        newMessageId,
        responseMessage.content,
        {
          citations: responseMessage.citations,
          ragEnabled: responseMessage.citations && responseMessage.citations.length > 0,
          confidence: responseMessage.citations && responseMessage.citations.length > 0 ? 
            getConfidenceFromCitations(responseMessage.citations || []) : undefined,
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