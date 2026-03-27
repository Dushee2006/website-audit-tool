"use client";

import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const isValidHttpUrl = (value) => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleAudit = async () => {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      setError("Please enter a URL.");
      return;
    }

    if (!isValidHttpUrl(trimmedUrl)) {
      setError("Please enter a valid URL starting with http:// or https://");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmedUrl }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        setError(data.error || "Audit failed. Please try again.");
        return;
      }

      setResult(data);
    } catch {
      setError("Something went wrong while contacting the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getGrade = (score) => {
    if (score == null || Number.isNaN(score)) return "?";
    if (score >= 85) return "A";
    if (score >= 70) return "B";
    if (score >= 55) return "C";
    if (score >= 40) return "D";
    return "F";
  };

  const getGradeColor = (score) => {
    if (score == null || Number.isNaN(score)) return "text-gray-500";
    if (score >= 85) return "text-green-400";
    if (score >= 70) return "text-green-500";
    if (score >= 55) return "text-yellow-400";
    if (score >= 40) return "text-orange-400";
    return "text-red-500";
  };

  const getScoreSummary = (score) => {
    if (score == null || Number.isNaN(score)) return "Score unavailable";
    if (score >= 85) return "Strong structure with only minor improvement areas";
    if (score >= 70) return "Good foundation with several meaningful opportunities";
    if (score >= 55) return "Mixed performance with clear areas to improve";
    if (score >= 40) return "Noticeable SEO, content, and UX weaknesses";
    return "Serious structural and content issues need attention";
  };

  const score = result?.aiInsights?.overallScore ?? null;
  const parseFailed = Boolean(result?.aiInsights?.error);
  const recommendations = result?.aiInsights?.recommendations ?? [];
  const auditedUrl = result?.promptLog?.url || result?.auditedUrl || url.trim();

  const totalImages = result?.metrics?.images?.total ?? 0;
  const missingAlt = result?.metrics?.images?.missingAlt ?? 0;
  const missingAltPercent = result?.metrics?.images?.missingAltPercent ?? 0;

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">
            E
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">
              Eight25 Website Audit Tool
            </h1>
            <p className="text-xs text-gray-400">
              AI-powered page analysis for marketing teams
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Enter a webpage URL to audit
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAudit()}
              placeholder="https://example.com"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
            />
            <button
              onClick={handleAudit}
              disabled={loading || !url.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium px-6 py-3 rounded-lg transition-colors text-sm whitespace-nowrap"
            >
              {loading ? "Analyzing..." : "Run Audit"}
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400 text-sm">
              Fetching page, extracting metrics, and running AI analysis...
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-950 border border-red-800 rounded-xl p-5 mb-6">
            <p className="text-red-400 text-sm">⚠️ {error}</p>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">
                Audited URL
              </p>
              <p className="text-sm text-white break-all">{auditedUrl}</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <p className="text-gray-400 text-sm mb-1">Overall Audit Score</p>
                <p className="text-4xl font-bold text-white">
                  {score ?? "N/A"}
                  <span className="text-xl text-gray-500">/100</span>
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  {getScoreSummary(score)}
                </p>
              </div>
              <div className={`text-6xl font-black ${getGradeColor(score)}`}>
                {getGrade(score)}
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <h2 className="font-semibold text-white">Factual Metrics</h2>
                <span className="text-xs text-gray-500 ml-1">
                  — extracted directly from page, no AI
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard label="Word Count" value={result?.metrics?.wordCount ?? 0} />
                <MetricCard
                  label="H1 Tags"
                  value={result?.metrics?.headings?.h1 ?? 0}
                  alert={(result?.metrics?.headings?.h1 ?? 0) === 0}
                />
                <MetricCard label="H2 Tags" value={result?.metrics?.headings?.h2 ?? 0} />
                <MetricCard label="H3 Tags" value={result?.metrics?.headings?.h3 ?? 0} />
                <MetricCard label="CTAs Found" value={result?.metrics?.ctaCount ?? 0} />
                <MetricCard label="Internal Links" value={result?.metrics?.links?.internal ?? 0} />
                <MetricCard label="External Links" value={result?.metrics?.links?.external ?? 0} />
                <MetricCard label="Total Images" value={totalImages} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <MetricCard
                  label="Missing Alt Text"
                  value={`${missingAlt} / ${totalImages} (${missingAltPercent}%)`}
                  alert={missingAltPercent > 30}
                />
                <div className="bg-gray-800 rounded-lg p-4 md:col-span-2">
                  <p className="text-xs text-gray-400 mb-1">Meta Title</p>
                  <p className="text-sm text-white font-medium break-words">
                    {result?.metrics?.meta?.title || "Not found"}
                  </p>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 mt-4">
                <p className="text-xs text-gray-400 mb-1">Meta Description</p>
                <p className="text-sm text-white break-words">
                  {result?.metrics?.meta?.description || "Not found"}
                </p>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                <h2 className="font-semibold text-white">AI Insights</h2>
                <span className="text-xs text-gray-500 ml-1">
                  — generated by Claude, grounded in metrics above
                </span>
              </div>

              {parseFailed ? (
                <div className="bg-red-950 border border-red-800 rounded-lg p-4">
                  <p className="text-red-400 text-sm">
                    ⚠️ The AI response could not be parsed into structured JSON. The raw response is still shown in the Prompt Log below.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <InsightCard label="SEO Structure" text={result?.aiInsights?.insights?.seo} />
                  <InsightCard label="Messaging Clarity" text={result?.aiInsights?.insights?.messagingClarity} />
                  <InsightCard label="CTA Usage" text={result?.aiInsights?.insights?.ctaUsage} />
                  <InsightCard label="Content Depth" text={result?.aiInsights?.insights?.contentDepth} />
                  <InsightCard label="UX Concerns" text={result?.aiInsights?.insights?.uxConcerns} />
                </div>
              )}
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <h2 className="font-semibold text-white">Prioritized Recommendations</h2>
              </div>

              {recommendations.length === 0 ? (
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">
                    No structured recommendations were returned.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendations.map((rec, i) => (
                    <div key={i} className="bg-gray-800 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <span className="bg-blue-600 text-white text-xs font-bold min-w-16 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 px-2">
                          P{rec?.priority ?? i + 1}
                        </span>
                        <div>
                          <p className="text-white font-medium text-sm mb-1">
                            {rec?.title || "Untitled recommendation"}
                          </p>
                          <p className="text-gray-300 text-sm mb-2">
                            {rec?.action || "No action provided."}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {rec?.reason || "No reasoning provided."}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                <h2 className="font-semibold text-white">Prompt Log</h2>
                <span className="text-xs text-gray-500 ml-1">
                  — full AI orchestration trace
                </span>
              </div>

              <p className="text-xs text-gray-400 mb-5">
                This section shows the exact prompts sent to the model and the raw response returned before UI formatting.
              </p>

              <div className="space-y-4">
                <LogSection
                  title="System Prompt"
                  content={result?.promptLog?.systemPrompt || "No system prompt logged."}
                />
                <LogSection
                  title="User Prompt (sent to Claude)"
                  content={result?.promptLog?.userPrompt || "No user prompt logged."}
                />
                <LogSection
                  title="Raw Model Output"
                  content={result?.promptLog?.rawModelOutput || "No raw output logged."}
                />
                <p className="text-xs text-gray-600">
                  Model: {result?.promptLog?.modelUsed || "Unknown"} · Timestamp:{" "}
                  {result?.promptLog?.timestamp || "Unknown"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function MetricCard({ label, value, alert = false }) {
  return (
    <div
      className={`rounded-lg p-4 ${
        alert ? "bg-red-950 border border-red-800" : "bg-gray-800"
      }`}
    >
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-xl font-bold ${alert ? "text-red-400" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

function InsightCard({ label, text }) {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <p className="text-xs text-purple-400 font-medium mb-2 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-gray-300 text-sm leading-relaxed">
        {text || "No insight available for this category."}
      </p>
    </div>
  );
}

function LogSection({ title, content }) {
  return (
    <div>
      <p className="text-xs text-yellow-500 font-medium mb-2 uppercase tracking-wide">
        {title}
      </p>
      <pre className="bg-gray-800 rounded-lg p-4 text-xs text-gray-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
        {content}
      </pre>
    </div>
  );
}