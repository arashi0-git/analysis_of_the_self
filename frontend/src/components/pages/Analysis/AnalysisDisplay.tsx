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
      <div className="rounded-lg border border-border bg-gradient-to-r from-primary/10 to-secondary/10 p-8 shadow-sm">
        <h2 className="mb-4 text-2xl font-bold text-foreground">
          総合サマリー
        </h2>
        <p className="text-lg leading-relaxed text-foreground/80">
          {data.summary}
        </p>
      </div>

      {/* Keywords */}
      <div className="rounded-lg border border-border bg-background p-6 shadow-sm">
        <h2 className="mb-4 text-2xl font-bold text-foreground">キーワード</h2>
        <div className="flex flex-wrap gap-3">
          {data.keywords.map((keyword, index) => (
            <span
              key={index}
              className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary border border-primary/20"
            >
              {keyword}
            </span>
          ))}
        </div>
      </div>

      {/* Strengths */}
      <div className="rounded-lg border border-border bg-background p-6 shadow-sm">
        <h2 className="mb-4 text-2xl font-bold text-foreground">
          あなたの強み
        </h2>
        <div className="space-y-4">
          {data.strengths.map((item, index) => (
            <div
              key={index}
              className="rounded-lg border border-border bg-muted p-5"
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-foreground">
                  {item.strength}
                </h3>
                <span className="text-sm text-foreground/60">
                  信頼度: {Math.round(item.confidence * 100)}%
                </span>
              </div>
              <p className="text-foreground/70">
                <span className="font-semibold">根拠:</span> {item.evidence}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Values */}
      <div className="rounded-lg border border-border bg-background p-6 shadow-sm">
        <h2 className="mb-4 text-2xl font-bold text-foreground">
          大切にしている価値観
        </h2>
        <div className="flex flex-wrap gap-3">
          {data.values.map((value, index) => (
            <span
              key={index}
              className="rounded-full bg-accent/10 px-4 py-2 text-sm font-semibold text-accent border border-accent/20"
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
          className="rounded-lg bg-primary hover:bg-primary-hover px-8 py-3 font-semibold text-white transition-colors shadow-lg"
        >
          チャットで詳しく相談する
        </a>
      </div>
    </div>
  );
}
