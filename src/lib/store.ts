import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Citation } from './rag/types';

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
 * RAG settings interface
 */
export interface RAGSettings {
  enabled: boolean;     // Whether RAG is enabled
  includeCitations: boolean; // Whether to show citations
  showConfidence: boolean;   // Whether to show confidence scores
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

  // Message Actions
  addMessage: (content: string, role: MessageRole, options?: { citations?: Citation[], ragEnabled?: boolean, confidence?: number }) => void;  // Add a new message to the chat
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
      
      // Message Actions
      addMessage: (content, role, options = {}) => 
        set((state) => ({
          messages: [
            ...state.messages,
            {
              id: crypto.randomUUID(),
              content,
              role,
              timestamp: new Date(),
              citations: options.citations,
              ragEnabled: options.ragEnabled,
              confidence: options.confidence,
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
    }),
    {
      name: 'chat-storage', // unique name for localStorage
      partialize: (state) => ({ 
        messages: state.messages,
        suggestions: state.suggestions,
        ragSettings: state.ragSettings,
      }), // persist messages, suggestions, and RAG settings
    }
  )
); 