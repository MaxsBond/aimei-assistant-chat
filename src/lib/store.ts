import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Citation } from './rag/types';
import { CustomPromptData } from '@/components/chat/custom-prompt';

/**
 * Types of roles a message can have in the chat
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Structure of a chat message
 */
export interface Message {
  id: string;          // Unique identifier for the message
  content: string;     // Content of the message
  role: MessageRole;   // Role of the sender (user, assistant, system)
  timestamp: Date;     // When the message was created
  citations?: Citation[]; // Citations for information sources (RAG feature)
  ragEnabled?: boolean;   // Whether the message was created with RAG
  confidence?: number;    // Confidence score for RAG responses (0-1)
  needsCallback?: boolean; // Whether this message needs a callback option
  callbackReason?: string; // The reason a callback is needed
}

/**
 * Structure for a suggestion
 */
export interface Suggestion {
  id: string;           // Unique identifier for the suggestion
  content: string;      // Content of the suggestion
  used: boolean;        // Whether the suggestion has been used
  createdAt: Date;      // When the suggestion was created
}

/**
 * Callback request information
 */
export interface CallbackRequest {
  id: string;           // Unique identifier for the callback request
  phoneNumber: string;  // User's phone number
  query: string;        // The original query that needs followup
  messageId: string;    // ID of the message that triggered the callback
  submitted: Date;      // When the callback was requested
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
}

/**
 * RAG settings interface
 */
export interface RAGSettings {
  enabled: boolean;     // Whether RAG is enabled
  includeCitations: boolean; // Whether to show citations
  showConfidence: boolean;   // Whether to show confidence scores
}

/**
 * Function calling settings interface
 */
export interface FunctionSettings {
  enabled: boolean;     // Whether function calling is enabled
}

/**
 * Custom prompt settings interface
 */
export interface CustomPromptSettings {
  enabled: boolean;        // Whether a custom prompt is enabled
  customPrompts: CustomPromptData[];  // List of saved custom prompts
  activePromptId: string | null;  // ID of the currently active prompt
}

/**
 * Chat store state and actions interface
 */
interface ChatStore {
  // State
  messages: Message[];         // Array of chat messages
  isLoading: boolean;          // Loading state for async operations
  suggestions: Suggestion[];   // Follow-up suggestions for the user
  ragSettings: RAGSettings;    // RAG settings
  functionSettings: FunctionSettings; // Function calling settings
  callbackRequests: CallbackRequest[]; // Phone callback requests
  showCallbackForm: boolean;   // Whether to show the callback form
  activeCallbackMessageId: string | null; // ID of message triggering the callback form
  customPromptSettings: CustomPromptSettings; // Custom prompt settings
  showCustomPromptForm: boolean; // Whether to show the custom prompt form

  // Message Actions
  addMessage: (content: string, role: MessageRole, options?: { 
    id?: string,
    citations?: Citation[], 
    ragEnabled?: boolean, 
    confidence?: number,
    needsCallback?: boolean,
    callbackReason?: string
  }) => void;  // Add a new message to the chat
  updateMessage: (id: string, content: string) => void;      // Update a message's content
  deleteMessage: (id: string) => void;                       // Delete a specific message
  clearMessages: () => void;                                 // Clear all messages
  getLastMessage: () => Message | undefined;                 // Get the last message in the chat
  
  // Loading State Actions
  setLoading: (loading: boolean) => void;                    // Set the loading state
  
  // Suggestion Actions
  setSuggestions: (suggestions: string[]) => void;           // Set follow-up suggestions from strings
  addSuggestion: (content: string) => void;                  // Add a single suggestion
  removeSuggestion: (id: string) => void;                    // Remove a suggestion
  clearSuggestions: () => void;                              // Clear all suggestions
  markSuggestionAsUsed: (id: string) => void;                // Mark a suggestion as used
  getUnusedSuggestions: () => Suggestion[];                  // Get suggestions that haven't been used
  
  // RAG Settings Actions
  updateRAGSettings: (settings: Partial<RAGSettings>) => void; // Update RAG settings
  toggleRAG: () => void;                                      // Toggle RAG on/off
  
