"use client";

interface WelcomeSuggestionProps {
  onClick: (content: string) => void;
}

export function WelcomeSuggestions({ onClick }: WelcomeSuggestionProps) {
  const suggestions = [
    {
      title: "What is the initial investment required for a Spray-Net franchise?"
    },
    {
      title: "What territory rights do Spray-Net franchisees receive?"
    },
    {
      title: "Explain the royalty fees for a Spray-Net franchise"
    },
    {
      title: "What training and support does Spray-Net provide to franchisees?"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 max-w-4xl mx-auto w-full">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onClick(suggestion.title)}
          className="p-4 rounded-md bg-background/60 shadow-sm hover:bg-muted/50 transition-colors text-left w-full"
        >
          <div className="leading-relaxed">{suggestion.title}</div>
        </button>
      ))}
    </div>
  );
} 