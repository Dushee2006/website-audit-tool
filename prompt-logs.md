# prompt-logs.md

# Prompt Logs

This file documents the exact prompts used by the application when generating website audit recommendations.

The application also stores these logs dynamically in the UI for every audit run.

---

## System Prompt

```text
You are a senior web strategist and SEO specialist working for Eight25Media,
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
- No explanation outside the JSON
```

---

## Example User Prompt

```text
Audit this webpage using the extracted metrics and content sample below.

URL: https://www.eight25media.com/

EXTRACTED METRICS:
- Word Count: 353
- H1 Tags: 1
- H2 Tags: 5
- H3 Tags: 10
- CTA Count: 4
- Internal Links: 49
- External Links: 2
- Total Images: 30
- Images Missing Alt Text: 28 (93%)
- Meta Title: B2B Digital Agency for Enterprises | eight25
- Meta Description: Global B2B digital agency offering enterprise web design, mobile apps, and strategic consulting for Fortune 500 firms.

PAGE CONTENT SAMPLE (first 3000 chars):
[space]WorkServices Brand Brand Strategy Visual IdentityBrand EnablementCampaign Development Creative Web Design App + Interface DesignInteraction + Motion Design Video TechnologyCMS ImplementationWeb Architecture + Backend DevelopmentPersonalizationData Integration + Analytics GrowthSearch Engine Optimization Conversion Rate Optimization Account Based Marketing Content Strategy + Marketing Execution Studio Services Cras mattis consectetur purus sit amet fermentum. Nullam quis risus eget urna mollis ornare vel eu leo. Curabitur blandit tempus porttitor. Learn More PlatformsAboutBlogLet’s talk Digital experiencesfor the modern enterprise We build brands and web experiences that help you build the ultimate customer journey. Your browser does not support HTML5 video. The world’s best companies choose to work with eight25 Google Link Your browser does not support HTML5 video. Qlik Link Your browser does not support HTML5 video. Intralinks Link Your browser does not support HTML5 video. Andela Link Your browser does not support HTML5 video. Qualcomm Link Your browser does not support HTML5 video. View all work Insights Analyzing the ‘Request a Demo’ Page: Unpacking Why Conversions Are Lagging B2BSaaSEnterpriseDemo Read More Uncovering Homepage Hero Friction: Why Visitors Bounce and How to Fix It GTMB2BSaaS Read More Why Is Brand Alignment Important For B2B Enterprise Websites? GTMB2B Read More Assessment: Is your website dressed for success? GTMB2BSaaS Read More Planning to Sell to Enterprise? Start With a Hard Look at Your Website CROSocial proofProduct images Read More Read our blog Success stories… We are partnering with forward-thinking companies and privileged to work with Fortune 500 companies, technology SMEs, and funded startups. Your browser does not support HTML5 video. Watch Video We are partnering with forward-thinking companies and privileged to work with Fortune 500 companies, technology SMEs, and funded startups. Your browser does not support HTML5 video. Watch Video We are partnering with forward-thinking companies and privileged to work with Fortune 500 companies, technology SMEs, and funded startups. Your browser does not support HTML5 video. Watch Video Let’s work together. Name Email Address Phone Company Message.... Submit 2055 Gateway Place - Ste 500 San Jose, CA 95110 © 2026 EIGHT25MEDIA. All Rights Reserved Privacy Policy Terms AI info Privacy Policy Terms AI info About Contact Us Blog Facebook Linkedin

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

Provide 3 to 5 recommendations ordered by priority.
```

---

## Example Raw Model Output

```json
{
  "insights": {
    "seo": "Meta title and description are well-optimized for B2B enterprise targeting. However, with only 353 words and minimal H1 content depth, the page lacks substantive keyword-rich copy needed for enterprise search visibility. 49 internal links suggest good structure, but thin content limits topical authority signals.",
    "messagingClarity": "Homepage messaging is abstract and vague ('digital experiences for the modern enterprise'). The value proposition lacks specificity—no clear statement of what problems are solved or why enterprises choose eight25. Copy like 'Cras mattis consectetur purus sit amet fermentum' appears to be Lorem Ipsum placeholder text, severely damaging credibility.",
    "ctaUsage": "4 CTAs is reasonable volume, but they are generic ('Learn More', 'Watch Video', 'Submit'). No primary action dominates the page flow. Contact form appears late in the fold without clear urgency messaging or benefit statement for the submission.",
    "contentDepth": "At 353 words with 1 H1 and 5 H2s, content is dangerously thin for an enterprise agency homepage. The heading structure suggests 16 total sections but minimal supporting copy under each. This creates a hub-like structure without depth to establish expertise or answer core buyer questions.",
    "uxConcerns": "Critical: 93% of images (28 of 30) lack alt text—major SEO penalty and accessibility violation. Video fallback text indicates broken or unsupported content. Social proof section repeats identical copy 3 times without differentiation, wasting valuable real estate. Form lacks progressive disclosure or explanation of next steps."
  },
  "recommendations": [
    {
      "priority": 1,
      "title": "Fix all missing alt text on images",
      "action": "Add descriptive, keyword-relevant alt text to all 28 images lacking descriptions. Prioritize client logos, case study hero images, and key process diagrams. Use format: 'eight25 enterprise web design for [industry] companies'.",
      "reason": "93% missing alt text is an accessibility failure and SEO drain. For a design-heavy agency, image alt text is critical for both search rankings and user trust signals."
    },
    {
      "priority": 2,
      "title": "Expand homepage copy and remove placeholder text",
      "action": "Increase content to 800-1200 words. Replace Lorem Ipsum ('Cras mattis consectetur...') with real value propositions. Add 2-3 sentences under each H2 explaining what eight25 does.",
      "reason": "353 words is insufficient for enterprise SEO or credibility. Placeholder text damages perceived legitimacy."
    },
    {
      "priority": 3,
      "title": "Strengthen primary CTA and messaging hierarchy",
      "action": "Create one dominant above-fold CTA with a clear business outcome and reduce secondary CTAs.",
      "reason": "Current CTAs lack urgency and do not create a clear conversion path."
    }
  ],
  "overallScore": 52
}
```

---

## Defensive Parsing

The backend performs cleanup before parsing the model response:

````text
1. Remove ```json code fences
2. Remove stray text before or after the JSON object
3. Extract the substring between the first { and last }
4. Parse the cleaned JSON safely
````

This prevents failures when the model returns extra formatting around the JSON response.

---

## Model Used

```text
claude-haiku-4-5-20251001
```

---

## Example Timestamp

```text
2026-03-27T21:08:00.714Z
```
