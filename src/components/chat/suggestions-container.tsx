"use client";

import { SuggestionItem } from "./suggestion-item";
import { Suggestion } from "@/lib/store";

interface SuggestionsContainerProps {
  suggestions: Suggestion[];
  onSelectSuggestion: (suggestion: Suggestion) => void;
}

export function SuggestionsContainer({
  suggestions,
  onSelectSuggestion,
}: SuggestionsContainerProps) {
  if (!suggestions.length) return null;

  return (
    <div className="mb-4">
      <p className="text-xs text-muted-foreground mb-2">Suggested follow-ups:</p>
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
  );
} 