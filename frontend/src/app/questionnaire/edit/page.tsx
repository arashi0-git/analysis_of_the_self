"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EditQuestionnaireForm from "@/components/pages/Questionnaire/EditQuestionnaireForm";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { getUserAnswers, updateSingleAnswer } from "@/lib/api";

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

export default function QuestionnaireEditPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [existingAnswers, setExistingAnswers] = useState<UserAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      try {
        // Fetch questions
        const questionsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/questions`,
        );
        if (!questionsResponse.ok) {
          throw new Error("Failed to fetch questions");
        }
        const questionsData = await questionsResponse.json();
        setQuestions(questionsData.questions);

        // Fetch existing answers
        const answersData = await getUserAnswers(token);
        setExistingAnswers(answersData.answers);

        // If no answers exist, redirect to questionnaire page
        if (answersData.answers.length === 0) {
          router.push("/questionnaire");
          return;
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, router]);

  const handleSave = async (questionId: string, answerText: string) => {
    if (!token) {
      throw new Error("認証トークンが見つかりません");
    }

    await updateSingleAnswer(questionId, answerText, token);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl text-red-500">エラー: {error}</div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            質問回答の編集
          </h1>
          <p className="text-lg text-foreground/70">
            回答を編集して、一問ずつ保存できます。保存すると自動的に分析が更新されます。
          </p>
        </div>
        <EditQuestionnaireForm
          questions={questions}
          existingAnswers={existingAnswers}
          onSave={handleSave}
        />
      </div>
    </ProtectedRoute>
  );
}