  // Function Settings Actions
  updateFunctionSettings: (settings: Partial<FunctionSettings>) => void; // Update function settings
  toggleFunctions: () => void;                                          // Toggle functions on/off

  // Callback Actions
  setShowCallbackForm: (show: boolean, messageId?: string) => void;   // Show/hide the callback form
  addCallbackRequest: (phoneNumber: string, query: string, messageId: string) => void; // Add a callback request
  updateCallbackStatus: (id: string, status: CallbackRequest['status']) => void; // Update callback status
  getCallbackRequests: () => CallbackRequest[];              // Get all callback requests
  
  // Custom Prompt Actions
  setShowCustomPromptForm: (show: boolean) => void;          // Show/hide the custom prompt form
  addCustomPrompt: (promptData: CustomPromptData) => void;   // Add a new custom prompt
  updateCustomPrompt: (id: string, promptData: CustomPromptData) => void; // Update a custom prompt
  deleteCustomPrompt: (id: string) => void;                  // Delete a custom prompt
  setActivePrompt: (id: string | null) => void;              // Set the active prompt
  getActivePrompt: () => CustomPromptData | null;            // Get the currently active prompt
  toggleCustomPrompt: () => void;                            // Toggle custom prompt on/off
}

/**
 * Zustand store for managing chat state with persistence
 */
