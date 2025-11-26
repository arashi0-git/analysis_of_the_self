"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getQuestions,
  getUserAnswers,
  getEpisodeDetail,
  createOrUpdateEpisodeDetail,
  getEpisodeFeedback,
  generateEpisodeSummary,
  type Question,
  type EpisodeDetailBase,
  type MethodType,
} from "@/lib/api";

export default function EpisodeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const questionId = params?.questionId as string;

  const [question, setQuestion] = useState<Question | null>(null);
  const [originalAnswer, setOriginalAnswer] = useState<string>("");
  const [methodType, setMethodType] = useState<MethodType>("STAR");
  const [episodeDetail, setEpisodeDetail] = useState<EpisodeDetailBase>({
    method_type: "STAR",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [generatingFeedback, setGeneratingFeedback] = useState(false);
  const [error, setError] = useState<string>("");
  const [aiFeedback, setAiFeedback] = useState<{
    feedback: string;
    suggestions: string[];
  } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        // Load question
        const questionsData = await getQuestions();
        const q = questionsData.questions.find((q) => q.id === questionId);
        if (!q) {
          setError("質問が見つかりません");
          return;
        }
        setQuestion(q);

        // Load original answer
        const answersData = await getUserAnswers();
        const answer = answersData.answers.find(
          (a) => a.question_id === questionId,
        );
        if (answer) {
          setOriginalAnswer(answer.answer_text);
        }

        // Load existing episode detail
        const existing = await getEpisodeDetail(questionId);
        if (existing) {
          setEpisodeDetail(existing);
          setMethodType(existing.method_type);
        }
      } catch (err) {
        console.error("Failed to load data:", err);
        setError(
          err instanceof Error ? err.message : "データの読み込みに失敗しました",
        );
      } finally {
        setLoading(false);
      }
    }

    if (questionId) {
      loadData();
    }
  }, [questionId]);

  const handleMethodTypeChange = (type: MethodType) => {
    setMethodType(type);
    setEpisodeDetail((prev) => ({ ...prev, method_type: type }));
  };

  const handleFieldChange = (field: keyof EpisodeDetailBase, value: string) => {
    setEpisodeDetail((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerateSummary = async () => {
    // Validate that at least one field has content
    const hasContent =
      methodType === "STAR"
        ? episodeDetail.situation ||
          episodeDetail.task ||
          episodeDetail.action ||
          episodeDetail.result
        : episodeDetail.what || episodeDetail.why;

    if (!hasContent) {
      setError(
        "まとめを生成するには、少なくとも1つのフィールドに入力してください。",
      );
      return;
    }

    try {
      setGeneratingSummary(true);
      setError("");

      const result = await generateEpisodeSummary(questionId, {
        episode_detail: episodeDetail,
      });

      setEpisodeDetail((prev) => ({ ...prev, summary: result.summary }));
    } catch (err) {
      console.error("Failed to generate summary:", err);
      setError(
        err instanceof Error ? err.message : "まとめの生成に失敗しました",
      );
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleGetFeedback = async () => {
    // Validate that at least one field has content
    const hasContent =
      methodType === "STAR"
        ? episodeDetail.situation ||
          episodeDetail.task ||
          episodeDetail.action ||
          episodeDetail.result
        : episodeDetail.what || episodeDetail.why;

    if (!hasContent) {
      setError(
        "フィードバックを取得するには、少なくとも1つのフィールドに入力してください。",
      );
      return;
    }

    try {
      setGeneratingFeedback(true);
      setError("");

      const result = await getEpisodeFeedback(questionId, {
        original_answer: originalAnswer,
        episode_detail: episodeDetail,
      });

      setAiFeedback(result);
    } catch (err) {
      console.error("Failed to get feedback:", err);
      setError(
        err instanceof Error
          ? err.message
          : "フィードバックの取得に失敗しました",
      );
    } finally {
      setGeneratingFeedback(false);
    }
  };

  const handleSave = async () => {
    // Validate that at least one field has content
    const hasContent =
      methodType === "STAR"
        ? episodeDetail.situation ||
          episodeDetail.task ||
          episodeDetail.action ||
          episodeDetail.result
        : episodeDetail.what || episodeDetail.why;

    if (!hasContent) {
      setError("保存するには、少なくとも1つのフィールドに入力してください。");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await createOrUpdateEpisodeDetail(questionId, episodeDetail);

      // Redirect back to questionnaire page
      router.push("/questionnaire");
    } catch (err) {
      console.error("Failed to save:", err);
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  if (error && !question) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Link href="/questionnaire" className="text-primary hover:underline">
            質問回答ページに戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/questionnaire"
            className="text-primary hover:underline mb-4 inline-block"
          >
            ← 質問回答ページに戻る
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            エピソード深堀
          </h1>
          <p className="text-foreground/70">{question?.question_text}</p>
        </div>

        {/* Original Answer */}
        {originalAnswer && (
          <div className="bg-muted p-4 rounded-lg mb-6">
            <h2 className="font-semibold mb-2">元の回答:</h2>
            <p className="text-foreground/80">{originalAnswer}</p>
          </div>
        )}

        {/* Method Type Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => handleMethodTypeChange("STAR")}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              methodType === "STAR"
                ? "bg-primary text-white"
                : "bg-muted text-foreground hover:bg-border"
            }`}
          >
            STAR法
          </button>
          <button
            onClick={() => handleMethodTypeChange("5W1H")}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              methodType === "5W1H"
                ? "bg-primary text-white"
                : "bg-muted text-foreground hover:bg-border"
            }`}
          >
            5W1H
          </button>
        </div>

        {/* Input Form */}
        <div className="bg-background border border-border rounded-lg p-6 mb-6">
          {methodType === "STAR" ? (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold mb-2">
                  Situation（状況）
                </label>
                <textarea
                  value={episodeDetail.situation || ""}
                  onChange={(e) =>
                    handleFieldChange("situation", e.target.value)
                  }
                  className="w-full p-3 border border-border rounded-md"
                  rows={3}
                  placeholder="どのような状況でしたか？"
                />
              </div>
              <div>
                <label className="block font-semibold mb-2">Task（課題）</label>
                <textarea
                  value={episodeDetail.task || ""}
                  onChange={(e) => handleFieldChange("task", e.target.value)}
                  className="w-full p-3 border border-border rounded-md"
                  rows={3}
                  placeholder="どのような課題がありましたか？"
                />
              </div>
              <div>
                <label className="block font-semibold mb-2">
                  Action（行動）
                </label>
                <textarea
                  value={episodeDetail.action || ""}
                  onChange={(e) => handleFieldChange("action", e.target.value)}
                  className="w-full p-3 border border-border rounded-md"
                  rows={3}
                  placeholder="どのような行動を取りましたか？"
                />
              </div>
              <div>
                <label className="block font-semibold mb-2">
                  Result（結果）
                </label>
                <textarea
                  value={episodeDetail.result || ""}
                  onChange={(e) => handleFieldChange("result", e.target.value)}
                  className="w-full p-3 border border-border rounded-md"
                  rows={3}
                  placeholder="どのような結果になりましたか？"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold mb-2">What（何を）</label>
                <textarea
                  value={episodeDetail.what || ""}
                  onChange={(e) => handleFieldChange("what", e.target.value)}
                  className="w-full p-3 border border-border rounded-md"
                  rows={3}
                  placeholder="何をしましたか？"
                />
              </div>
              <div>
                <label className="block font-semibold mb-2">Why（なぜ）</label>
                <textarea
                  value={episodeDetail.why || ""}
                  onChange={(e) => handleFieldChange("why", e.target.value)}
                  className="w-full p-3 border border-border rounded-md"
                  rows={3}
                  placeholder="なぜそれをしましたか？"
                />
              </div>
              <div>
                <label className="block font-semibold mb-2">When（いつ）</label>
                <textarea
                  value={episodeDetail.when_detail || ""}
                  onChange={(e) =>
                    handleFieldChange("when_detail", e.target.value)
                  }
                  className="w-full p-3 border border-border rounded-md"
                  rows={2}
                  placeholder="いつのことですか？"
                />
              </div>
              <div>
                <label className="block font-semibold mb-2">
                  Where（どこで）
                </label>
                <textarea
                  value={episodeDetail.where_detail || ""}
                  onChange={(e) =>
                    handleFieldChange("where_detail", e.target.value)
                  }
                  className="w-full p-3 border border-border rounded-md"
                  rows={2}
                  placeholder="どこでのことですか？"
                />
              </div>
              <div>
                <label className="block font-semibold mb-2">Who（誰と）</label>
                <textarea
                  value={episodeDetail.who_detail || ""}
                  onChange={(e) =>
                    handleFieldChange("who_detail", e.target.value)
                  }
                  className="w-full p-3 border border-border rounded-md"
                  rows={2}
                  placeholder="誰と一緒でしたか？"
                />
              </div>
              <div>
                <label className="block font-semibold mb-2">
                  How（どのように）
                </label>
                <textarea
                  value={episodeDetail.how_detail || ""}
                  onChange={(e) =>
                    handleFieldChange("how_detail", e.target.value)
                  }
                  className="w-full p-3 border border-border rounded-md"
                  rows={3}
                  placeholder="どのように行いましたか？"
                />
              </div>
            </div>
          )}
        </div>

        {/* Summary Section */}
        <div className="bg-background border border-border rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">まとめ</h2>
            <button
              onClick={handleGenerateSummary}
              disabled={generatingSummary}
              className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors disabled:bg-gray-400"
            >
              {generatingSummary ? "生成中..." : "🤖 AI自動生成"}
            </button>
          </div>
          <textarea
            value={episodeDetail.summary || ""}
            onChange={(e) => handleFieldChange("summary", e.target.value)}
            className="w-full p-3 border border-border rounded-md"
            rows={5}
            placeholder="エピソードのまとめを入力してください（200-300文字推奨）"
          />
        </div>

        {/* AI Feedback Section */}
        <div className="bg-background border border-border rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">AI添削</h2>
            <button
              onClick={handleGetFeedback}
              disabled={generatingFeedback}
              className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors disabled:bg-gray-400"
            >
              {generatingFeedback ? "分析中..." : "💡 フィードバックを取得"}
            </button>
          </div>
          {aiFeedback && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-900 whitespace-pre-wrap mb-4">
                {aiFeedback.feedback}
              </p>
              {aiFeedback.suggestions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">
                    改善提案:
                  </h3>
                  <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                    {aiFeedback.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover transition-colors disabled:bg-gray-400"
          >
            {saving ? "保存中..." : "保存して質問回答ページに戻る"}
          </button>
          <Link
            href="/questionnaire"
            className="px-6 py-3 bg-muted text-foreground rounded-lg font-semibold hover:bg-border transition-colors text-center"
          >
            キャンセル
          </Link>
        </div>
      </div>
    </div>
  );
}
