"use client";

import { SuggestionItem } from "./suggestion-item";
import { Suggestion } from "@/lib/store";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

interface SuggestionsContainerProps {
  suggestions: Suggestion[];
  onSelectSuggestion: (suggestion: Suggestion) => void;
  showSuggestions: boolean;
  setShowSuggestions: Dispatch<SetStateAction<boolean>>;
}

export function SuggestionsContainer({
  suggestions,
  onSelectSuggestion,
  showSuggestions,
  setShowSuggestions,
}: SuggestionsContainerProps) {
  if (!suggestions.length) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <button 
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="flex items-center justify-center p-1 mr-1 hover:bg-muted/50 rounded-md text-muted-foreground"
            aria-label={showSuggestions ? "Hide suggestions" : "Show suggestions"}
          >
            {showSuggestions ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>
          <p className="text-xs text-muted-foreground">Suggestions</p>
        </div>
      </div>
      
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          showSuggestions 
            ? 'max-h-96 opacity-100 my-2' 
            : 'max-h-0 opacity-0 my-0'
        }`}
      >
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <SuggestionItem
              key={suggestion.id}
              suggestion={suggestion}
              onClick={onSelectSuggestion}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 