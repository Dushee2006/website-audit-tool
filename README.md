# README.md

# Eight25 Website Audit Tool

AI-powered website audit tool built for the Eight25 assessment.
The tool analyzes a public webpage URL, extracts objective SEO and UX metrics, then uses Claude to generate actionable recommendations for improving content, messaging, conversion, and accessibility.

---

## Live Demo

Replace with your deployed URL after deployment:

https://your-vercel-app.vercel.app

---

## GitHub Repository

Replace with your repository link:

https://github.com/your-username/eight25-website-audit

---

## Features

* Enter any public webpage URL
* Crawl and analyze the page in real time
* Extract factual metrics directly from the HTML
* Use Claude to generate:

  * SEO analysis
  * Messaging clarity feedback
  * CTA recommendations
  * Content depth analysis
  * UX concerns
* Prioritize recommendations by business impact
* Display the exact prompts and raw model response for transparency
* Include prompt logging for assessment review

---

## Extracted Metrics

The backend extracts the following metrics directly from the page HTML:

* Word count
* H1 / H2 / H3 counts
* CTA count
* Internal vs external links
* Image count
* Missing alt text percentage
* Meta title
* Meta description

### Word Count

The app removes the following before counting words:

* script
* style
* noscript
* iframe
* svg

Then it extracts visible text from the body and calculates total word count.

### CTA Detection

The app scans buttons and links for common CTA phrases such as:

* Contact
* Get Started
* Learn More
* Request Demo
* Schedule
* Join
* Download
* Submit

Repeated CTA text is lightly deduplicated so identical repeated buttons are not overcounted.

### Link Classification

The tool compares every link hostname against the audited page hostname:

* same hostname → internal link
* different hostname → external link

Special links such as:

* mailto:
* tel:
* javascript:
* # anchors

are ignored.

### Image Accessibility

The app counts all images and calculates how many are missing `alt` text.

This is used both for SEO and accessibility scoring.

---

## AI Layer

The extracted metrics and a sample of page text are sent to Claude using the following model:

`claude-haiku-4-5-20251001`

Claude is prompted to behave like a senior Eight25 SEO strategist and return structured JSON containing:

* SEO insight
* Messaging clarity insight
* CTA insight
* Content depth insight
* UX concerns
* Prioritized recommendations
* Overall score

---

## Prompt Logging

The app stores and displays:

* system prompt
* user prompt
* raw model response
* model name
* timestamp

This was included because the assessment explicitly requested prompt logs.

The backend also includes defensive cleanup before parsing the model response:

* removes ```json fences
* trims extra text outside the JSON object
* safely parses the cleaned response

---

## Tech Stack

* Next.js App Router
* React
* Tailwind CSS
* Axios
* Cheerio
* Anthropic SDK
* Claude Haiku 4.5

---

## Local Setup

1. Clone the repository

```bash
git clone https://github.com/your-username/eight25-website-audit.git
cd eight25-website-audit
```

2. Install dependencies

```bash
npm install
```

3. Create a `.env.local` file

```env
ANTHROPIC_API_KEY=your_api_key_here
```

4. Start the development server

```bash
npm run dev
```

5. Open:

```text
http://localhost:3000
```

---

## Example Test URL

```text
https://www.eight25media.com/
```

Example output from the current implementation:

* Word Count: 353
* H1 Tags: 1
* CTA Count: 4
* Missing Alt Text: 28 / 30
* Overall Score: 52 / 100

---

## Submission Checklist

* Public GitHub repository link included
* Deployed application link included
* Prompt logs included
* README included
* Environment variable instructions included
* No hardcoded API keys
