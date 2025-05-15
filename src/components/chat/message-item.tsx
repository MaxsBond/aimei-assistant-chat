"use client";

import { Message, useChatStore } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import { Bot, User, BookOpen, Check, AlertCircle, Phone, CheckCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import { Components } from "react-markdown";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkEmoji from "remark-emoji";
import * as joypixels from 'emoji-toolkit';
import { useState, useEffect } from "react";
import { CallbackForm } from "./callback-form";
import Image from "next/image";
import CalendlyTrigger from "../calendly/calendly-trigger";
import { Button } from "@/components/ui/button";
import { validatePhoneNumber, formatPhoneNumber } from "@/lib/validation";

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === "user";
  const hasCitations = message.citations && message.citations.length > 0;
  const [showCitations, setShowCitations] = useState(false);
  const [showCallbackButton, setShowCallbackButton] = useState(true);
  const [showInlineCallbackForm, setShowInlineCallbackForm] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [formattedNumber, setFormattedNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const { setShowCallbackForm, showCallbackForm, activeCallbackMessageId, addCallbackRequest, addMessage, messages } = useChatStore();
  
  // Check if this message has the callback form active
  const hasActiveCallback = !isUser && message.needsCallback && activeCallbackMessageId === message.id;
  
  // Pre-process the message content to convert emoji shortcodes that might not be handled by remark-emoji
  const processedContent = joypixels.shortnameToUnicode(message.content);
  
  // Check if this is a callback confirmation message
  const isCallbackConfirmation = !isUser && processedContent.startsWith('📞 Thank you for submitting your callback request');
  
  // Format the phone number as it's typed
  useEffect(() => {
    if (phoneNumber) {
      setFormattedNumber(formatPhoneNumber(phoneNumber));
    }
  }, [phoneNumber]);
  
  // Initialize the inline form visibility on mount
  useEffect(() => {
    if (!isUser && message.needsCallback && !isCallbackConfirmation) {
      setShowInlineCallbackForm(true);
    }
  }, [message.needsCallback, isUser, isCallbackConfirmation]);

  // Check if there's already a callback confirmation for this message in the chat
  const hasExistingConfirmation = useEffect(() => {
    if (!isUser && message.needsCallback) {
      // Look for confirmation messages that might be related to this message
      const confirmationExists = messages.some(m => 
        m.role === "assistant" && 
        m.content.startsWith('📞 Thank you for submitting your callback request') &&
        m.content.includes(message.id)
      );
      
      if (confirmationExists) {
        setIsSubmitted(true);
        setShowInlineCallbackForm(false);
      }
    }
  }, [messages, message.id, message.needsCallback, isUser]);
  
  // Extract topic from the query for more personalized confirmation
  const getTopic = () => {
    const firstSentence = message.content.split(/[.!?]/)[0];
    const shortTopic = firstSentence.length > 40 
      ? firstSentence.substring(0, 40) + '...' 
      : firstSentence;
    return shortTopic;
  };
  
  const handleRequestCallback = () => {
    setShowInlineCallbackForm(true);
    setShowCallbackButton(false);
  };
  
  const handleCloseCallbackForm = () => {
    setShowCallbackForm(false);
    setShowInlineCallbackForm(false);
    // Keep the button hidden after closing
  };

  const handleSubmitCallback = async (e: React.FormEvent) => {
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
          messageId: message.id, 
          query: message.content 
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit callback request');
      }
      
      // Update local state in Zustand store
      addCallbackRequest(formattedNumber || phoneNumber, message.content, message.id);
      
      // Add confirmation message to the chat
      const displayNumber = formattedNumber || phoneNumber;
      const topic = getTopic();
      
      addMessage(
        `📞 Thank you for submitting your callback request! 
        
We've received your phone number (${displayNumber}) and will call you as soon as possible regarding: "${topic}"

Our team is reviewing your question and will typically respond within 24-48 hours. For urgent matters, you can expect a call within the next business day.`,
        "assistant"
      );
      
      // Hide the form and mark as submitted
      setShowInlineCallbackForm(false);
      setIsSubmitted(true);
      
    } catch (error) {
      console.error("Error submitting callback request:", error);
      setErrorMessage(error instanceof Error ? error.message : "There was an error submitting your request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="mb-4">
      <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
        {/* Avatar for assistant/system messages */}
        {!isUser && (
          <div className="flex-shrink-0 w-8 h-8 overflow-hidden rounded-full flex items-center justify-center">
            <Image 
              src="/rectangle-avatar.svg" 
              alt="AI Assistant"
              width={32} 
              height={32}
              className="rounded-full"
            />
          </div>
        )}
        
        {/* Message content */}
        <div
          className={`rounded-lg p-3 max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-[80%] ${
            isUser
              ? "bg-primary text-primary-foreground"
              : isCallbackConfirmation
                ? "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-800 border"
                : "bg-muted"
          }`}
        >
          {isCallbackConfirmation ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div className="flex items-center gap-2 mb-2 text-green-700 dark:text-green-400 font-medium">
                <CheckCircle className="w-5 h-5" />
                <span>Callback Request Confirmed</span>
              </div>
              <p>{processedContent}</p>
            </div>
          ) : (
            <>
              <div className="prose prose-sm sm:prose-sm md:prose-sm lg:prose-base dark:prose-invert max-w-none">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm, [remarkEmoji, { emoticon: true }]]}
                  rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeSlug]}
                  components={{
                    // Custom rendering for links to open in new tab
                    a: ({ href, children, ...props }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline" {...props}>
                        {children}
                      </a>
                    ),
                    // Custom heading elements with appropriate styling
                    h1: ({ children, ...props }) => (
                      <h1 className="text-xl sm:text-xl md:text-2xl font-bold mt-6 mb-4 pb-1 border-b" {...props}>
                        {children}
                      </h1>
                    ),
                    h2: ({ children, ...props }) => (
                      <h2 className="text-lg sm:text-lg md:text-xl font-bold mt-5 mb-3" {...props}>
                        {children}
                      </h2>
                    ),
                    h3: ({ children, ...props }) => (
                      <h3 className="text-base sm:text-base md:text-lg font-bold mt-4 mb-2" {...props}>
                        {children}
                      </h3>
                    ),
                    h4: ({ children, ...props }) => (
                      <h4 className="text-sm sm:text-sm md:text-base font-bold mt-3 mb-2" {...props}>
                        {children}
                      </h4>
                    ),
                    h5: ({ children, ...props }) => (
                      <h5 className="text-xs sm:text-xs md:text-sm font-bold mt-3 mb-1" {...props}>
                        {children}
                      </h5>
                    ),
                    h6: ({ children, ...props }) => (
                      <h6 className="text-xs sm:text-xs md:text-sm font-semibold italic mt-3 mb-1" {...props}>
                        {children}
                      </h6>
                    ),
                    // Proper code block styling
                    code: ({ className, children, ...props }: any) => {
                      const { inline } = props;
                      if (inline) {
                        return (
                          <code className={`${className} px-1 py-0.5 rounded bg-muted-foreground/10 text-xs sm:text-sm md:text-base`} {...props}>
                            {children}
                          </code>
                        );
                      }
                      return (
                        <code className={`${className} block text-xs sm:text-xs md:text-sm`} {...props}>
                          {children}
                        </code>
                      );
                    },
                    // Custom rendering for pre tags (code blocks)
                    pre: ({ children, ...props }) => (
                      <pre className="p-0 rounded-md bg-muted-foreground/10 overflow-auto text-xs sm:text-xs md:text-sm" {...props}>
                        {children}
                      </pre>
                    ),
                    // Custom list styling for proper nesting
                    ul: ({ children, depth = 0, ...props }: any) => (
                      <ul className="pl-5 list-disc space-y-1 my-3 text-sm sm:text-sm md:text-base" {...props}>
                        {children}
                      </ul>
                    ),
                    ol: ({ children, ...props }) => (
                      <ol className="pl-5 list-decimal space-y-1 my-3 text-sm sm:text-sm md:text-base" {...props}>
                        {children}
                      </ol>
                    ),
                    li: ({ children, ordered, depth, index, ...props }: any) => {
                      return (
                        <li className="my-1" {...props}>
                          {children}
                        </li>
                      );
                    },
                    // Add custom paragraph rendering with responsive text size
                    p: ({ children, ...props }) => (
                      <p className="my-2 text-sm sm:text-sm md:text-base" {...props}>
                        {children}
                      </p>
                    ),
                    // Better table styling
                    table: ({ children, ...props }) => (
                      <div className="overflow-x-auto my-4">
                        <table className="min-w-full border-collapse border border-border" {...props}>
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children, ...props }) => (
                      <thead className="bg-muted/50" {...props}>
                        {children}
                      </thead>
                    ),
                    tbody: ({ children, ...props }) => (
                      <tbody className="divide-y divide-border" {...props}>
                        {children}
                      </tbody>
                    ),
                    tr: ({ children, ...props }) => (
                      <tr className="hover:bg-muted/20" {...props}>
                        {children}
                      </tr>
                    ),
                    th: ({ children, ...props }) => (
                      <th className="px-2 sm:px-3 md:px-4 py-2 text-left font-medium text-xs sm:text-sm md:text-base" {...props}>
                        {children}
                      </th>
                    ),
                    td: ({ children, ...props }) => (
                      <td className="px-2 sm:px-3 md:px-4 py-2 border-border text-xs sm:text-sm md:text-base" {...props}>
                        {children}
                      </td>
                    ),
                    // Blockquote styling
                    blockquote: ({ children, ...props }) => (
                      <blockquote className="pl-4 border-l-4 border-primary/30 italic my-4 text-sm sm:text-sm md:text-base" {...props}>
                        {children}
                      </blockquote>
                    ),
                  }}
                >
                  {processedContent}
                </ReactMarkdown>
              </div>
              
              {/* Display Calendly trigger if message has showCalendly flag */}
              {!isUser && message.showCalendly && (
                <div className="mt-3">
                  <CalendlyTrigger buttonText="Schedule a Meeting" dialogTitle="Book a Meeting Time" />
                </div>
              )}
              
              {/* Display inline callback form directly only if not already submitted */}
              {!isUser && message.needsCallback && !isCallbackConfirmation && !isSubmitted && (
                <div className="mt-3 border-t pt-3 border-primary/10">
                  <div className="mb-2 flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-primary" />
                    <span className="font-medium text-sm">Enter your phone number</span>
                  </div>
                  
                  {errorMessage && (
                    <div className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 p-2 rounded-md mb-2 flex items-center text-xs">
                      <AlertCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                      {errorMessage}
                    </div>
                  )}
                  
                  <form onSubmit={handleSubmitCallback} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+1 (123) 456-7890"
                        className="w-full p-2 text-sm rounded-md border bg-background focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      size="sm"
                    >
                      {isSubmitting ? "Submitting..." : "Submit"}
                    </Button>
                  </form>
                </div>
              )}
              
              {/* Show a notice when already submitted */}
              {!isUser && message.needsCallback && !isCallbackConfirmation && isSubmitted && (
                <div className="mt-3 border-t pt-3 border-primary/10">
                  <div className="flex items-center text-sm text-green-700 dark:text-green-400">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    <span>Callback request submitted</span>
                  </div>
                </div>
              )}
              
              {/* Display confidence level if available */}
              {!isUser && message.confidence !== undefined && (
                <div className={`flex items-center gap-1 text-xs mb-1 ${
                  message.confidence > 0.8 ? "text-green-600" : 
                  message.confidence > 0.5 ? "text-yellow-600" : "text-red-600"
                }`}>
                  {message.confidence > 0.8 ? (
                    <Check className="w-3 h-3" />
                  ) : message.confidence > 0.5 ? (
                    <BookOpen className="w-3 h-3" />
                  ) : (
                    <AlertCircle className="w-3 h-3" />
                  )}
                  <span>
                    {message.confidence > 0.8 ? "High confidence" : 
                    message.confidence > 0.5 ? "Moderate confidence" : "Low confidence"}
                  </span>
                </div>
              )}
            </>
          )}
          
          {/* Citation toggle and timestamp */}
          <div className="flex justify-between items-center text-xs mt-1">
            <div className={`${isUser ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
              {formatDate(message.timestamp)}
            </div>
            
            {!isCallbackConfirmation && (
              <div className="flex gap-2">
                {/* Citations button */}
                {hasCitations && !isUser && (
                  <button 
                    onClick={() => setShowCitations(!showCitations)}
                    className="text-xs text-primary/80 hover:text-primary flex items-center gap-1"
                  >
                    <BookOpen className="w-3 h-3" />
                    {showCitations ? "Hide sources" : "Show sources"}
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Citations section */}
          {hasCitations && showCitations && !isUser && !isCallbackConfirmation && (
            <div className="mt-3 pt-2 border-t border-muted-foreground/20">
              <h4 className="text-xs font-semibold mb-2 text-muted-foreground">Sources:</h4>
              <ul className="space-y-2">
                {message.citations?.map((citation, index) => (
                  <li key={index} className="text-xs">
                    <div className="font-medium">{citation.metadata.title || citation.metadata.source}</div>
                    {citation.metadata.url && (
                      <a 
                        href={citation.metadata.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary text-xs hover:underline"
                      >
                        {citation.metadata.url}
                      </a>
                    )}
                    <div className="mt-1 italic text-muted-foreground text-xs">
                      "{citation.text}"
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {/* Avatar for user messages */}
        {isUser && (
          <div className="flex-shrink-0 w-8 h-8 overflow-hidden rounded-full flex items-center justify-center">
            <Image 
              src="/user-avatar.svg" 
              alt="User"
              width={32} 
              height={32}
              className="rounded-full"
            />
          </div>
        )}
      </div>
    </div>
  );
} 