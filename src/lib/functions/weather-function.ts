/**
 * Weather function definition and implementation for OpenAI to call
 */
import { Tool } from '../rag/types';

/**
 * Weather function schema definition for OpenAI
 */
export const weatherFunctionDefinition = {
  name: 'getWeather',
  description: 'Get the current weather for a specified location',
  parameters: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'The city and state, e.g. San Francisco, CA or city and country, e.g. Paris, France',
      },
      unit: {
        type: 'string',
        enum: ['celsius', 'fahrenheit'],
        description: 'The unit of temperature to display results in',
        default: 'celsius',
      }
    },
    required: ['location'],
  },
};

/**
 * Create a Tool object to include in OpenAI API requests
 */
export const weatherTool: Tool = {
  type: 'function',
  function: weatherFunctionDefinition,
};

/**
 * Mock weather data for various locations
 */
const weatherDatabase = {
  'san francisco': { temp: 14, conditions: 'Foggy', humidity: 75 },
  'new york': { temp: 20, conditions: 'Partly Cloudy', humidity: 60 },
  'paris': { temp: 18, conditions: 'Sunny', humidity: 50 },
  'tokyo': { temp: 25, conditions: 'Rainy', humidity: 80 },
  'sydney': { temp: 22, conditions: 'Clear', humidity: 45 },
  'london': { temp: 12, conditions: 'Rainy', humidity: 85 },
  'default': { temp: 15, conditions: 'Unknown', humidity: 70 }
};

/**
 * Parse arguments from an OpenAI function call
 */
export function parseWeatherArguments(argsString: string) {
  try {
    const args = JSON.parse(argsString);
    return {
      location: args.location,
      unit: args.unit || 'celsius'
    };
  } catch (error) {
    console.error('Error parsing weather arguments:', error);
    return null;
  }
}

/**
 * Convert celsius to fahrenheit
 */
function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9/5) + 32;
}

/**
 * Handle a weather function call from OpenAI
 */
export async function handleWeatherCall(argsString: string): Promise<string> {
  const args = parseWeatherArguments(argsString);
  
  if (!args) {
    return JSON.stringify({
      error: 'Failed to parse weather arguments',
      weather: null,
    });
  }
  
  try {
    // Normalize location for lookup
    const normalizedLocation = args.location.toLowerCase();
    
    // Find location in our mock database or use default
    let weatherData;
    for (const [key, value] of Object.entries(weatherDatabase)) {
      if (normalizedLocation.includes(key)) {
        weatherData = value;
        break;
      }
    }
    
    // If no match found, use default
    if (!weatherData) {
      weatherData = weatherDatabase.default;
    }
    
    // Convert temperature if needed
    let temperature = weatherData.temp;
    let unit = 'C';
    
    if (args.unit === 'fahrenheit') {
      temperature = celsiusToFahrenheit(temperature);
      unit = 'F';
    }
    
    // Return formatted results
    return JSON.stringify({
      location: args.location,
      temperature: `${temperature}°${unit}`,
      conditions: weatherData.conditions,
      humidity: `${weatherData.humidity}%`,
      forecast: 'This is a simulated weather response for demonstration purposes',
    });
  } catch (error) {
    console.error('Error handling weather function call:', error);
    return JSON.stringify({
      error: 'Failed to get weather information',
      weather: null,
    });
  }
} 