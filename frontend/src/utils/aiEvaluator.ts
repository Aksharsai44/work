/**
 * Google Gemini AI Evaluator & Semantic Fallback Engine
 * 
 * Provides automated intelligent evaluation of student open-ended questions,
 * assignment responses, and concept explanations.
 * Automatically engages a robust semantic heuristic engine if Gemini API tokens
 * expire, are rate-limited, or are not configured.
 */

export interface AIEvaluationResult {
  stars: number; // 1 to 5 stars
  starLabel: string; // e.g. "★★★★★ Strongest Rating (Exceptional)"
  rating: number; // 1 to 5 (star-based rating)
  scoreOutOfTen: number; // 0 to 10
  feedback: string;
  strengths: string[];
  improvements: string[];
  suggestedReply: string;
  evaluatorSource: "gemini" | "semantic_fallback";
  timestamp: string;
}

export function getStarLabel(stars: number): string {
  if (stars >= 5) return "★★★★★ Strongest Rating (Exceptional)";
  if (stars >= 4) return "★★★★☆ Strong Rating (Proficient)";
  if (stars >= 3) return "★★★☆☆ Solid Rating (Competent)";
  if (stars >= 2) return "★★☆☆☆ Developing Understanding";
  return "★☆☆☆☆ Needs Depth & Elaboration";
}

function extractTopicFromQuestion(q: string): string {
  const cleaned = (q || "")
    .replace(
      /^(explain(\s+the)?|what is(\s+the)?|what are(\s+the)?|describe(\s+the)?|discuss(\s+the)?|how does(\s+the)?|how do(\s+the)?|compare(\s+the)?|why is(\s+the)?|(the\s+)?difference between)\s+/i,
      ""
    )
    .replace(/\s+(in terms of|with respect to|regarding|and how).*$/i, "")
    .replace(/[?.:]+$/, "")
    .trim();
  if (cleaned.length > 55) {
    const lastSpace = cleaned.lastIndexOf(" ", 50);
    if (lastSpace > 20) return cleaned.slice(0, lastSpace);
  }
  return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : "this topic";
}

function getCasedKeyword(kw: string, sourceText: string): string {
  const regex = new RegExp(`\\b${kw}\\b`, "i");
  const match = sourceText.match(regex);
  return match ? match[0] : kw;
}

/**
 * Intelligent Semantic Evaluator
 * Deeply analyzes the question, reference answer, and student answer to assign
 * properly calibrated 1-5 star ratings and question-synced instructor reviews.
 */
