"use client";

import { useState, type FormEvent } from "react";

interface Question {
  id: string;
  category: string;
  question_text: string;
  display_order: number;
  weight: number;
}

interface QuestionnaireFormProps {
  questions: Question[];
  onSubmit: (answers: Record<string, string>) => Promise<void>;
}

export default function QuestionnaireForm({
  questions,
  onSubmit,
}: QuestionnaireFormProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

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
    console.log("Form handleSubmit called");
    e.preventDefault();
    console.log("Validating...");
    if (!validate()) {
      console.log("Validation failed");
      return;
    }

    console.log("Validation passed, submitting...");
    setSubmitting(true);
    try {
      console.log("Calling onSubmit with answers:", answers);
      await onSubmit(answers);
      console.log("onSubmit completed");
    } catch (error) {
      console.error("Failed to submit:", error);
    } finally {
      setSubmitting(false);
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
        </div>
      ))}

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
    </form>
  );
}
