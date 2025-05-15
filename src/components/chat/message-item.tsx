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
import { useState } from "react";
import { CallbackForm } from "./callback-form";
import Image from "next/image";

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === "user";
  const hasCitations = message.citations && message.citations.length > 0;
  const [showCitations, setShowCitations] = useState(false);
  const [showCallbackButton, setShowCallbackButton] = useState(true);
  
  const { setShowCallbackForm, showCallbackForm, activeCallbackMessageId } = useChatStore();
  
  // Check if this message has the callback form active
  const hasActiveCallback = !isUser && message.needsCallback && activeCallbackMessageId === message.id;
  
  // Pre-process the message content to convert emoji shortcodes that might not be handled by remark-emoji
  const processedContent = joypixels.shortnameToUnicode(message.content);
  
  // Check if this is a callback confirmation message
  const isCallbackConfirmation = !isUser && processedContent.startsWith('📞 Thank you for submitting your callback request');
  
  const handleRequestCallback = () => {
    setShowCallbackForm(true, message.id);
    setShowCallbackButton(false);
  };
  
  const handleCloseCallbackForm = () => {
    setShowCallbackForm(false);
    // Keep the button hidden after closing
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
                ? "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-800 border ml-3"
                : "bg-muted ml-3"
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
                {/* Callback button for low quality answers */}
                {!isUser && message.needsCallback && showCallbackButton && (
                  <button 
                    onClick={handleRequestCallback}
                    className="text-xs text-primary/80 hover:text-primary flex items-center gap-1"
                    title={message.callbackReason || "Request callback for this question"}
                  >
                    <Phone className="w-3 h-3" />
                    Request callback
                  </button>
                )}
                
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
      
      {/* Callback form */}
      {hasActiveCallback && !isCallbackConfirmation && (
        <div className="ml-8 mr-8 mt-2">
          <CallbackForm 
            messageId={message.id} 
            onClose={handleCloseCallbackForm} 
          />
        </div>
      )}
    </div>
  );
} 