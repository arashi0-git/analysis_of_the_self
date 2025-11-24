"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QuestionnaireForm from "@/components/pages/Questionnaire/QuestionnaireForm";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import {
  API_BASE_URL,
  getUserAnswers,
  updateSingleAnswer,
  getAnswerFeedback,
  type UserAnswer,
} from "@/lib/api";

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
  const [existingAnswers, setExistingAnswers] = useState<UserAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch questions
        const questionsResponse = await fetch(`${API_BASE_URL}/questions`);
        if (!questionsResponse.ok) {
          throw new Error("Failed to fetch questions");
        }
        const questionsData = await questionsResponse.json();
        setQuestions(questionsData.questions);

        // Fetch existing answers if user is authenticated
        if (token) {
          const answersData = await getUserAnswers(token);
          setExistingAnswers(answersData.answers);
        }
      } catch (err) {
        setLoadError(
          err instanceof Error ? err.message : "An unknown error occurred",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleSubmit = async (answers: Record<string, string>) => {
    if (!token) {
      setSubmitError(
        "認証トークンが見つかりません。再度ログインしてください。",
      );
      return;
    }

    try {
      const formattedAnswers = Object.entries(answers).map(
        ([questionId, answerText]) => ({
          question_id: questionId,
          answer_text: answerText,
        }),
      );

      const response = await fetch(`${API_BASE_URL}/answers/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answers: formattedAnswers }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`Failed to submit answers: ${response.status}`);
      }

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

  const handleSaveIndividual = async (
    questionId: string,
    answerText: string,
  ) => {
    if (!token) {
      throw new Error("認証トークンが見つかりません");
    }

    await updateSingleAnswer(questionId, answerText, token);
  };

  const handleGetFeedback = async (questionId: string, answerText: string) => {
    if (!token) {
      throw new Error("認証トークンが見つかりません");
    }

    return await getAnswerFeedback(questionId, answerText, token);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl">読み込み中...</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl text-red-500">エラー: {loadError}</div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            {existingAnswers.length > 0 ? "質問回答の編集" : "質問に回答"}
          </h1>
          <p className="text-lg text-foreground/70">
            {existingAnswers.length > 0
              ? "回答を編集して、一問ずつ保存できます。保存すると自動的に分析が更新されます。"
              : "以下の質問に回答してください。すべての質問に回答後、送信ボタンをクリックしてください。"}
          </p>
        </div>
        {submitError && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">
            {submitError}
          </div>
        )}
        <QuestionnaireForm
          questions={questions}
          existingAnswers={existingAnswers}
          onSubmit={handleSubmit}
          onSaveIndividual={handleSaveIndividual}
          onGetFeedback={handleGetFeedback}
        />
      </div>
    </ProtectedRoute>
  );
}
