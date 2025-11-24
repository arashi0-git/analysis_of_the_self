"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QuestionnaireForm from "@/components/pages/Questionnaire/QuestionnaireForm";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

interface Question {
  id: string;
  category: string;
  question_text: string;
  display_order: number;
  weight: number;
}

export default function QuestionnairePage() {
  const router = useRouter();
  const { token } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/questions`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch questions");
        }
        const data = await response.json();
        setQuestions(data.questions);
      } catch (err) {
        setLoadError(
          err instanceof Error ? err.message : "An unknown error occurred",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  const handleSubmit = async (answers: Record<string, string>) => {
    if (!token) {
      setSubmitError(
        "認証トークンが見つかりません。再度ログインしてください。",
      );
      return;
    }

    try {
      console.log("Submitting answers:", answers);
      const formattedAnswers = Object.entries(answers).map(
        ([questionId, answerText]) => ({
          question_id: questionId,
          answer_text: answerText,
        }),
      );

      console.log("Formatted answers:", formattedAnswers);
      console.log(
        "API URL:",
        `${process.env.NEXT_PUBLIC_API_URL}/answers/submit`,
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/answers/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ answers: formattedAnswers }),
        },
      );

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`Failed to submit answers: ${response.status}`);
      }

      const result = await response.json();
      console.log("Submit result:", result);

      // Redirect to analysis page
      router.push("/analysis");
    } catch (err) {
      console.error("Submit error:", err);
      setSubmitError(
        err instanceof Error ? err.message : "Failed to submit answers",
      );
      alert(
        `エラーが発生しました: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl">Loading questions...</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl text-red-500">Error: {loadError}</div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-4xl font-bold">自己分析質問</h1>
        {submitError && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-4">
            <p className="text-red-700">エラー: {submitError}</p>
          </div>
        )}
        <p className="mb-8 text-gray-600">
          以下の質問に回答してください。回答内容を元に、あなたの強みや価値観を分析します。
        </p>
        <QuestionnaireForm questions={questions} onSubmit={handleSubmit} />
      </div>
    </ProtectedRoute>
  );
}
