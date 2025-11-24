"use client";

import { useState, useEffect, useRef } from "react";
import type { UserAnswer } from "@/lib/api";

interface Question {
  id: string;
  category: string;
  question_text: string;
  display_order: number;
  weight: number;
}

interface EditQuestionnaireFormProps {
  questions: Question[];
  existingAnswers: UserAnswer[];
  onSave: (questionId: string, answerText: string) => Promise<void>;
}

export default function EditQuestionnaireForm({
  questions,
  existingAnswers,
  onSave,
}: EditQuestionnaireFormProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});
  const [savedStates, setSavedStates] = useState<Record<string, boolean>>({});
  const timeoutsRef = useRef<Record<string, number>>({});

  // Sync existingAnswers to local state
  useEffect(() => {
    const initialAnswers: Record<string, string> = {};
    existingAnswers.forEach((answer) => {
      initialAnswers[answer.question_id] = answer.answer_text;
    });
    setAnswers(initialAnswers);
  }, [existingAnswers]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      Object.values(timeoutsRef.current).forEach((id) => clearTimeout(id));
    };
  }, []);

  const handleChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    // Clear saved state when user edits
    setSavedStates((prev) => ({ ...prev, [questionId]: false }));
  };

  const handleSave = async (questionId: string) => {
    const answerText = answers[questionId];
    if (!answerText || answerText.trim() === "") {
      alert("回答を入力してください");
      return;
    }

    setSavingStates((prev) => ({ ...prev, [questionId]: true }));
    try {
      await onSave(questionId, answerText);
      setSavedStates((prev) => ({ ...prev, [questionId]: true }));

      // Clear any existing timer for this question
      if (timeoutsRef.current[questionId]) {
        clearTimeout(timeoutsRef.current[questionId]);
      }

      // Set new timer to clear saved state after 2 seconds
      const timeoutId = window.setTimeout(() => {
        setSavedStates((prev) => ({ ...prev, [questionId]: false }));
        delete timeoutsRef.current[questionId];
      }, 2000);
      timeoutsRef.current[questionId] = timeoutId;
    } catch (error) {
      console.error("Failed to save answer:", error);
      alert(
        `保存に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setSavingStates((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {questions.map((question) => (
        <div
          key={question.id}
          className="rounded-lg border border-border bg-background p-6 shadow-sm"
        >
          <label
            htmlFor={question.id}
            className="mb-3 block text-lg font-semibold text-foreground"
          >
            {question.question_text}
          </label>
          <textarea
            id={question.id}
            value={answers[question.id] || ""}
            onChange={(e) => handleChange(question.id, e.target.value)}
            className="w-full rounded-md border border-border p-3 transition-colors focus:border-primary focus:ring-primary"
            rows={4}
            placeholder="ここに回答を入力してください..."
          />
          <div className="mt-3 flex items-center justify-between">
            <button
              onClick={() => handleSave(question.id)}
              disabled={savingStates[question.id]}
              className={`rounded-lg px-6 py-2 font-semibold text-white transition-colors ${
                savingStates[question.id]
                  ? "cursor-not-allowed bg-gray-400"
                  : "bg-primary hover:bg-primary-hover"
              }`}
            >
              {savingStates[question.id] ? "保存中..." : "保存"}
            </button>
            {savedStates[question.id] && (
              <span className="text-sm text-accent">✓ 保存しました</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
