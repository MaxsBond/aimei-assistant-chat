"use client";

import { Suggestion } from "@/lib/store";

interface SuggestionItemProps {
  suggestion: Suggestion;
  onClick: (suggestion: Suggestion) => void;
}

export function SuggestionItem({ suggestion, onClick }: SuggestionItemProps) {
  return (
    <button
      onClick={() => onClick(suggestion)}
      className="px-3 py-2 bg-background/60 hover:bg-muted text-sm rounded-md border shadow-sm transition-colors whitespace-normal text-left"
    >
      {suggestion.content}
    </button>
  );
} 