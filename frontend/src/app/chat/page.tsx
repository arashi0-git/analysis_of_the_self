"use client";

import React from "react";
import { ChatWindow } from "@/components/shared/Chat/ChatWindow";

export default function ChatPage() {
  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-xl font-bold text-gray-800">AI Career Counselor</h1>
      </header>
      <main className="flex-1 overflow-hidden">
        <ChatWindow />
      </main>
    </div>
  );
}