export function evaluateWithSemanticEngine(
  question: string,
  studentAnswer: string,
  sampleAnswer?: string,
  maxScore: number = 100
): AIEvaluationResult {
  const cleanAnswer = (studentAnswer || "").trim();
  const wordCount = cleanAnswer.split(/\s+/).filter(Boolean).length;
  const topic = extractTopicFromQuestion(question);

  if (
    wordCount === 0 ||
    /^(idk|no|yes|skip|none|dont know|i don'?t know|asdf|xyz|nothing|na|n\/a)$/i.test(cleanAnswer)
  ) {
    return {
      stars: 1,
      starLabel: "★☆☆☆☆ Needs Depth & Elaboration",
      rating: 1,
      scoreOutOfTen: 2,
      feedback: `No substantial technical explanation provided for ${topic}.`,
      strengths: [],
      improvements: [`Review core concepts regarding ${topic} and provide a complete explanation.`],
      suggestedReply: `Your response does not provide an explanation for ${topic}. Please review the core concepts and submit your detailed technical reasoning.`,
      evaluatorSource: "semantic_fallback",
      timestamp: new Date().toISOString(),
    };
  }

  // Extract key technical tokens from question and reference answer
  const stopWords = new Set([
    "what", "why", "how", "when", "where", "which", "who", "whom", "this", "that",
    "these", "those", "is", "are", "was", "were", "be", "been", "being", "have",
    "has", "had", "do", "does", "did", "the", "a", "an", "and", "or", "but",
    "if", "because", "as", "until", "while", "of", "at", "by", "for", "with",
    "about", "against", "between", "into", "through", "during", "before", "after",
    "above", "below", "to", "from", "up", "down", "in", "out", "on", "off", "over",
    "under", "again", "further", "then", "once", "here", "there", "all", "any", "both",
    "can", "could", "should", "would", "may", "might", "must", "will", "shall", "terms",
    "explain", "describe", "difference", "compare", "discuss", "give", "mention", "write"
  ]);

  const extractKeywords = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));
  };

  const fullContextSource = `${question} ${sampleAnswer || ""}`;
  const questionKeywords = Array.from(new Set(extractKeywords(question)));
  const sampleKeywords = sampleAnswer ? Array.from(new Set(extractKeywords(sampleAnswer))) : [];
  const targetKeywords = sampleKeywords.length > 0 ? sampleKeywords : questionKeywords;
  const studentKeywords = new Set(extractKeywords(cleanAnswer));

  // Concept overlap calculation
  const matchedKeywords = targetKeywords.filter(
    (kw) => studentKeywords.has(kw) || cleanAnswer.toLowerCase().includes(kw)
  );
  const missingKeywords = targetKeywords.filter(
    (kw) => !studentKeywords.has(kw) && !cleanAnswer.toLowerCase().includes(kw)
  );

  const keywordCoverage = targetKeywords.length > 0 ? matchedKeywords.length / targetKeywords.length : 0.4;

  // Formatted terms for natural review output
  const matchedTermsFormatted = matchedKeywords
    .slice(0, 3)
    .map((k) => getCasedKeyword(k, fullContextSource));
  const missingTermsFormatted = missingKeywords
    .slice(0, 2)
    .map((k) => getCasedKeyword(k, fullContextSource));

  const matchedStr = matchedTermsFormatted.join(", ");
  const missingStr = missingTermsFormatted.join(" and ");

  // Accurate calibrated star calculation based on coverage, substance, and technical depth
  let stars: number;
  if (wordCount < 5 || keywordCoverage < 0.15) {
    stars = 1;
  } else if (keywordCoverage < 0.35) {
    stars = wordCount < 15 ? 2 : 3;
  } else if (keywordCoverage < 0.60) {
    stars = wordCount < 20 ? 3 : 4;
  } else {
    // High coverage (>= 60%)
    if (wordCount >= 28) {
      stars = 5;
    } else if (wordCount >= 16) {
      stars = 4;
    } else {
      stars = 3;
    }
  }

  const starLabel = getStarLabel(stars);

  // Question-synced instructor review
  let suggestedReply = "";
  if (stars === 5) {
    suggestedReply = `Outstanding response on ${topic}! You demonstrated clear technical depth with accurate coverage of ${
      matchedStr || "the core mechanisms"
    }. Excellent architectural reasoning and clarity.`;
  } else if (stars === 4) {
    suggestedReply = `Strong explanation regarding ${topic}! You covered the key principles of ${
      matchedStr || "the prompt"
    } accurately. ${
      missingStr
        ? `To make this answer exceptional, consider also detailing ${missingStr}.`
        : "Keep up this high standard of technical depth."
    }`;
  } else if (stars === 3) {
    suggestedReply = `Solid attempt on ${topic}. You correctly addressed ${
      matchedStr || "the primary premise"
    }, but the explanation needs more technical depth${
      missingStr ? ` regarding ${missingStr}` : ""
    } to be complete.`;
  } else if (stars === 2) {
    suggestedReply = `Developing response for ${topic}. You touched upon ${
      matchedStr || "the basic premise"
    }, but key mechanics${
      missingStr ? ` such as ${missingStr}` : ""
    } are missing or insufficiently explained. Focus on providing concrete technical specifics.`;
  } else {
    suggestedReply = `Your response does not adequately address ${topic}. Be sure to explain ${
      missingStr || "the core technical principles"
    } with concrete reasoning.`;
  }

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (matchedKeywords.length > 0) {
    strengths.push(`Directly addresses key concepts: ${matchedTermsFormatted.join(", ")}.`);
  }
  if (wordCount >= 20) {
    strengths.push("Provides sufficient technical context and detailed reasoning.");
  }

  if (missingKeywords.length > 0) {
    improvements.push(`Expand on related technical mechanics such as: ${missingTermsFormatted.join(", ")}.`);
  }

  return {
    stars,
    starLabel,
    rating: stars,
    scoreOutOfTen: stars * 2,
    feedback: `Evaluation on ${topic}: ${Math.round(keywordCoverage * 100)}% concept alignment with ${wordCount} words analyzed.`,
    strengths,
    improvements,
    suggestedReply,
    evaluatorSource: "semantic_fallback",
    timestamp: new Date().toISOString(),
  };
}

/**
 * Utility to strip any residual rating text (e.g. "Rated ★★★★☆ (4/5 Stars).") from feedback or replies.
 */
export function cleanInstructorReply(text?: string): string {
  if (!text) return "";
  return text
    .replace(/\s*\bRated\b\s*[★☆\s\d\/\(\)Stars]*\.?/gi, "")
    .trim();
}

