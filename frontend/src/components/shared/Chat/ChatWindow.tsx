import React, { useState, useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";

export interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  reasoning?: string;
}

interface ChatWindowProps {
  messages?: Message[];
  setMessages?: React.Dispatch<React.SetStateAction<Message[]>>;
  onSendMessage?: (message: string) => Promise<void>;
  isLoading?: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages: externalMessages,
  setMessages: externalSetMessages,
  onSendMessage,
  isLoading: externalIsLoading,
}) => {
  const [internalMessages, setInternalMessages] = useState<Message[]>([]);
  const messages = externalMessages ?? internalMessages;
  const setMessages = externalSetMessages ?? setInternalMessages;
  const [internalIsLoading, setInternalIsLoading] = useState(false);
  const isLoading = externalIsLoading ?? internalIsLoading;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string) => {
    try {
      if (onSendMessage) {
        await onSendMessage(text);
      } else {
        // Mock response for UI testing if no handler provided
        setTimeout(() => {
          const aiMessage: Message = {
            id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            role: "ai",
            content: `Echo: ${text}`,
            reasoning: "This is a mock reasoning process.",
          };
          setMessages((prev) => [...prev, aiMessage]);
        }, 1000);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            role={msg.role}
            content={msg.content}
            reasoning={msg.reasoning}
          />
        ))}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-100 rounded-lg p-4 rounded-bl-none">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
};
