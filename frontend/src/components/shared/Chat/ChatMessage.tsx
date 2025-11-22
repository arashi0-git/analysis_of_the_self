import React from "react";
import ReactMarkdown from "react-markdown";

type MessageRole = "user" | "ai";

interface ChatMessageProps {
  role: MessageRole;
  content: string;
  reasoning?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  reasoning,
}) => {
  const isUser = role === "user";

  return (
    <div
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-4`}
    >
      <div
        className={`max-w-[80%] rounded-lg p-4 ${
          isUser
            ? "bg-blue-600 text-white rounded-br-none"
            : "bg-gray-100 text-gray-800 rounded-bl-none"
        }`}
      >
        {!isUser && reasoning && (
          <div className="mb-3 p-3 bg-white rounded border border-gray-200 text-sm text-gray-600">
            <p className="font-semibold text-xs text-gray-400 mb-1 uppercase tracking-wider">
              Thinking Process
            </p>
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{reasoning}</ReactMarkdown>
            </div>
          </div>
        )}
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};
