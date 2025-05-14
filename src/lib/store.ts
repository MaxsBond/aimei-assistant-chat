import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
 * Chat store state and actions interface
 */
interface ChatStore {
  // State
  messages: Message[];         // Array of chat messages
  isLoading: boolean;          // Loading state for async operations
  suggestions: Suggestion[];   // Follow-up suggestions for the user

  // Message Actions
  addMessage: (content: string, role: MessageRole) => void;  // Add a new message to the chat
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
      
      // Message Actions
      addMessage: (content, role) => 
        set((state) => ({
          messages: [
            ...state.messages,
            {
              id: crypto.randomUUID(),
              content,
              role,
              timestamp: new Date(),
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
    }),
    {
      name: 'chat-storage', // unique name for localStorage
      partialize: (state) => ({ 
        messages: state.messages,
        suggestions: state.suggestions
      }), // persist messages and suggestions
    }
  )
); 