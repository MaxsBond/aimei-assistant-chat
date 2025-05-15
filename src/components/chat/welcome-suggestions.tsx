"use client";

import { useEffect, useState } from "react";

interface WelcomeSuggestionProps {
  onClick: (content: string) => void;
}

export function WelcomeSuggestions({ onClick }: WelcomeSuggestionProps) {
  // All available suggestions
  const allSuggestions = [
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

  // State to hold visible suggestions based on screen size
  const [visibleSuggestions, setVisibleSuggestions] = useState(allSuggestions);

  // Update suggestions when window resizes
  useEffect(() => {
    const handleResize = () => {
      // For mobile (< 640px) show only first 2 suggestions
      if (window.innerWidth < 640) {
        setVisibleSuggestions(allSuggestions.slice(0, 2));
      } else {
        // For larger screens show all suggestions
        setVisibleSuggestions(allSuggestions);
      }
    };

    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 sm:mt-8 max-w-4xl mx-auto w-full">
      {visibleSuggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onClick(suggestion.title)}
          className="p-3 sm:p-4 rounded-md bg-background/60 shadow-sm hover:bg-muted/50 transition-colors text-left w-full text-sm sm:text-base"
        >
          <div className="leading-relaxed">{suggestion.title}</div>
        </button>
      ))}
    </div>
  );
} 