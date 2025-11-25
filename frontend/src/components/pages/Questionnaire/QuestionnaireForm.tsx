"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import Link from "next/link";
import type { UserAnswer, AnswerFeedbackResponse } from "@/lib/api";

interface Question {
  id: string;
  category: string;
  question_text: string;
  display_order: number;
  weight: number;
  has_deep_dive: boolean;
}

interface QuestionnaireFormProps {
  questions: Question[];
  existingAnswers?: UserAnswer[];
  onSubmit: (answers: Record<string, string>) => Promise<void>;
  onSaveIndividual?: (questionId: string, answer: string) => Promise<void>;
  onGetFeedback?: (
    questionId: string,
    answerText: string,
  ) => Promise<AnswerFeedbackResponse>;
}

export default function QuestionnaireForm({
  questions,
  existingAnswers,
  onSubmit,
  onSaveIndividual,
  onGetFeedback,
}: QuestionnaireFormProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});
  const [savedStates, setSavedStates] = useState<Record<string, boolean>>({});
  const [feedbackStates, setFeedbackStates] = useState<
    Record<
      string,
      {
        loading: boolean;
        data: { feedback: string; suggestions: string[] } | null;
      }
    >
  >({});
  const timeoutsRef = useRef<Record<string, number>>({});

  const hasExistingAnswers = !!existingAnswers?.length;

  // Initialize answers from existing answers
  useEffect(() => {
    if (existingAnswers && existingAnswers.length > 0) {
      setAnswers((prev) => {
        // If user has already started typing (answers is not empty), don't overwrite
        if (Object.keys(prev).length > 0) {
          return prev;
        }
        const initialAnswers: Record<string, string> = {};
        existingAnswers.forEach((answer) => {
          initialAnswers[answer.question_id] = answer.answer_text;
        });
        return initialAnswers;
      });
    }
  }, [existingAnswers]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(timeoutsRef.current).forEach((id) => clearTimeout(id));
    };
  }, []);

  const handleChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    // Clear error when user starts typing
    if (errors[questionId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
    // Clear saved state when user edits
    setSavedStates((prev) => ({ ...prev, [questionId]: false }));
    // Clear feedback when user edits
    setFeedbackStates((prev) => ({
      ...prev,
      [questionId]: { loading: false, data: null },
    }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    questions.forEach((question) => {
      if (!answers[question.id] || answers[question.id].trim() === "") {
        newErrors[question.id] = "この質問への回答は必須です";
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(answers);
    } catch (error) {
      console.error("Failed to submit:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveIndividual = async (questionId: string) => {
    if (!onSaveIndividual) return;

    const answerText = answers[questionId];
    if (!answerText || answerText.trim() === "") {
      setErrors((prev) => ({
        ...prev,
        [questionId]: "回答を入力してください",
      }));
      return;
    }

    setSavingStates((prev) => ({ ...prev, [questionId]: true }));
    try {
      await onSaveIndividual(questionId, answerText);
      setSavedStates((prev) => ({ ...prev, [questionId]: true }));
      // Clear error on success
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });

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
      setErrors((prev) => ({
        ...prev,
        [questionId]:
          error instanceof Error
            ? error.message
            : "保存に失敗しました。もう一度お試しください。",
      }));
    } finally {
      setSavingStates((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  const handleGetFeedback = async (questionId: string) => {
    if (!onGetFeedback) return;

    const answerText = answers[questionId];
    if (!answerText || answerText.trim() === "") {
      setErrors((prev) => ({
        ...prev,
        [questionId]: "回答を入力してからフィードバックを取得してください",
      }));
      return;
    }

    setFeedbackStates((prev) => ({
      ...prev,
      [questionId]: { loading: true, data: null },
    }));

    try {
      const feedback = await onGetFeedback(questionId, answerText);
      setFeedbackStates((prev) => ({
        ...prev,
        [questionId]: { loading: false, data: feedback },
      }));
      // Clear error on success
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    } catch (error) {
      console.error("Failed to get feedback:", error);
      setFeedbackStates((prev) => ({
        ...prev,
        [questionId]: { loading: false, data: null },
      }));
      setErrors((prev) => ({
        ...prev,
        [questionId]:
          error instanceof Error
            ? error.message
            : "フィードバックの取得に失敗しました。",
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
            className={`w-full rounded-md border p-3 transition-colors ${
              errors[question.id]
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-border focus:border-primary focus:ring-primary"
            }`}
            rows={4}
            placeholder="ここに回答を入力してください..."
          />
          {errors[question.id] && (
            <p className="mt-2 text-sm text-red-500">{errors[question.id]}</p>
          )}

          {/* Individual save button for edit mode */}
          {hasExistingAnswers && onSaveIndividual && (
            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleSaveIndividual(question.id)}
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
          )}

          {/* AI Feedback button (for questions 1-3) */}
          {onGetFeedback && !question.has_deep_dive && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => handleGetFeedback(question.id)}
                disabled={feedbackStates[question.id]?.loading}
                className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white hover:bg-secondary/90 transition-colors disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {feedbackStates[question.id]?.loading
                  ? "AI分析中..."
                  : "💡 AI フィードバック"}
              </button>
            </div>
          )}

          {/* Deep-dive button (for questions 4-7) */}
          {question.has_deep_dive && (
            <div className="mt-3">
              <Link
                href={`/episode/${question.id}`}
                className="inline-block rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90 transition-colors"
              >
                🔍 エピソードを深堀する
              </Link>
            </div>
          )}

          {/* AI Feedback display */}
          {feedbackStates[question.id]?.data && (
            <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-4">
              <h4 className="font-semibold text-blue-900 mb-2">
                💡 AI からのアドバイス
              </h4>
              <p className="text-sm text-blue-800 whitespace-pre-wrap mb-3">
                {feedbackStates[question.id]?.data?.feedback || ""}
              </p>
              {feedbackStates[question.id]?.data?.suggestions &&
                feedbackStates[question.id]!.data!.suggestions.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-blue-200">
                    <h5 className="text-xs font-semibold text-blue-900 mb-1">
                      具体的な改善案:
                    </h5>
                    <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                      {feedbackStates[question.id]!.data!.suggestions.map(
                        (suggestion, index) => (
                          <li key={index}>{suggestion}</li>
                        ),
                      )}
                    </ul>
                  </div>
                )}
            </div>
          )}
        </div>
      ))}

      {/* Bulk submit button for initial submission */}
      {!hasExistingAnswers && (
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={submitting}
            className={`rounded-lg px-8 py-3 font-semibold text-white transition-colors shadow-lg ${
              submitting
                ? "cursor-not-allowed bg-gray-400"
                : "bg-primary hover:bg-primary-hover"
            }`}
          >
            {submitting ? "送信中..." : "回答を送信"}
          </button>
        </div>
      )}
    </form>
  );
}
