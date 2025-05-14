// Application configuration settings

export const config = {
  appName: 'Smart Assistant Bot',
  openai: {
    model: 'gpt-3.5-turbo', // Default model
    temperature: 0.7,
    max_tokens: 1000,
  },
  ui: {
    suggestions: {
      count: 3, // Number of suggestions to show
      maxLength: 60, // Maximum character length for suggestions
    },
    chat: {
      maxMessages: 100, // Maximum number of messages to keep in history
    },
    theme: {
      default: 'system', // 'light', 'dark', or 'system'
    },
  },
  apiEndpoints: {
    chat: '/api/chat',
    suggestions: '/api/suggestions',
  },
  // Add other configuration settings as needed
}; 