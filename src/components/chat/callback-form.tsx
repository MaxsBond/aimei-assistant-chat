"use client";

import { useState, useEffect } from "react";
import { useChatStore } from "@/lib/store";
import { Phone, X, CheckCircle, AlertCircle } from "lucide-react";
import { validatePhoneNumber, formatPhoneNumber } from "@/lib/validation";

interface CallbackFormProps {
  messageId: string;
  onClose: () => void;
}

export function CallbackForm({ messageId, onClose }: CallbackFormProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [formattedNumber, setFormattedNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const { addCallbackRequest, messages, addMessage } = useChatStore();
  
  // Find the message that triggered the callback
  const message = messages.find(msg => msg.id === messageId);
  const query = message?.content || "your question";
  
  // Extract topic from the query for more personalized confirmation
  const getTopic = () => {
    // Extract a brief topic from the query (first few words or first sentence)
    const firstSentence = query.split(/[.!?]/)[0];
    const shortTopic = firstSentence.length > 40 
      ? firstSentence.substring(0, 40) + '...' 
      : firstSentence;
    return shortTopic;
  };
  
  // Format the phone number as it's typed
  useEffect(() => {
    if (phoneNumber) {
      setFormattedNumber(formatPhoneNumber(phoneNumber));
    }
  }, [phoneNumber]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    
    // Validate phone number
    const { isValid, error } = validatePhoneNumber(phoneNumber);
    if (!isValid) {
      setErrorMessage(error || "Please enter a valid phone number");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Send the request to our API endpoint
      const response = await fetch('/api/callback-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phoneNumber: formattedNumber || phoneNumber, 
          messageId, 
          query 
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit callback request');
      }
      
      // Update local state in Zustand store
      addCallbackRequest(formattedNumber || phoneNumber, query, messageId);
      
      // Add confirmation message to the chat
      const displayNumber = formattedNumber || phoneNumber;
      const topic = getTopic();
      
      addMessage(
        `📞 Thank you for submitting your callback request! 
        
We've received your phone number (${displayNumber}) and will call you as soon as possible regarding: "${topic}"

Our team is reviewing your question and will typically respond within 24-48 hours. For urgent matters, you can expect a call within the next business day.`,
        "assistant"
      );
      
      // Show success state
      setIsSubmitted(true);
      
      // Close the form after a delay
      setTimeout(() => {
        onClose();
      }, 3000);
      
    } catch (error) {
      console.error("Error submitting callback request:", error);
      setErrorMessage(error instanceof Error ? error.message : "There was an error submitting your request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isSubmitted) {
    return (
      <div className="bg-primary/5 border rounded-lg p-4 mb-4 flex flex-col items-center">
        <div className="flex items-center text-green-600 mb-2">
          <CheckCircle className="w-5 h-5 mr-2" />
          <h3 className="font-medium">Callback Request Received</h3>
        </div>
        <p className="text-sm text-center mb-1">
          We'll call you at {formattedNumber || phoneNumber} as soon as we have an answer.
        </p>
        <p className="text-xs text-muted-foreground text-center">
          Thank you for your patience.
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-primary/5 border rounded-lg p-4 mb-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center">
          <Phone className="w-5 h-5 text-primary mr-2" />
          <h3 className="font-medium">Request a Callback</h3>
        </div>
        <button 
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Close callback form"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <p className="text-sm mb-3">
        We don't have a complete answer from our knowledge base. 
        Leave your phone number, and we'll call you back when we have the information you need.
      </p>
      
      {errorMessage && (
        <div className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 p-2 rounded-md mb-3 flex items-center text-sm">
          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
          {errorMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label htmlFor="phone" className="block text-xs font-medium mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+1 (123) 456-7890"
            className="w-full p-2 rounded-md border bg-background focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
            disabled={isSubmitting}
            required
          />
          {formattedNumber && phoneNumber !== formattedNumber && (
            <div className="text-xs text-muted-foreground mt-1">
              Will be formatted as: {formattedNumber}
            </div>
          )}
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 focus:ring-2 focus:ring-primary/50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Submitting..." : "Request Callback"}
        </button>
      </form>
    </div>
  );
} 