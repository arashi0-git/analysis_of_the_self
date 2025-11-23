"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        // For MVP, using a hardcoded user ID
        // In production, this would come from authentication
        const userId = "00000000-0000-0000-0000-000000000000";

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/analysis/${userId}`,
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(
              "分析結果が見つかりません。まず質問に回答してください。",
            );
          }
          throw new Error("Failed to fetch analysis");
        }

        const data = await response.json();
        setAnalysisData(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl">分析結果を読み込んでいます...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="text-xl text-red-500">エラー: {error}</div>
        <a
          href="/questionnaire"
          className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
        >
          質問に回答する
        </a>
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
