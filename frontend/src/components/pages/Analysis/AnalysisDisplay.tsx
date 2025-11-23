"use client";

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

interface AnalysisDisplayProps {
  data: AnalysisData;
}

export default function AnalysisDisplay({ data }: AnalysisDisplayProps) {
  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="rounded-lg border border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-gray-800">総合サマリー</h2>
        <p className="text-lg leading-relaxed text-gray-700">{data.summary}</p>
      </div>

      {/* Keywords */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-gray-800">キーワード</h2>
        <div className="flex flex-wrap gap-3">
          {data.keywords.map((keyword, index) => (
            <span
              key={index}
              className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-800"
            >
              {keyword}
            </span>
          ))}
        </div>
      </div>

      {/* Strengths */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-gray-800">あなたの強み</h2>
        <div className="space-y-4">
          {data.strengths.map((item, index) => (
            <div
              key={index}
              className="rounded-lg border border-gray-100 bg-gray-50 p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">
                  {item.strength}
                </h3>
                <span className="text-sm text-gray-600">
                  信頼度: {Math.round(item.confidence * 100)}%
                </span>
              </div>
              <p className="text-gray-700">
                <span className="font-semibold">根拠:</span> {item.evidence}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Values */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-gray-800">
          大切にしている価値観
        </h2>
        <div className="flex flex-wrap gap-3">
          {data.values.map((value, index) => (
            <span
              key={index}
              className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-800"
            >
              {value}
            </span>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-center pt-4">
        <a
          href="/chat"
          className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
        >
          チャットで詳しく相談する
        </a>
      </div>
    </div>
  );
}
