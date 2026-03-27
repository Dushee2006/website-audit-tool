import { NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // ─── STEP 1: FETCH THE PAGE ───────────────────────────────────────────
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 15000,
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // ─── STEP 2: EXTRACT FACTUAL METRICS ─────────────────────────────────

    // Word count
    const bodyText = $("body").text().replace(/\s+/g, " ").trim();
    const wordCount = bodyText.split(" ").filter((w) => w.length > 0).length;

    // Headings
    const h1Count = $("h1").length;
    const h2Count = $("h2").length;
    const h3Count = $("h3").length;

    // CTAs - buttons and links that look like CTAs
    const ctaKeywords =
      /contact|get started|sign up|signup|subscribe|buy|shop|learn more|request|demo|free|start|join|download/i;
    let ctaCount = 0;
    $("button, a").each((_, el) => {
      const text = $(el).text().trim();
      if (ctaKeywords.test(text)) ctaCount++;
    });

    // Links
    const baseHost = new URL(url).hostname;
    let internalLinks = 0;
    let externalLinks = 0;
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;
      if (href.startsWith("/") || href.includes(baseHost)) {
        internalLinks++;
      } else if (href.startsWith("http")) {
        externalLinks++;
      }
    });

    // Images
    const totalImages = $("img").length;
    let missingAlt = 0;
    $("img").each((_, el) => {
      const alt = $(el).attr("alt");
      if (!alt || alt.trim() === "") missingAlt++;
    });
    const missingAltPercent =
      totalImages > 0 ? Math.round((missingAlt / totalImages) * 100) : 0;

    // Meta
    const metaTitle = $("title").text().trim() || "Not found";
    const metaDescription =
      $('meta[name="description"]').attr("content")?.trim() || "Not found";

    const metrics = {
      wordCount,
      headings: { h1: h1Count, h2: h2Count, h3: h3Count },
      ctaCount,
      links: { internal: internalLinks, external: externalLinks },
      images: { total: totalImages, missingAlt, missingAltPercent },
      meta: { title: metaTitle, description: metaDescription },
    };

    // ─── STEP 3: PREPARE PAGE CONTENT SUMMARY FOR AI ─────────────────────
    const pageContentSample = bodyText.slice(0, 3000);

    // ─── STEP 4: BUILD THE PROMPT ─────────────────────────────────────────
    const systemPrompt = `You are a senior web strategist and SEO specialist working for Eight25Media, 
a digital agency that builds high-performing marketing websites. 
Your job is to audit webpages and provide sharp, specific, actionable insights 
grounded in real data — not generic advice.

Always respond in valid JSON only. No extra text, no markdown, no explanation outside the JSON.`;

    const userPrompt = `Audit this webpage using the extracted metrics and content sample below.

URL: ${url}

EXTRACTED METRICS:
- Word Count: ${wordCount}
- H1 Tags: ${h1Count}
- H2 Tags: ${h2Count}  
- H3 Tags: ${h3Count}
- CTA Count: ${ctaCount}
- Internal Links: ${internalLinks}
- External Links: ${externalLinks}
- Total Images: ${totalImages}
- Images Missing Alt Text: ${missingAlt} (${missingAltPercent}%)
- Meta Title: ${metaTitle}
- Meta Description: ${metaDescription}

PAGE CONTENT SAMPLE (first 3000 chars):
${pageContentSample}

Return a JSON object with this exact structure:
{
  "insights": {
    "seo": "specific insight referencing the actual metrics",
    "messagingClarity": "specific insight about the messaging",
    "ctaUsage": "specific insight about CTAs referencing the count",
    "contentDepth": "specific insight referencing word count and structure",
    "uxConcerns": "specific insight about UX or structural issues"
  },
  "recommendations": [
    {
      "priority": 1,
      "title": "Short title",
      "action": "Specific actionable step",
      "reason": "Why this matters, referencing the actual metric"
    }
  ],
  "overallScore": <number 0-100>
}

Provide 3-5 recommendations ordered by priority. Be specific and reference the actual numbers.`;

    // ─── STEP 5: CALL THE AI ──────────────────────────────────────────────
    const aiResponse = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1500,
      messages: [{ role: "user", content: userPrompt }],
      system: systemPrompt,
    });

    const rawOutput = aiResponse.content[0].text;

    // ─── STEP 6: PARSE AI RESPONSE ────────────────────────────────────────
    let aiInsights;
    try {
      aiInsights = JSON.parse(rawOutput);
    } catch {
      aiInsights = { error: "Failed to parse AI response", raw: rawOutput };
    }

    // ─── STEP 7: BUILD PROMPT LOG ─────────────────────────────────────────
    const promptLog = {
      timestamp: new Date().toISOString(),
      url,
      systemPrompt,
      userPrompt,
      rawModelOutput: rawOutput,
      modelUsed: "claude-opus-4-5",
    };

    return NextResponse.json({ metrics, aiInsights, promptLog });
  } catch (error) {
    console.error("Audit error:", error.message);
    return NextResponse.json(
      { error: `Failed to audit URL: ${error.message}` },
      { status: 500 }
    );
  }
}