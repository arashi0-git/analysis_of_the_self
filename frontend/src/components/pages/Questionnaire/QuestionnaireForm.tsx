"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";

interface Question {
  id: string;
  category: string;
  question_text: string;
  display_order: number;
  weight: number;
}

interface UserAnswer {
  id: string;
  user_id: string;
  question_id: string;
  answer_text: string;
  embedding_id: string | null;
}

interface QuestionnaireFormProps {
  questions: Question[];
  existingAnswers?: UserAnswer[];
  onSubmit: (answers: Record<string, string>) => Promise<void>;
  onSaveIndividual?: (questionId: string, answer: string) => Promise<void>;
}

export default function QuestionnaireForm({
  questions,
  existingAnswers,
  onSubmit,
  onSaveIndividual,
}: QuestionnaireFormProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});
  const [savedStates, setSavedStates] = useState<Record<string, boolean>>({});
  const timeoutsRef = useRef<Record<string, number>>({});

  const hasExistingAnswers = existingAnswers && existingAnswers.length > 0;

  // Initialize answers from existing answers
  useEffect(() => {
    if (existingAnswers && existingAnswers.length > 0) {
      const initialAnswers: Record<string, string> = {};
      existingAnswers.forEach((answer) => {
        initialAnswers[answer.question_id] = answer.answer_text;
      });
      setAnswers(initialAnswers);
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
