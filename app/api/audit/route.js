import { NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function normalizeUrl(input) {
  try {
    const parsed = new URL(input);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function extractVisibleText($) {
  $("script, style, noscript, iframe, svg").remove();

  const text = $("body").text().replace(/\s+/g, " ").trim();
  return text;
}

function countCtas($) {
  const ctaKeywords =
    /contact|get started|sign up|signup|subscribe|buy|shop|learn more|request|demo|free|start|join|download|book now|talk to sales|schedule|trial|let'?s talk|submit/i;

  let count = 0;
  const seenTexts = new Set();

  $("button, a").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim().toLowerCase();

    if (!text) return;

    if (ctaKeywords.test(text)) {
      const uniqueKey = `${el.tagName}:${text}`;
      if (!seenTexts.has(uniqueKey)) {
        seenTexts.add(uniqueKey);
        count += 1;
      }
    }
  });

  return count;
}

function classifyLinks($, pageUrl) {
  const baseUrl = new URL(pageUrl);
  const baseHost = baseUrl.hostname.replace(/^www\./, "");

  let internal = 0;
  let external = 0;

  $("a[href]").each((_, el) => {
    const href = ($(el).attr("href") || "").trim();

    if (
      !href ||
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("javascript:")
    ) {
      return;
    }

    try {
      const absoluteUrl = new URL(href, baseUrl);
      const linkHost = absoluteUrl.hostname.replace(/^www\./, "");

      if (linkHost === baseHost) {
        internal += 1;
      } else {
        external += 1;
      }
    } catch {
      // Ignore malformed URLs
    }
  });

  return { internal, external };
}

function extractImageMetrics($) {
  const total = $("img").length;
  let missingAlt = 0;

  $("img").each((_, el) => {
    const alt = $(el).attr("alt");
    if (!alt || alt.trim() === "") {
      missingAlt += 1;
    }
  });

  const missingAltPercent =
    total > 0 ? Math.round((missingAlt / total) * 100) : 0;

  return { total, missingAlt, missingAltPercent };
}

function cleanRawJson(rawOutput) {
  let cleaned = rawOutput.trim();

  cleaned = cleaned.replace(/```json/gi, "").replace(/```/g, "").trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned;
}

export async function POST(request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Missing ANTHROPIC_API_KEY in environment variables." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const normalizedUrl = normalizeUrl(body?.url);

    if (!normalizedUrl) {
      return NextResponse.json(
        { error: "A valid URL is required." },
        { status: 400 }
      );
    }

    const response = await axios.get(normalizedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      timeout: 15000,
      maxRedirects: 5,
    });

    const html = response.data;
    const $ = cheerio.load(html);

    const bodyText = extractVisibleText($);
    const wordCount = bodyText ? bodyText.split(/\s+/).filter(Boolean).length : 0;

    const h1Count = $("h1").length;
    const h2Count = $("h2").length;
    const h3Count = $("h3").length;

    const ctaCount = countCtas($);
    const links = classifyLinks($, normalizedUrl);
    const images = extractImageMetrics($);

    const metaTitle = $("title").first().text().trim() || "Not found";
    const metaDescription =
      $('meta[name="description"]').attr("content")?.trim() || "Not found";

    const metrics = {
      wordCount,
      headings: {
        h1: h1Count,
        h2: h2Count,
        h3: h3Count,
      },
      ctaCount,
      links,
      images,
      meta: {
        title: metaTitle,
        description: metaDescription,
      },
    };

    const pageContentSample = bodyText
      ? bodyText.slice(0, 3000)
      : "No visible page body text could be extracted from this page.";

    const systemPrompt = `You are a senior web strategist and SEO specialist working for Eight25Media,
a digital agency that builds high-performing marketing websites focused on SEO,
conversion optimization, content clarity, and UX.

Your job is to audit webpages and provide sharp, specific, actionable insights
grounded ONLY in the real extracted metrics provided. Do not invent facts.
Do not give vague advice.

ANALYSIS RULES:
- Always reference specific numbers from the metrics where relevant
- Flag important issues first
- Frame feedback in terms of SEO, conversion, messaging clarity, content depth, and UX
- Recommendations must be prioritized by business impact
- Be concise but specific

OUTPUT RULES:
- Return valid JSON only
- No markdown
- No code fences
- No explanation outside the JSON`;

    const userPrompt = `Audit this webpage using the extracted metrics and content sample below.

URL: ${normalizedUrl}

EXTRACTED METRICS:
- Word Count: ${wordCount}
- H1 Tags: ${h1Count}
- H2 Tags: ${h2Count}
- H3 Tags: ${h3Count}
- CTA Count: ${ctaCount}
- Internal Links: ${links.internal}
- External Links: ${links.external}
- Total Images: ${images.total}
- Images Missing Alt Text: ${images.missingAlt} (${images.missingAltPercent}%)
- Meta Title: ${metaTitle}
- Meta Description: ${metaDescription}

PAGE CONTENT SAMPLE (first 3000 chars):
${pageContentSample}

Return a JSON object with this exact structure:
{
  "insights": {
    "seo": "specific insight referencing actual metrics",
    "messagingClarity": "specific insight about messaging clarity",
    "ctaUsage": "specific insight about CTA usage referencing the count",
    "contentDepth": "specific insight referencing word count and structure",
    "uxConcerns": "specific insight about UX or structural issues"
  },
  "recommendations": [
    {
      "priority": 1,
      "title": "Short title",
      "action": "Specific actionable step",
      "reason": "Reason tied to the actual metrics"
    }
  ],
  "overallScore": 0
}

Provide 3 to 5 recommendations ordered by priority.`;

    const aiResponse = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1400,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const rawOutput = aiResponse.content?.[0]?.text || "";

    let aiInsights;
    try {
      const cleaned = cleanRawJson(rawOutput);
      aiInsights = JSON.parse(cleaned);
    } catch (parseError) {
      console.error("JSON parse failed:", parseError);
      aiInsights = {
        error: "Failed to parse AI response",
        raw: rawOutput,
      };
    }

    const promptLog = {
      timestamp: new Date().toISOString(),
      url: normalizedUrl,
      systemPrompt,
      userPrompt,
      rawModelOutput: rawOutput,
      modelUsed: "claude-haiku-4-5-20251001",
    };

    return NextResponse.json({
      auditedUrl: normalizedUrl,
      metrics,
      aiInsights,
      promptLog,
    });
  } catch (error) {
    console.error("Audit error:", error);

    const message =
      error?.response?.data?.error ||
      error?.message ||
      "Unknown error occurred while auditing the page.";

    return NextResponse.json(
      { error: `Failed to audit URL: ${message}` },
      { status: 500 }
    );
  }
}