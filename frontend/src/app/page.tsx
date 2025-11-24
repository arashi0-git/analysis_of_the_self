"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            あなたの
            <span className="text-primary">強み</span>と
            <span className="text-secondary">価値観</span>
            を発見
          </h1>
          <p className="text-xl text-foreground/70 mb-12 max-w-2xl mx-auto">
            AIを活用した自己分析ツール。質問に答えるだけで、あなたの強みや価値観を分析し、
            パーソナライズされたアドバイスを提供します。
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <>
                <Link
                  href="/questionnaire"
                  className="px-8 py-4 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold transition-colors shadow-lg"
                >
                  質問に回答する
                </Link>
                <Link
                  href="/analysis"
                  className="px-8 py-4 bg-muted hover:bg-border text-foreground rounded-lg font-semibold transition-colors"
                >
                  分析結果を見る
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  className="px-8 py-4 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold transition-colors shadow-lg"
                >
                  無料で始める
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-4 bg-muted hover:bg-border text-foreground rounded-lg font-semibold transition-colors"
                >
                  ログイン
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-background p-6 rounded-lg shadow-sm border border-border">
            <div className="text-3xl mb-4" aria-hidden="true">
              📝
            </div>
            <h3 className="text-xl font-semibold mb-2">質問に回答</h3>
            <p className="text-foreground/70">
              あなた自身について、いくつかの質問に答えてください。
            </p>
          </div>

          <div className="bg-background p-6 rounded-lg shadow-sm border border-border">
            <div className="text-3xl mb-4" aria-hidden="true">
              🤖
            </div>
            <h3 className="text-xl font-semibold mb-2">AI分析</h3>
            <p className="text-foreground/70">
              AIがあなたの回答を分析し、強みや価値観を抽出します。
            </p>
          </div>

          <div className="bg-background p-6 rounded-lg shadow-sm border border-border">
            <div className="text-3xl mb-4" aria-hidden="true">
              💬
            </div>
            <h3 className="text-xl font-semibold mb-2">チャットで深掘り</h3>
            <p className="text-foreground/70">
              AIとチャットして、さらに深く自己理解を深めましょう。
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            使い方はシンプル
          </h2>
          <ol className="space-y-6">
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold mb-1">アカウント作成</h4>
                <p className="text-foreground/70">
                  メールアドレスで簡単に登録できます。
                </p>
              </div>
            </li>

            <li className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold mb-1">質問に回答</h4>
                <p className="text-foreground/70">
                  あなた自身について、いくつかの質問に答えてください。
                </p>
              </div>
            </li>

            <li className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold mb-1">分析結果を確認</h4>
                <p className="text-foreground/70">
                  AIが分析した、あなたの強みや価値観を確認しましょう。
                </p>
              </div>
            </li>

            <li className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h4 className="font-semibold mb-1">AIとチャット</h4>
                <p className="text-foreground/70">
                  さらに深く自己理解を深めたい場合は、AIとチャットしてみましょう。
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>
    </div>
  );
}
