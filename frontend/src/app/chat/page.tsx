"use client";

import React, { useState } from "react";
import { ChatWindow, Message } from "@/components/shared/Chat/ChatWindow";
import { generateAnswer } from "@/lib/api";

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);

  const handleSendMessage = async (text: string) => {
    try {
      const result = await generateAnswer(text);

      const aiMessage: Message = {
        id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: "ai",
        content: result.answer_text,
        reasoning: result.reasoning,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Failed to generate answer:", error);
      const errorMessage: Message = {
        id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: "ai",
        content: "申し訳ありません。回答の生成中にエラーが発生しました。",
        reasoning: error instanceof Error ? error.message : "Unknown error",
      };
      setMessages((prev) => [...prev, errorMessage]);
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
        />
      </main>
    </div>
  );
}
