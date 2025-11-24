"use client";

import React, { useState } from "react";
import { ChatWindow, Message } from "@/components/shared/Chat/ChatWindow";
import { generateAnswer } from "@/lib/api";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

export default function ChatPage() {
  const { token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSendMessage = async (text: string) => {
    if (isLoading || !token) return;
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
      const result = await generateAnswer(text, token);

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
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            AIチャット
          </h1>
          <p className="text-lg text-foreground/70">
            あなたの自己分析結果をもとに、AIがパーソナライズされたアドバイスを提供します。
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background shadow-sm">
          <ChatWindow
            messages={messages}
            setMessages={setMessages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}
