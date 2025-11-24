"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AnalysisDisplay from "@/components/pages/Analysis/AnalysisDisplay";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE_URL } from "@/lib/api";

interface StrengthItem {
  strength: string;
  evidence: string;
  confidence: number;
}

interface AnalysisData {
  keywords: string[];
  strengths: StrengthItem[];
  values: string[];
  summary: string;
}

export default function AnalysisPage() {
  const { token } = useAuth();
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;

    const fetchAnalysis = async (currentRetry = 0) => {
      if (!token) return;

      try {
        const response = await fetch(`${API_BASE_URL}/analysis`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            // If analysis not found and we haven't retried too many times, retry
            if (currentRetry < 10) {
              if (isMounted) setRetryCount(currentRetry + 1);
              console.log(
                `Analysis not found, retrying in 3 seconds... (attempt ${currentRetry + 1}/10)`,
              );
              timeoutId = setTimeout(
                () => fetchAnalysis(currentRetry + 1),
                3000,
              );
              return;
            }
            throw new Error(
              "分析が完了していません。しばらく待ってからページを再読み込みしてください。",
            );
          }
          throw new Error("Failed to fetch analysis");
        }

        const data = await response.json();
        if (isMounted) {
          setAnalysisData(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "An unknown error occurred",
          );
          setLoading(false);
        }
      }
    };

    if (token) {
      fetchAnalysis();
    }

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="text-xl">分析結果を読み込んでいます...</div>
        {retryCount > 0 && (
          <div className="text-sm text-gray-600">
            分析処理中です... ({retryCount}/10回目の確認)
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="text-xl text-red-500">エラー: {error}</div>
        <Link
          href="/questionnaire"
          className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
        >
          質問に回答する
        </Link>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl">分析結果がありません</div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            あなたの自己分析結果
          </h1>
          <p className="text-lg text-foreground/70">
            AIが分析した、あなたの強みや価値観をご確認ください。
          </p>
        </div>
        <AnalysisDisplay data={analysisData} />
      </div>
    </ProtectedRoute>
  );
}