export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      // Initial state
      messages: [],
      isLoading: false,
      suggestions: [],
      ragSettings: {
        enabled: true,
        includeCitations: true,
        showConfidence: false,
      },
      functionSettings: {
        enabled: true,
      },
      callbackRequests: [],
      showCallbackForm: false,
      activeCallbackMessageId: null,
      customPromptSettings: {
        enabled: false,
        customPrompts: [],
        activePromptId: null,
      },
      showCustomPromptForm: false,
      
      // Message Actions
      addMessage: (content, role, options = {}) => 
        set((state) => ({
          messages: [
            ...state.messages,
            {
              id: options.id || crypto.randomUUID(),
              content,
              role,
              timestamp: new Date(),
              citations: options.citations,
              ragEnabled: options.ragEnabled,
              confidence: options.confidence,
              needsCallback: options.needsCallback,
              callbackReason: options.callbackReason,
            },
          ],
        })),
      
      updateMessage: (id, content) =>
        set((state) => ({
          messages: state.messages.map(message => 
            message.id === id ? { ...message, content } : message
          ),
        })),
        
      deleteMessage: (id) =>
        set((state) => ({
          messages: state.messages.filter(message => message.id !== id),
        })),
        
      clearMessages: () => set({ messages: [] }),
      
      getLastMessage: () => {
        const messages = get().messages;
        return messages.length > 0 ? messages[messages.length - 1] : undefined;
      },
      
      // Loading State Actions
      setLoading: (loading) => set({ isLoading: loading }),
      
      // Suggestion Actions
      setSuggestions: (suggestionContents) =>
        set({
          suggestions: suggestionContents.map(content => ({
            id: crypto.randomUUID(),
            content,
            used: false,
            createdAt: new Date(),
          })),
        }),
        
      addSuggestion: (content) =>
        set((state) => ({
          suggestions: [
            ...state.suggestions,
            {
              id: crypto.randomUUID(),
              content,
              used: false,
              createdAt: new Date(),
            },
          ],
        })),
        
      removeSuggestion: (id) =>
        set((state) => ({
          suggestions: state.suggestions.filter(suggestion => suggestion.id !== id),
        })),
        
      clearSuggestions: () => set({ suggestions: [] }),
      
      markSuggestionAsUsed: (id) =>
        set((state) => ({
          suggestions: state.suggestions.map(suggestion =>
            suggestion.id === id ? { ...suggestion, used: true } : suggestion
          ),
        })),
        
      getUnusedSuggestions: () => {
        return get().suggestions.filter(suggestion => !suggestion.used);
      },
      
      // RAG Settings Actions
      updateRAGSettings: (settings) =>
        set((state) => ({
          ragSettings: { ...state.ragSettings, ...settings },
        })),
        
      toggleRAG: () =>
        set((state) => ({
          ragSettings: { 
            ...state.ragSettings, 
            enabled: !state.ragSettings.enabled,
          },
        })),
      
      // Function Settings Actions
      updateFunctionSettings: (settings) =>
        set((state) => ({
          functionSettings: { ...state.functionSettings, ...settings },
        })),
        
      toggleFunctions: () =>
        set((state) => ({
          functionSettings: { 
            ...state.functionSettings, 
            enabled: !state.functionSettings.enabled,
          },
        })),

      // Callback Actions
      setShowCallbackForm: (show, messageId = null) => 
        set({
          showCallbackForm: show,
          activeCallbackMessageId: messageId,
        }),
      
      addCallbackRequest: (phoneNumber, query, messageId) =>
        set((state) => ({
          callbackRequests: [
            ...state.callbackRequests,
            {
              id: crypto.randomUUID(),
              phoneNumber,
              query,
              messageId,
              submitted: new Date(),
              status: 'pending',
            }
          ],
          showCallbackForm: false,
          activeCallbackMessageId: null,
        })),
      
      updateCallbackStatus: (id, status) =>
        set((state) => ({
          callbackRequests: state.callbackRequests.map(request =>
            request.id === id ? { ...request, status } : request
          ),
        })),
      
      getCallbackRequests: () => get().callbackRequests,
      
      // Custom Prompt Actions
      setShowCustomPromptForm: (show) => 
        set({
          showCustomPromptForm: show,
        }),
        
      addCustomPrompt: (promptData) =>
        set((state) => {
          const newPrompt = {
            ...promptData,
            id: crypto.randomUUID(),
          };
          
          return {
            customPromptSettings: {
              ...state.customPromptSettings,
              customPrompts: [...state.customPromptSettings.customPrompts, newPrompt],
              activePromptId: newPrompt.id, // Set new prompt as active
              enabled: true, // Enable custom prompts
            },
          };
        }),
        
      updateCustomPrompt: (id, promptData) =>
        set((state) => ({
          customPromptSettings: {
            ...state.customPromptSettings,
            customPrompts: state.customPromptSettings.customPrompts.map(prompt =>
              prompt.id === id ? { ...promptData, id } : prompt
            ),
          },
        })),
        
      deleteCustomPrompt: (id) =>
        set((state) => {
          const newPrompts = state.customPromptSettings.customPrompts.filter(
            prompt => prompt.id !== id
          );
          
          // If we're deleting the active prompt, set activePromptId to null
          const newActivePromptId = state.customPromptSettings.activePromptId === id
            ? null
            : state.customPromptSettings.activePromptId;
            
          // If there are no prompts left, disable custom prompts
          const newEnabled = newPrompts.length > 0 && 
            state.customPromptSettings.enabled;
          
          return {
            customPromptSettings: {
              ...state.customPromptSettings,
              customPrompts: newPrompts,
              activePromptId: newActivePromptId,
              enabled: newEnabled,
            },
          };
        }),
        
      setActivePrompt: (id) =>
        set((state) => ({
          customPromptSettings: {
            ...state.customPromptSettings,
            activePromptId: id,
            enabled: id !== null,
          },
        })),
        
      getActivePrompt: () => {
        const { customPromptSettings } = get();
        
        if (!customPromptSettings.enabled || !customPromptSettings.activePromptId) {
          return null;
        }
        
        return customPromptSettings.customPrompts.find(
          prompt => prompt.id === customPromptSettings.activePromptId
        ) || null;
      },
      
      toggleCustomPrompt: () =>
        set((state) => ({
          customPromptSettings: {
            ...state.customPromptSettings,
            enabled: !state.customPromptSettings.enabled,
          },
        })),
    }),
    {
      name: 'chat-storage', // unique name for localStorage
      partialize: (state) => ({ 
        messages: state.messages,
        suggestions: state.suggestions,
        ragSettings: state.ragSettings,
        functionSettings: state.functionSettings,
        callbackRequests: state.callbackRequests,
        customPromptSettings: state.customPromptSettings,
      }), // persist all settings
    }
  )
); 