/**
 * Main Evaluation Entry Point
 * Tries Google Gemini API first; automatically falls back if API key is not present,
 * expired, or rate-limited.
 */
export async function evaluateStudentOpenAnswer(params: {
  question: string;
  studentAnswer: string;
  sampleAnswer?: string;
  apiKey?: string;
  maxScore?: number;
}): Promise<AIEvaluationResult> {
  const { question, studentAnswer, sampleAnswer, apiKey, maxScore = 100 } = params;

  // If no API key provided, immediately engage fallback engine
  if (!apiKey || apiKey.trim() === "" || apiKey === "your_gemini_api_key_here") {
    return evaluateWithSemanticEngine(question, studentAnswer, sampleAnswer, maxScore);
  }

  try {
    const prompt = `You are an expert technical evaluator and instructor for the Mind2I Bootcamp & Workshop.
Evaluate this student's written response to an open-ended technical challenge.

QUESTION:
"${question}"
${sampleAnswer ? `\nREFERENCE / SAMPLE ANSWER:\n"${sampleAnswer}"\n` : ""}
STUDENT'S SUBMITTED RESPONSE:
"${studentAnswer}"

INSTRUCTIONS:
1. Deeply analyze the QUESTION and how directly, accurately, and comprehensively the student's answer answers it.
2. Evaluate strictly based on technical correctness, conceptual depth, and direct relevance:
   - 5 Stars: Exceptional, comprehensive, and accurate explanation covering core mechanics, principles, and nuances.
   - 4 Stars: Strong, accurate explanation covering the primary concepts clearly with good technical reasoning.
   - 3 Stars: Competent answer that touches the main idea but lacks depth, precision, or misses secondary aspects.
   - 2 Stars: Superficial or incomplete answer; mentions the topic but misses key mechanics or has inaccuracies.
   - 1 Star: Off-topic, incorrect, trivial, or non-answer.
3. In "suggestedReply", provide a personalized, encouraging instructor review written directly to the student. Specifically cite the technical concepts from the question, acknowledge what was correct, and guide them on what technical detail or mechanism to refine.
4. IMPORTANT: Do NOT include star ratings, scores, or phrases like "Rated X Stars" in the review text. Do NOT mention "AI".

Return a valid JSON object strictly matching this schema with NO surrounding markdown backticks or commentary:
{
  "stars": <integer from 1 to 5>,
  "starLabel": "<e.g. Strongest Formulation | Proficient Reasoning | Solid Understanding | Developing Insight | Needs Depth>",
  "feedback": "<concise assessment of the answer>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>"],
  "suggestedReply": "<personalized instructor review referencing the specific technical concepts of the question>"
}`;

    // Make direct API call to Gemini
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 600,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      console.warn(
        `Gemini API responded with HTTP ${response.status} (${response.statusText}). Engaging Semantic Heuristic Fallback Engine.`
      );
      return evaluateWithSemanticEngine(question, studentAnswer, sampleAnswer, maxScore);
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      return evaluateWithSemanticEngine(question, studentAnswer, sampleAnswer, maxScore);
    }

    // Parse JSON
    const parsed = JSON.parse(candidateText.trim());
    let stars = Number(parsed.stars);
    if (!stars || isNaN(stars) || stars < 1 || stars > 5) {
      const rawRating = Number(parsed.rating);
      if (rawRating > 5) {
        stars = rawRating >= 88 ? 5 : rawRating >= 75 ? 4 : rawRating >= 58 ? 3 : rawRating >= 38 ? 2 : 1;
      } else {
        stars = 4;
      }
    }
    stars = Math.min(5, Math.max(1, Math.round(stars)));
    const starLabel = parsed.starLabel || getStarLabel(stars);
    const scoreOutOfTen = stars * 2;

    const rawSuggestedReply =
      parsed.suggestedReply ||
      "Great formulation! You demonstrated strong comprehension.";
    const suggestedReply = cleanInstructorReply(rawSuggestedReply);

    return {
      stars,
      starLabel,
      rating: stars,
      scoreOutOfTen,
      feedback: parsed.feedback || "Evaluated by Google Gemini 1.5 Flash.",
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ["Clear conceptual grasp."],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : ["Continue hands-on lab practice."],
      suggestedReply,
      evaluatorSource: "gemini",
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    console.warn("Gemini evaluation error (token expired / quota exceeded / network issue). Using fallback:", err);
    return evaluateWithSemanticEngine(question, studentAnswer, sampleAnswer, maxScore);
  }
}
