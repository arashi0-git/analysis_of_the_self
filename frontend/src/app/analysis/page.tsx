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

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">分析結果</h1>
          <p className="text-lg text-foreground/70">
            あなたの回答を分析した結果です。
          </p>
        </div>
        {loading ? (
          <div className="text-center py-12">
            <div className="text-xl mb-4">分析中...</div>
            {retryCount > 0 && (
              <div className="text-sm text-foreground/60">
                分析結果を取得しています... ({retryCount}/10)
              </div>
            )}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-xl text-red-500 mb-4">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="mb-4 rounded-lg bg-primary px-6 py-2 font-semibold text-white hover:bg-primary/90 transition-colors"
            >
              再読み込み
            </button>
            <div className="text-sm text-foreground/60 mb-2">または</div>
            <Link
              href="/questionnaire"
              className="text-primary hover:underline"
            >
              質問回答ページに戻る
            </Link>
          </div>
        ) : analysisData ? (
          <>
            <AnalysisDisplay data={analysisData} />
            <div className="mt-12 flex gap-4 justify-center">
              <Link
                href="/questionnaire"
                className="rounded-lg bg-secondary px-8 py-3 font-semibold text-white hover:bg-secondary/90 transition-colors"
              >
                回答を編集
              </Link>
              <Link
                href="/chat"
                className="rounded-lg bg-primary px-8 py-3 font-semibold text-white hover:bg-primary-hover transition-colors"
              >
                チャットで深掘り
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </ProtectedRoute>
  );
}
