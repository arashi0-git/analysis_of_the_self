"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AnalysisDisplay from "@/components/pages/Analysis/AnalysisDisplay";

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
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;

    const fetchAnalysis = async (currentRetry = 0) => {
      try {
        // For MVP, using the default user ID
        // In production, this would come from authentication
        const userId = "cb25c39f-4e8a-44de-839a-a091edbf1c24";

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/analysis/${userId}`,
        );

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

    fetchAnalysis();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

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
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-4xl font-bold">あなたの自己分析結果</h1>
      <AnalysisDisplay data={analysisData} />
    </div>
  );
}
