"use client";

import React, { useState } from "react";
import { ChatWindow, Message } from "@/components/shared/Chat/ChatWindow";
import { generateAnswer } from "@/lib/api";

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSendMessage = async (text: string) => {
    if (isLoading) return;
    setIsLoading(true);
    const requestId = Date.now();

    // ユーザーメッセージを追加
    const userMessage: Message = {
      id: `user-${requestId}-${Math.random().toString(36).substring(2, 11)}`,
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const result = await generateAnswer(text);

      // AIメッセージを追加
      const aiMessage: Message = {
        id: `ai-${requestId}-${Math.random().toString(36).substring(2, 11)}`,
        role: "ai",
        content: result.answer_text,
        reasoning: result.reasoning,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Failed to generate answer:", error);

      const errorMessage: Message = {
        id: `error-${requestId}-${Math.random().toString(36).substring(2, 11)}`,
        role: "ai",
        content: "申し訳ありません。回答の生成中にエラーが発生しました。",
        reasoning: error instanceof Error ? error.message : "Unknown error",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-xl font-bold text-gray-800">AI Career Counselor</h1>
      </header>
      <main className="flex-1 overflow-hidden">
        <ChatWindow
          messages={messages}
          setMessages={setMessages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </main>
    </div>
  );
}
