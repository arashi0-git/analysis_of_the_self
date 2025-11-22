"use client";

import React, { useState } from "react";
import { ChatWindow, Message } from "@/components/shared/Chat/ChatWindow";
import { generateAnswer } from "@/lib/api";

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingRequestId, setPendingRequestId] = useState<number>(0);

  const handleSendMessage = async (text: string) => {
    const requestId = Date.now();
    setPendingRequestId(requestId);

    try {
      const result = await generateAnswer(text);

      // 最新のリクエストのみ処理（古いレスポンスを無視）
      setPendingRequestId((currentId) => {
        if (requestId < currentId) {
          return currentId; // より新しいリクエストがあるため無視
        }

        const aiMessage: Message = {
          id: `ai-${requestId}-${Math.random().toString(36).substring(2, 11)}`,
          role: "ai",
          content: result.answer_text,
          reasoning: result.reasoning,
        };

        setMessages((prev) => [...prev, aiMessage]);
        return currentId;
      });
    } catch (error) {
      console.error("Failed to generate answer:", error);

      // エラーの場合も最新のリクエストのみ処理
      setPendingRequestId((currentId) => {
        if (requestId < currentId) {
          return currentId;
        }

        const errorMessage: Message = {
          id: `error-${requestId}-${Math.random().toString(36).substring(2, 11)}`,
          role: "ai",
          content: "申し訳ありません。回答の生成中にエラーが発生しました。",
          reasoning: error instanceof Error ? error.message : "Unknown error",
        };
        setMessages((prev) => [...prev, errorMessage]);
        return currentId;
      });
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
