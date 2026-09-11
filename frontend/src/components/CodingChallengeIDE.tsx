import React, { useState, useEffect, useRef } from "react";
import { AssignmentQuestion, TestCase } from "../types";
import {
  Code2,
  Play,
  RotateCcw,
  Terminal,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  ChevronDown,
  Copy,
  Check,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Sparkles,
  AlertCircle,
  HelpCircle,
  FileCode,
  Sun,
  Moon,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import {
  evaluateCodeSolution,
  runCustomInputCode,
  CodeEvaluationResult,
} from "../utils/codeEvaluator";

interface CodingChallengeIDEProps {
  question: AssignmentQuestion;
  questionNumber?: number;
  isSubmitted?: boolean;
  initialCode?: string;
  initialTestResults?: any;
  onCodeChange?: (code: string) => void;
  onSubmitSolution?: (code: string, results: any) => void;
  readOnly?: boolean;
  initialTheme?: "light" | "dark";
}

export const CodingChallengeIDE: React.FC<CodingChallengeIDEProps> = ({
  question,
  questionNumber = 1,
  isSubmitted = false,
  initialCode,
  initialTestResults,
  onCodeChange,
  onSubmitSolution,
  readOnly = false,
  initialTheme = "light",
}) => {
  // Theme state - White / Light theme by default
  const [theme, setTheme] = useState<"light" | "dark">(initialTheme);

  // Available programming languages (18 supported)
  const supportedLanguages = [
    { id: "python", name: "Python", ext: "py", icon: "🐍" },
    { id: "javascript", name: "JavaScript", ext: "js", icon: "🟨" },
    { id: "typescript", name: "TypeScript", ext: "ts", icon: "🔷" },
    { id: "java", name: "Java", ext: "java", icon: "☕" },
    { id: "cpp", name: "C++", ext: "cpp", icon: "⚡" },
    { id: "c", name: "C", ext: "c", icon: "⚙️" },
    { id: "csharp", name: "C#", ext: "cs", icon: "🟣" },
    { id: "go", name: "Go", ext: "go", icon: "🐹" },
    { id: "rust", name: "Rust", ext: "rs", icon: "🦀" },
    { id: "php", name: "PHP", ext: "php", icon: "🐘" },
    { id: "ruby", name: "Ruby", ext: "rb", icon: "💎" },
    { id: "swift", name: "Swift", ext: "swift", icon: "🦅" },
    { id: "kotlin", name: "Kotlin", ext: "kt", icon: "🎯" },
    { id: "dart", name: "Dart", ext: "dart", icon: "🎯" },
    { id: "scala", name: "Scala", ext: "scala", icon: "🔴" },
    { id: "sql", name: "SQL", ext: "sql", icon: "🗄️" },
    { id: "bash", name: "Bash", ext: "sh", icon: "🐚" },
    { id: "r", name: "R", ext: "r", icon: "📊" },
  ];

  const defaultLang = (question.language || "python") as string;
  const [selectedLanguage, setSelectedLanguage] = useState<string>(defaultLang);

  // Default starter templates if not in question
  const defaultStarters: Record<string, string> = {
    python:
      question.starterCodes?.python ||
      question.starterCode ||
      `def solution(nums, target):\n    # Write your Python solution here\n    pass`,
    javascript:
      question.starterCodes?.javascript ||
      `function solution(nums, target) {\n    // Write your JavaScript solution here\n    return [];\n}`,
    typescript:
      question.starterCodes?.typescript ||
      `function solution(nums: number[], target: number): number[] {\n    // Write your TypeScript solution here\n    return [];\n}`,
    java:
      question.starterCodes?.java ||
      `class Solution {\n    public int[] solution(int[] nums, int target) {\n        // Write your Java solution here\n        return new int[]{};\n    }\n}`,
    cpp:
      question.starterCodes?.cpp ||
      `class Solution {\npublic:\n    vector<int> solution(vector<int>& nums, int target) {\n        // Write your C++ solution here\n        return {};\n    }\n};`,
    c:
      question.starterCodes?.c ||
      `#include <stdio.h>\n#include <stdlib.h>\n\nint* solution(int* nums, int numsSize, int target, int* returnSize) {\n    // Write your C solution here\n    *returnSize = 0;\n    return NULL;\n}`,
    csharp:
      question.starterCodes?.csharp ||
      `public class Solution {\n    public int[] SolutionMethod(int[] nums, int target) {\n        // Write your C# solution here\n        return new int[0];\n    }\n}`,
    go:
      question.starterCodes?.go ||
      `package main\n\nfunc solution(nums []int, target int) []int {\n    // Write your Go solution here\n    return []int{}\n}`,
    rust:
      question.starterCodes?.rust ||
      `pub fn solution(nums: Vec<i32>, target: i32) -> Vec<i32> {\n    // Write your Rust solution here\n    vec![]\n}`,
    php:
      question.starterCodes?.php ||
      `<?php\nfunction solution($nums, $target) {\n    // Write your PHP solution here\n    return [];\n}`,
    ruby:
      question.starterCodes?.ruby ||
      `def solution(nums, target)\n  # Write your Ruby solution here\n  []\nend`,
    swift:
      question.starterCodes?.swift ||
      `class Solution {\n    func solution(_ nums: [Int], _ target: Int) -> [Int] {\n        // Write your Swift solution here\n        return []\n    }\n}`,
    kotlin:
      question.starterCodes?.kotlin ||
      `class Solution {\n    fun solution(nums: IntArray, target: Int): IntArray {\n        // Write your Kotlin solution here\n        return intArrayOf()\n    }\n}`,
    dart:
      question.starterCodes?.dart ||
      `List<int> solution(List<int> nums, int target) {\n  // Write your Dart solution here\n  return [];\n}`,
    scala:
      question.starterCodes?.scala ||
      `object Solution {\n    def solution(nums: Array[Int], target: Int): Array[Int] = {\n        // Write your Scala solution here\n        Array()\n    }\n}`,
    sql:
      question.starterCodes?.sql ||
      `-- Write your SQL query statement below\nSELECT * FROM table_name;`,
    bash:
      question.starterCodes?.bash ||
      `#!/bin/bash\n# Read input arguments and print output\nread -r input\necho "$input"`,
    r:
      question.starterCodes?.r ||
      `solution <- function(nums, target) {\n  # Write your R solution here\n  return(c())\n}`,
  };

  // Priority resolver for starter template code
  const resolveStarterCode = (lang: string): string => {
    const qLang = (question.language || "python").toLowerCase();
    // 1. If language matches the question's configured language, question.starterCode is the primary source of truth!
    if (lang.toLowerCase() === qLang && question.starterCode && question.starterCode.trim().length > 0) {
      return question.starterCode;
    }
    // 2. Check language-specific dictionary
    if (question.starterCodes && question.starterCodes[lang] && question.starterCodes[lang].trim().length > 0) {
      return question.starterCodes[lang];
    }
    // 3. Fallback to question.starterCode
    if (question.starterCode && question.starterCode.trim().length > 0) {
      return question.starterCode;
    }
    // 4. Default language starter template
    return defaultStarters[lang] || defaultStarters.python;
  };

  const [code, setCode] = useState<string>(() => (initialCode && initialCode.trim().length > 0) ? initialCode : resolveStarterCode(defaultLang));
  const [testResults, setTestResults] = useState<any>(() => initialTestResults || null);

  // Sync starter code and language whenever question prop or initialCode updates in real-time
  useEffect(() => {
    const lang = (question.language || "python") as string;
    setSelectedLanguage(lang);
    if (initialCode !== undefined && initialCode !== null && initialCode.trim().length > 0) {
      setCode(initialCode);
    } else if (!isSubmitted) {
      const starter = resolveStarterCode(lang);
      setCode(starter);
    }
    if (initialTestResults) {
      setTestResults(initialTestResults);
    }
  }, [
    question.id,
    initialCode,
    initialTestResults,
    isSubmitted,
    question.starterCode,
    question.language,
  ]);

  const [activeTestCaseTab, setActiveTestCaseTab] = useState<number>(0);
  const [customInput, setCustomInput] = useState<string>("");
  const [isTerminalOpen, setIsTerminalOpen] = useState<boolean>(true);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Keep parent in sync
  useEffect(() => {
    if (onCodeChange) {
      onCodeChange(code);
    }
  }, [code]);

  // Update starter code when language changes
  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    setCode(resolveStarterCode(lang));
  };

  // Reset code handler
  const handleResetCode = () => {
    setCode(resolveStarterCode(selectedLanguage));
  };

  // Copy helper
  const handleCopyText = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  // Sync scroll between textarea, highlight overlay, and line gutter
  const handleEditorScroll = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    if (highlightRef.current) {
      highlightRef.current.scrollTop = ta.scrollTop;
      highlightRef.current.scrollLeft = ta.scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = ta.scrollTop;
    }
  };

  // Bracket pairs for auto-closing
  const bracketPairs: Record<string, string> = {
    "(": ")",
    "[": "]",
    "{": "}",
    '"': '"',
    "'": "'",
    "`": "`",
  };

  // Handle keyboard: Tab, Enter (auto-indent), bracket auto-close, Backspace bracket delete
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // ----- TAB: insert 4 spaces -----
    if (e.key === "Tab") {
      e.preventDefault();
      const before = code.substring(0, start);
      const after = code.substring(end);

      if (e.shiftKey) {
        // Shift+Tab: un-indent current line
        const lineStart = before.lastIndexOf("\n") + 1;
        const linePrefix = code.substring(lineStart, start);
        const spaces = linePrefix.match(/^ {1,4}/);
        if (spaces) {
          const removeCount = spaces[0].length;
          const newCode = code.substring(0, lineStart) + code.substring(lineStart + removeCount);
          setCode(newCode);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = Math.max(lineStart, start - removeCount);
          }, 0);
        }
      } else {
        const newCode = before + "    " + after;
        setCode(newCode);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 4;
        }, 0);
      }
      return;
    }

    // ----- ENTER: auto-indent -----
    if (e.key === "Enter") {
      e.preventDefault();
      const before = code.substring(0, start);
      const after = code.substring(end);

      // Get current line's leading whitespace
      const lastNewline = before.lastIndexOf("\n");
      const currentLine = before.substring(lastNewline + 1);
      const indentMatch = currentLine.match(/^(\s*)/);
      const currentIndent = indentMatch ? indentMatch[1] : "";

      // Check if the line ends with an indent-increasing character
      const trimmedLine = currentLine.trimEnd();
      const lastChar = trimmedLine[trimmedLine.length - 1];
      const indentChars = [":", "{", "(", "["];
      const extraIndent = indentChars.includes(lastChar) ? "    " : "";

      // Check if cursor is between brackets like {} or () or []
      const charAfter = after[0];
      const closingBrackets: Record<string, string> = { "{": "}", "(": ")", "[": "]" };
      const isBetweenBrackets = lastChar && closingBrackets[lastChar] === charAfter;

      let insertion: string;
      let cursorOffset: number;

      if (isBetweenBrackets) {
        // Insert new indented line + closing bracket on its own line
        insertion = "\n" + currentIndent + extraIndent + "\n" + currentIndent;
        cursorOffset = 1 + currentIndent.length + extraIndent.length;
      } else {
        insertion = "\n" + currentIndent + extraIndent;
        cursorOffset = insertion.length;
      }

      const newCode = before + insertion + after;
      setCode(newCode);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + cursorOffset;
        textarea.scrollTop = textarea.scrollHeight;
      }, 0);
      return;
    }

    // ----- AUTO-CLOSE brackets and quotes -----
    if (bracketPairs[e.key]) {
      const charAfterCursor = code[end];
      const isQuote = e.key === '"' || e.key === "'" || e.key === "`";

      // If quote and the next char is the same quote, just skip over it
      if (isQuote && charAfterCursor === e.key) {
        e.preventDefault();
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = end + 1;
        }, 0);
        return;
      }

      // Don't auto-close quotes if cursor is inside a word
      if (isQuote && start > 0 && /\w/.test(code[start - 1])) {
        return;
      }

      e.preventDefault();
      const before = code.substring(0, start);
      const selected = code.substring(start, end);
      const after = code.substring(end);
      const open = e.key;
      const close = bracketPairs[e.key];

      if (selected.length > 0) {
        // Wrap selected text
        const newCode = before + open + selected + close + after;
        setCode(newCode);
        setTimeout(() => {
          textarea.selectionStart = start + 1;
          textarea.selectionEnd = end + 1;
        }, 0);
      } else {
        const newCode = before + open + close + after;
        setCode(newCode);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 1;
        }, 0);
      }
      return;
    }

    // ----- Skip closing bracket if already there -----
    const closingChars = [")", "]", "}"];
    if (closingChars.includes(e.key) && code[start] === e.key) {
      e.preventDefault();
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      }, 0);
      return;
    }

    // ----- BACKSPACE: delete bracket pair -----
    if (e.key === "Backspace" && start === end && start > 0) {
      const charBefore = code[start - 1];
      const charAfter = code[start];
      if (bracketPairs[charBefore] === charAfter) {
        e.preventDefault();
        const newCode = code.substring(0, start - 1) + code.substring(start + 1);
        setCode(newCode);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start - 1;
        }, 0);
        return;
      }
    }
  };

  // Syntax highlighting – single-pass tokenizer for 18+ programming languages
  const syntaxHighlight = (source: string, lang: string): string => {
    const normLang = (lang || "python").toLowerCase();
    const isPy = normLang === "python" || normLang === "py";
    const isJsTs = normLang === "javascript" || normLang === "typescript" || normLang === "js" || normLang === "ts";
    const isCppOrC = normLang === "cpp" || normLang === "c" || normLang === "c++";
    const isJava = normLang === "java" || normLang === "kotlin" || normLang === "scala" || normLang === "csharp" || normLang === "dart";
    const isRubyOrBashOrR = normLang === "ruby" || normLang === "bash" || normLang === "sh" || normLang === "r";
    const isSql = normLang === "sql";

    // Build keyword sets
    const defKeywords = new Set<string>();
    const constKeywords = new Set<string>();
    const selfKeywords = new Set<string>();
    const allKeywords = new Set<string>();

    if (isPy) {
      ["def", "class", "lambda", "return", "yield"].forEach((k) => defKeywords.add(k));
      ["True", "False", "None"].forEach((k) => constKeywords.add(k));
      selfKeywords.add("self");
      [
        "def", "class", "return", "if", "elif", "else", "for", "while",
        "import", "from", "as", "try", "except", "finally", "raise",
        "with", "yield", "lambda", "pass", "break", "continue", "and",
        "or", "not", "in", "is", "True", "False", "None", "self",
        "print", "range", "len", "int", "str", "list", "dict", "set",
        "tuple", "map", "filter", "sorted", "enumerate", "zip", "sum",
        "min", "max", "abs", "type", "isinstance", "input", "append",
      ].forEach((k) => allKeywords.add(k));
    } else if (isJsTs) {
      ["function", "class", "return", "async", "await", "const", "let", "var"].forEach((k) => defKeywords.add(k));
      ["true", "false", "null", "undefined"].forEach((k) => constKeywords.add(k));
      selfKeywords.add("this");
      [
        "function", "const", "let", "var", "return", "if", "else",
        "for", "while", "do", "switch", "case", "break", "continue",
        "new", "this", "class", "extends", "import", "export", "from",
        "default", "try", "catch", "finally", "throw", "typeof",
        "instanceof", "async", "await", "yield", "of", "in",
        "true", "false", "null", "undefined", "void", "delete",
        "interface", "type", "enum", "implements", "abstract",
        "console", "log", "Math", "Array", "Object", "String",
        "Number", "Boolean", "Map", "Set", "Promise",
      ].forEach((k) => allKeywords.add(k));
    } else if (isSql) {
      ["SELECT", "FROM", "WHERE", "INSERT", "UPDATE", "DELETE", "CREATE", "TABLE", "JOIN", "LEFT", "RIGHT", "INNER", "GROUP", "BY", "ORDER", "HAVING", "LIMIT", "AS", "INTO", "VALUES", "AND", "OR", "NOT", "NULL", "COUNT", "SUM", "AVG", "MAX", "MIN"].forEach((k) => allKeywords.add(k.toLowerCase()));
      ["SELECT", "FROM", "WHERE", "INSERT", "UPDATE", "DELETE", "CREATE", "TABLE", "JOIN", "LEFT", "RIGHT", "INNER", "GROUP", "BY", "ORDER", "HAVING", "LIMIT", "AS", "INTO", "VALUES", "AND", "OR", "NOT", "NULL", "COUNT", "SUM", "AVG", "MAX", "MIN"].forEach((k) => allKeywords.add(k));
    } else {
      ["class", "return", "public", "private", "protected", "static", "void", "int", "float", "double", "char", "boolean", "auto", "fn", "func", "pub", "struct", "package", "val", "var"].forEach((k) => defKeywords.add(k));
      ["true", "false", "null", "nil", "None"].forEach((k) => constKeywords.add(k));
      ["this", "super", "self"].forEach((k) => selfKeywords.add(k));
      [
        "public", "private", "protected", "static", "void", "int",
        "float", "double", "char", "boolean", "String", "class",
        "new", "return", "if", "else", "for", "while", "do",
        "switch", "case", "break", "continue", "try", "catch",
        "throw", "throws", "finally", "import", "package",
        "extends", "implements", "interface", "abstract", "final",
        "this", "super", "true", "false", "null", "nil",
        "vector", "map", "set", "pair", "auto", "using", "namespace",
        "std", "cout", "cin", "endl", "include", "iostream",
        "printf", "scanf", "sizeof", "fn", "func", "pub", "mut", "let",
        "echo", "def", "end", "begin", "rescue", "require",
      ].forEach((k) => allKeywords.add(k));
    }

    const esc = (ch: string): string => {
      if (ch === "&") return "&amp;";
      if (ch === "<") return "&lt;";
      if (ch === ">") return "&gt;";
      return ch;
    };

    const escStr = (s: string): string =>
      s.replace(/[&<>]/g, (c) => esc(c));

    const wrap = (text: string, cls: string): string =>
      `<span class="${cls}">${escStr(text)}</span>`;

    // Process each line independently
    const lines = source.split("\n");
    const result: string[] = [];

    for (const line of lines) {
      let out = "";
      let i = 0;

      while (i < line.length) {
        const ch = line[i];
        const rest = line.substring(i);

        // 1. Comments
        if ((isPy || isRubyOrBashOrR) && ch === "#") {
          out += wrap(line.substring(i), "syn-comment");
          i = line.length;
          continue;
        }
        if (isSql && rest.startsWith("--")) {
          out += wrap(line.substring(i), "syn-comment");
          i = line.length;
          continue;
        }
        if (!isPy && !isRubyOrBashOrR && rest.startsWith("//")) {
          out += wrap(line.substring(i), "syn-comment");
          i = line.length;
          continue;
        }

        // 2. Decorators (Python)
        if (isPy && ch === "@" && (i === 0 || /\s/.test(line[i - 1]))) {
          const decMatch = rest.match(/^@[a-zA-Z_]\w*/);
          if (decMatch) {
            out += wrap(decMatch[0], "syn-decorator");
            i += decMatch[0].length;
            continue;
          }
        }

        // 3. String literals
        if (ch === '"' || ch === "'" || ch === "`") {
          const quote = ch;
          let j = i + 1;
          while (j < line.length) {
            if (line[j] === "\\" && j + 1 < line.length) {
              j += 2; // skip escaped char
            } else if (line[j] === quote) {
              j++;
              break;
            } else {
              j++;
            }
          }
          out += wrap(line.substring(i, j), "syn-string");
          i = j;
          continue;
        }

        // 4. Numbers (including decimals)
        if (/\d/.test(ch) && (i === 0 || !/[a-zA-Z_]/.test(line[i - 1]))) {
          const numMatch = rest.match(/^\d+\.?\d*/);
          if (numMatch) {
            out += wrap(numMatch[0], "syn-number");
            i += numMatch[0].length;
            continue;
          }
        }

        // 5. Identifiers & keywords
        if (/[a-zA-Z_]/.test(ch)) {
          const idMatch = rest.match(/^[a-zA-Z_]\w*/);
          if (idMatch) {
            const word = idMatch[0];
            const afterWord = line.substring(i + word.length);
            const isFuncCall = /^\s*\(/.test(afterWord);

            if (allKeywords.has(word)) {
              if (constKeywords.has(word)) {
                out += wrap(word, "syn-const");
              } else if (selfKeywords.has(word)) {
                out += wrap(word, "syn-self");
              } else if (defKeywords.has(word)) {
                out += wrap(word, "syn-keyword-def");
              } else {
                out += wrap(word, "syn-keyword");
              }
            } else if (isFuncCall) {
              out += wrap(word, "syn-func");
            } else {
              out += escStr(word);
            }
            i += word.length;
            continue;
          }
        }

        // 6. Regular character (with HTML escaping)
        out += esc(ch);
        i++;
      }

      result.push(out);
    }

    return result.join("\n");
  };

  // Compute line numbers
  const lines = code.split("\n");
  const lineCount = Math.max(lines.length, 14);

  // Run Test Cases (Public sample test cases or Custom Input)
  const handleRunTestCases = async () => {
    setIsRunning(true);
    setIsTerminalOpen(true);

    try {
      if (activeTestCaseTab === 999 && customInput.trim()) {
        const customRun = await runCustomInputCode(code, selectedLanguage, customInput.trim());
        setTestResults({
          allPassed: customRun.exitCode === 0,
          passedCount: customRun.exitCode === 0 ? 1 : 0,
          totalCount: 1,
          results: [
            {
              testCaseIndex: 1,
              input: customInput.trim(),
              expected: "Custom Run Output",
              actual: customRun.output,
              passed: customRun.exitCode === 0,
              executionTimeMs: customRun.timeMs,
              logs: customRun.stdout ? customRun.stdout.split("\n").filter(Boolean) : [],
              error: customRun.stderr || undefined,
            },
          ],
          output: customRun.output,
          feedback: customRun.exitCode === 0
            ? "Custom input executed successfully."
            : "Review error output in terminal.",
        });
        return;
      }

      const activeCases = sampleCases;
      const evalResult = await evaluateCodeSolution(
        code,
        selectedLanguage,
        activeCases,
        question.title || question.question
      );

      setTestResults(evalResult);

      // Immediately notify parent container of latest code and evaluated test case results
      if (onSubmitSolution) {
        onSubmitSolution(code, evalResult);
      }
    } catch (err: any) {
      console.error("Execution error:", err);
      setTestResults({
        allPassed: false,
        passedCount: 0,
        totalCount: sampleCases.length,
        results: sampleCases.map((tc, idx) => ({
          testCaseIndex: idx + 1,
          input: tc.input,
          expected: tc.expectedOutput,
          actual: `Error: ${err?.message || "Execution error"}`,
          passed: false,
          executionTimeMs: 0,
          error: err?.message,
        })),
        output: `Execution Failed:\n${err?.message || "An unexpected error occurred during execution."}`,
        feedback: "Please review your code logic and syntax.",
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Submit Final Solution (includes hidden test cases + scores)
  const handleSubmitSolution = async () => {
    setIsSubmitting(true);
    setIsTerminalOpen(true);

    try {
      const allCases = question.testCases && question.testCases.length > 0 ? question.testCases : sampleCases;
      const evalResult = await evaluateCodeSolution(
        code,
        selectedLanguage,
        allCases,
        question.title || question.question
      );

      setTestResults(evalResult);

      if (evalResult.allPassed) {
        try {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        } catch {}
      }

      if (onSubmitSolution) {
        onSubmitSolution(code, evalResult);
      }
    } catch (err: any) {
      console.error("Submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sampleCases = question.testCases || [
    {
      input: question.sampleInput || "4\n2 7 11 15\n9",
      expectedOutput: question.sampleOutput || "0 1",
      explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
    },
    {
      input: "nums = [3, 2, 4], target = 6",
      expectedOutput: "[1, 2]",
      explanation: "Because nums[1] + nums[2] == 6, we return [1, 2].",
    },
  ];

  const isLight = theme === "light";

  return (
    <div
      className={`w-full rounded-3xl border transition-colors duration-200 overflow-hidden font-sans ${
        isLight
          ? "bg-white border-slate-200 text-slate-800 shadow-xl"
          : "dark bg-[#090d16] border-slate-800/80 text-slate-100 shadow-2xl"
      }`}
    >
      {/* ------------------------------------------------------------- */}
      {/* TOP STATUS BAR                                                */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`px-5 py-3 border-b flex flex-wrap items-center justify-between gap-3 text-xs ${
          isLight
            ? "bg-slate-50/90 border-slate-200 text-slate-700"
            : "bg-[#0b111e] border-slate-800/80 text-slate-300"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-xs font-bold text-slate-600">
            Problem #{questionNumber} • {question.points} Points
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Difficulty Badge */}
          <span
            className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
              question.difficulty === "Hard"
                ? isLight
                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                  : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                : question.difficulty === "Medium"
                ? isLight
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : isLight
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            }`}
          >
            {question.difficulty || "Medium"}
          </span>

          <span className={isLight ? "text-slate-300" : "text-slate-600"}>|</span>
          <span className={`text-[11px] font-mono ${isLight ? "text-slate-500" : "text-slate-400"}`}>
            Time Limit: 2.0s
          </span>

          {/* Theme Switcher Button */}
          <button
            type="button"
            onClick={() => setTheme(isLight ? "dark" : "light")}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition border ${
              isLight
                ? "bg-white text-slate-700 border-slate-200 hover:bg-slate-100 shadow-xs"
                : "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
            }`}
            title={`Switch to ${isLight ? "Dark" : "Light"} IDE Theme`}
          >
            {isLight ? (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-[11px]">Dark Theme</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px]">White Theme</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MAIN 2-COLUMN SPLIT PANE                                      */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        {/* =========================================================== */}
        {/* LEFT COLUMN: PROBLEM SPECIFICATION & DETAILS                */}
        {/* =========================================================== */}
        <div
          className={`lg:col-span-5 p-6 border-b lg:border-b-0 lg:border-r overflow-y-auto max-h-[750px] space-y-5 custom-scrollbar ${
            isLight
              ? "bg-slate-50/50 border-slate-200 text-slate-800"
              : "bg-[#090d16] border-slate-800/80 text-slate-100"
          }`}
        >
          {/* Problem Title */}
          <div>
            <h2
              className={`text-2xl font-black tracking-tight ${
                isLight ? "text-slate-900" : "text-white"
              }`}
            >
              {question.title || question.question.split("\n")[0] || "Two Sum"}
            </h2>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4
              className={`text-xs font-black uppercase tracking-wider ${
                isLight ? "text-indigo-700" : "text-sky-400"
              }`}
            >
              Problem Description
            </h4>
            <div
              className={`text-xs sm:text-[13px] leading-relaxed font-normal ${
                isLight ? "text-slate-700" : "text-slate-300"
              }`}
            >
              {question.description || question.question}
            </div>
          </div>

          {/* Input Format */}
          <div className="space-y-1.5">
            <h4
              className={`text-xs font-black uppercase tracking-wider ${
                isLight ? "text-indigo-700" : "text-sky-400"
              }`}
            >
              Input Format
            </h4>
            <p className={`text-xs leading-relaxed ${isLight ? "text-slate-600" : "text-slate-300"}`}>
              {question.inputFormat ||
                "First line: n (number of elements). Second line: n space-separated integers. Third line: target."}
            </p>
          </div>

          {/* Output Format */}
          <div className="space-y-1.5">
            <h4
              className={`text-xs font-black uppercase tracking-wider ${
                isLight ? "text-indigo-700" : "text-sky-400"
              }`}
            >
              Output Format
            </h4>
            <p className={`text-xs leading-relaxed ${isLight ? "text-slate-600" : "text-slate-300"}`}>
              {question.outputFormat ||
                "Two space-separated indices (0-based) or a list [i, j]."}
            </p>
          </div>

          {/* Constraints */}
          <div className="space-y-1.5">
            <h4
              className={`text-xs font-black uppercase tracking-wider ${
                isLight ? "text-indigo-700" : "text-sky-400"
              }`}
            >
              Constraints
            </h4>
            <div
              className={`text-xs font-mono p-3 rounded-2xl border leading-relaxed ${
                isLight
                  ? "bg-white text-slate-800 border-slate-200 shadow-xs"
                  : "bg-[#0d1424] text-slate-300 border-slate-800/60"
              }`}
            >
              {question.constraints ||
                "2 ≤ n ≤ 10⁴, -10⁹ ≤ nums[i] ≤ 10⁹, Only one valid answer exists."}
            </div>
          </div>

          {/* Sample Input / Output */}
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h4
                  className={`text-xs font-black uppercase tracking-wider ${
                    isLight ? "text-indigo-700" : "text-sky-400"
                  }`}
                >
                  Sample Input
                </h4>
                <button
                  onClick={() =>
                    handleCopyText(
                      question.sampleInput || "4\n2 7 11 15\n9",
                      "sample_in"
                    )
                  }
                  className={`text-[10px] flex items-center gap-1 transition ${
                    isLight
                      ? "text-slate-500 hover:text-indigo-600"
                      : "text-slate-400 hover:text-sky-300"
                  }`}
                >
                  {copiedSection === "sample_in" ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-600 font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre
                className={`p-3 rounded-2xl text-xs font-mono border whitespace-pre-wrap ${
                  isLight
                    ? "bg-white text-slate-900 border-slate-200 shadow-xs font-medium"
                    : "bg-[#0d1424] text-emerald-400 border-slate-800/80"
                }`}
              >
                {question.sampleInput || "4\n2 7 11 15\n9"}
              </pre>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h4
                  className={`text-xs font-black uppercase tracking-wider ${
                    isLight ? "text-indigo-700" : "text-sky-400"
                  }`}
                >
                  Sample Output
                </h4>
                <button
                  onClick={() =>
                    handleCopyText(question.sampleOutput || "0 1", "sample_out")
                  }
                  className={`text-[10px] flex items-center gap-1 transition ${
                    isLight
                      ? "text-slate-500 hover:text-indigo-600"
                      : "text-slate-400 hover:text-sky-300"
                  }`}
                >
                  {copiedSection === "sample_out" ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-600 font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre
                className={`p-3 rounded-2xl text-xs font-mono border whitespace-pre-wrap ${
                  isLight
                    ? "bg-emerald-50/80 text-emerald-900 border-emerald-200 font-bold"
                    : "bg-[#0d1424] text-emerald-400 border-slate-800/80"
                }`}
              >
                {question.sampleOutput || "0 1"}
              </pre>
            </div>

            {/* Explanation */}
            {(question.explanation || sampleCases[0]?.explanation) && (
              <div className="space-y-1.5 pt-1">
                <h4
                  className={`text-xs font-black uppercase tracking-wider ${
                    isLight ? "text-indigo-700" : "text-sky-400"
                  }`}
                >
                  Explanation
                </h4>
                <p
                  className={`text-xs leading-relaxed p-3 rounded-2xl border ${
                    isLight
                      ? "bg-indigo-50/70 text-indigo-950 border-indigo-100"
                      : "bg-[#0d1424]/60 text-slate-300 border-slate-800/60"
                  }`}
                >
                  {question.explanation || sampleCases[0]?.explanation}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* =========================================================== */}
        {/* RIGHT COLUMN: CODE EDITOR & TERMINAL / OUTPUT               */}
        {/* =========================================================== */}
        <div
          className={`lg:col-span-7 flex flex-col relative ${
            isLight ? "bg-white" : "bg-[#070a12]"
          }`}
        >
          {/* Top IDE Toolbar */}
          <div
            className={`px-4 py-2.5 border-b flex items-center justify-between gap-3 ${
              isLight
                ? "bg-slate-50 border-slate-200"
                : "bg-[#0b111e] border-slate-800/80"
            }`}
          >
            {/* Language Selector Dropdown */}
            <div className="flex items-center gap-2">
              <div className="relative inline-block">
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold cursor-pointer transition ${
                    isLight
                      ? "bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-xs"
                      : "bg-[#121b2d] hover:bg-[#18233b] text-slate-200 border-slate-700/60"
                  }`}
                >
                  <Code2
                    className={`w-3.5 h-3.5 ${
                      isLight ? "text-indigo-600" : "text-sky-400"
                    }`}
                  />
                  <select
                    disabled={readOnly}
                    value={selectedLanguage}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className={`bg-transparent outline-none cursor-pointer pr-1 font-mono text-xs font-bold ${
                      isLight ? "text-slate-800" : "text-slate-200"
                    }`}
                  >
                    {supportedLanguages.map((l) => (
                      <option
                        key={l.id}
                        value={l.id}
                        className={isLight ? "bg-white text-slate-900" : "bg-slate-900 text-white"}
                      >
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Reset Button */}
            <button
              disabled={readOnly}
              onClick={handleResetCode}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition border ${
                isLight
                  ? "text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border-slate-200 shadow-xs"
                  : "text-slate-400 hover:text-slate-200 bg-transparent hover:bg-slate-800/60 border-transparent"
              }`}
              title="Reset starter code"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          {/* Code Editor Body with Line Numbers + Syntax Highlight */}
          <div
            className={`relative flex-1 flex min-h-[300px] max-h-[460px] overflow-hidden ${
              isLight ? "bg-white" : "bg-[#070a12]"
            }`}
          >
            {/* Line Number Gutter (synced scroll) */}
            <div
              ref={gutterRef}
              className={`w-12 py-4 select-none text-right pr-3 font-mono text-xs leading-[22px] border-r overflow-hidden flex-shrink-0 ${
                isLight
                  ? "bg-slate-50 text-slate-400 border-slate-200"
                  : "bg-[#070a12] text-slate-600 border-slate-800/40"
              }`}
            >
              {Array.from({ length: lineCount }).map((_, i) => (
                <div key={i} className="h-[22px]">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Editor Area (Highlight Overlay + Textarea) */}
            <div className="flex-1 relative overflow-hidden">
              {/* Syntax Highlight Overlay (read-only, behind textarea) */}
              <pre
                ref={highlightRef}
                aria-hidden="true"
                className={`absolute inset-0 p-4 font-mono text-xs sm:text-[13px] leading-[22px] m-0 overflow-hidden whitespace-pre-wrap break-words pointer-events-none ${
                  isLight ? "text-slate-900" : "text-slate-100"
                }`}
                style={{ tabSize: 4 }}
                dangerouslySetInnerHTML={{
                  __html: syntaxHighlight(code, selectedLanguage) + "\n",
                }}
              />

              {/* Transparent Textarea Input (on top, user types here) */}
              <textarea
                ref={textareaRef}
                disabled={readOnly || isSubmitted}
                value={code}
                onChange={(e) => {
                  const newCode = e.target.value;
                  setCode(newCode);
                  onCodeChange?.(newCode);
                }}
                onKeyDown={handleKeyDown}
                onScroll={handleEditorScroll}
                spellCheck={false}
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect="off"
                className={`absolute inset-0 w-full h-full p-4 bg-transparent font-mono text-xs sm:text-[13px] leading-[22px] focus:outline-none resize-none overflow-y-auto caret-current ${
                  isLight
                    ? "text-transparent selection:bg-indigo-200/50"
                    : "text-transparent selection:bg-sky-800/50"
                }`}
                style={{
                  caretColor: isLight ? "#1e293b" : "#e2e8f0",
                  tabSize: 4,
                  WebkitTextFillColor: "transparent",
                }}
              />
            </div>
          </div>

          {/* --------------------------------------------------------- */}
          {/* TERMINAL & TEST CASES PANEL                               */}
          {/* --------------------------------------------------------- */}
          <div
            className={`border-t flex flex-col ${
              isLight
                ? "bg-slate-50 border-slate-200"
                : "bg-[#090e1b] border-slate-800/80"
            }`}
          >
            {/* Terminal Header */}
            <div
              className={`px-4 py-2 border-b flex items-center justify-between text-xs ${
                isLight
                  ? "bg-slate-100/90 border-slate-200 text-slate-700"
                  : "bg-[#0b1222] border-slate-800/60 text-sky-400"
              }`}
            >
              <div
                className={`flex items-center gap-2 font-mono font-bold ${
                  isLight ? "text-slate-800" : "text-sky-400"
                }`}
              >
                <Terminal
                  className={`w-3.5 h-3.5 ${
                    isLight ? "text-emerald-600" : "text-emerald-400"
                  }`}
                />
                <span>Compiler & Test Terminal</span>
              </div>

              <div className="flex items-center gap-2">
                {testResults && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      testResults.allPassed
                        ? isLight
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : isLight
                        ? "bg-rose-100 text-rose-800 border border-rose-300"
                        : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    }`}
                  >
                    {testResults.allPassed ? "✓ ALL TESTS PASSED" : "✕ TESTS FAILED"}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsTerminalOpen(!isTerminalOpen)}
                  className={`text-[11px] font-bold transition ${
                    isLight
                      ? "text-slate-500 hover:text-slate-900"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {isTerminalOpen ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Terminal Content (Collapsible) */}
            <AnimatePresence>
              {isTerminalOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 space-y-3 max-h-[220px] overflow-y-auto custom-scrollbar">
                    {/* Test Case Selector Tabs */}
                    <div
                      className={`flex items-center gap-2 pb-2 border-b ${
                        isLight ? "border-slate-200" : "border-slate-800/60"
                      }`}
                    >
                      {sampleCases.map((tc, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveTestCaseTab(idx)}
                          className={`px-3 py-1 rounded-xl text-xs font-mono transition flex items-center gap-1.5 ${
                            activeTestCaseTab === idx
                              ? isLight
                                ? "bg-indigo-600 text-white font-bold shadow-xs"
                                : "bg-[#15233e] text-sky-400 border border-sky-500/40 font-bold"
                              : isLight
                              ? "text-slate-600 hover:text-slate-900 bg-white border border-slate-200 shadow-xs"
                              : "text-slate-400 hover:text-slate-200 bg-slate-900/50"
                          }`}
                        >
                          <span>Case {idx + 1}</span>
                          {tc.isHidden && (
                            <span
                              className={`text-[9px] px-1 rounded ${
                                isLight
                                  ? "bg-slate-200 text-slate-700"
                                  : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              Hidden
                            </span>
                          )}
                          {testResults?.results?.[idx] && (
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                testResults.results[idx].passed
                                  ? "bg-emerald-400"
                                  : "bg-rose-400"
                              }`}
                            />
                          )}
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() => setActiveTestCaseTab(999)}
                        className={`px-3 py-1 rounded-xl text-xs font-mono transition ${
                          activeTestCaseTab === 999
                            ? isLight
                              ? "bg-indigo-600 text-white font-bold shadow-xs"
                              : "bg-[#15233e] text-sky-400 border border-sky-500/40 font-bold"
                            : isLight
                            ? "text-slate-600 hover:text-slate-900 bg-white border border-slate-200 shadow-xs"
                            : "text-slate-400 hover:text-slate-200 bg-slate-900/50"
                        }`}
                      >
                        + Custom Input
                      </button>
                    </div>

                    {/* Active Test Case Details */}
                    {activeTestCaseTab === 999 ? (
                      <div className="space-y-2">
                        <label
                          className={`text-[11px] font-mono ${
                            isLight ? "text-slate-600" : "text-slate-400"
                          }`}
                        >
                          Custom Test Input:
                        </label>
                        <textarea
                          rows={2}
                          value={customInput}
                          onChange={(e) => setCustomInput(e.target.value)}
                          placeholder="e.g. nums = [1, 5, 9], target = 10"
                          className={`w-full p-2.5 font-mono text-xs rounded-xl border focus:outline-none ${
                            isLight
                              ? "bg-white text-slate-900 border-slate-300 focus:ring-2 focus:ring-indigo-500"
                              : "bg-[#050811] text-emerald-400 border-slate-800"
                          }`}
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                        <div>
                          <span
                            className={`text-[10px] block mb-1 font-bold ${
                              isLight ? "text-slate-500" : "text-slate-500"
                            }`}
                          >
                            Input Arguments:
                          </span>
                          <div
                            className={`p-2.5 rounded-xl border whitespace-pre-wrap ${
                              isLight
                                ? "bg-white text-slate-800 border-slate-200 shadow-xs"
                                : "bg-[#050811] text-slate-300 border-slate-800/80"
                            }`}
                          >
                            {sampleCases[activeTestCaseTab]?.input || "N/A"}
                          </div>
                        </div>

                        <div>
                          <span
                            className={`text-[10px] block mb-1 font-bold ${
                              isLight ? "text-slate-500" : "text-slate-500"
                            }`}
                          >
                            Expected Return:
                          </span>
                          <div
                            className={`p-2.5 rounded-xl border whitespace-pre-wrap font-bold ${
                              isLight
                                ? "bg-emerald-50/70 text-emerald-800 border-emerald-200"
                                : "bg-[#050811] text-emerald-400 border-slate-800/80"
                            }`}
                          >
                            {sampleCases[activeTestCaseTab]?.expectedOutput || "N/A"}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Execution Output or Grader Feedback */}
                    {testResults ? (
                      <div
                        className={`space-y-2 pt-2 border-t ${
                          isLight ? "border-slate-200" : "border-slate-800/60"
                        }`}
                      >
                        {testResults.results?.[activeTestCaseTab] && (
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className={isLight ? "text-slate-700" : "text-slate-400"}>
                              Actual Output:{" "}
                              <strong
                                className={
                                  testResults.results[activeTestCaseTab].passed
                                    ? isLight
                                      ? "text-emerald-700"
                                      : "text-emerald-400"
                                    : isLight
                                    ? "text-rose-700"
                                    : "text-rose-400"
                                }
                              >
                                {testResults.results[activeTestCaseTab].actual}
                              </strong>
                            </span>
                            <span className={isLight ? "text-slate-500" : "text-slate-500"}>
                              Time: {testResults.results[activeTestCaseTab].executionTimeMs || 24}ms
                            </span>
                          </div>
                        )}

                        <div
                          className={`p-2.5 font-mono text-[11px] rounded-xl border whitespace-pre-wrap ${
                            isLight
                              ? "bg-white text-slate-800 border-slate-200 shadow-xs"
                              : "bg-[#050811] text-slate-300 border-slate-800/80"
                          }`}
                        >
                          {testResults.output}
                        </div>

                        {testResults.feedback && (
                          <div
                            className={`p-3 text-xs rounded-xl border flex items-start gap-2.5 ${
                              isLight
                                ? "bg-indigo-50/80 text-indigo-950 border-indigo-200"
                                : "bg-indigo-950/60 text-sky-200 border-indigo-800/40"
                            }`}
                          >
                            <Sparkles
                              className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                                isLight ? "text-indigo-600" : "text-sky-400"
                              }`}
                            />
                            <div>
                              <strong className={isLight ? "text-indigo-900" : "text-sky-300"}>
                                AI Grader Feedback:
                              </strong>{" "}
                              {testResults.feedback}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        className={`text-xs font-mono py-1 ${
                          isLight ? "text-slate-500" : "text-slate-500"
                        }`}
                      >
                        Click "Run Test Cases" to execute and see live output...
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* --------------------------------------------------------- */}
            {/* BOTTOM ACTIONS BAR                                        */}
            {/* --------------------------------------------------------- */}
            <div
              className={`px-4 py-3 border-t flex flex-wrap items-center justify-between gap-3 ${
                isLight
                  ? "bg-white border-slate-200"
                  : "bg-[#080d19] border-slate-800/80"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {isSubmitted ? (
                  <div
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold border shadow-xs ${
                      isLight
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-emerald-950/50 text-emerald-300 border-emerald-800/60"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Submitted Code & Test Results (Read-Only)</span>
                  </div>
                ) : (
                  <>
                    {/* Run Test Cases Button */}
                    <button
                      disabled={isRunning || isSubmitting}
                      onClick={handleRunTestCases}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition border shadow-xs ${
                        isLight
                          ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300"
                          : "bg-[#131c2e] hover:bg-[#1a263d] text-slate-200 hover:text-white border-slate-700/60"
                      }`}
                    >
                      <Play
                        className={`w-3.5 h-3.5 ${
                          isLight ? "text-indigo-600 fill-indigo-600" : "text-sky-400 fill-sky-400"
                        }`}
                      />
                      <span>{isRunning ? "Running..." : "Run Test Cases"}</span>
                    </button>

                    {/* Submit Solution Button */}
                    <button
                      disabled={isRunning || isSubmitting || isSubmitted}
                      onClick={handleSubmitSolution}
                      className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-600 via-blue-600 to-teal-500 hover:from-indigo-700 hover:to-teal-600 text-white rounded-xl text-xs font-black shadow-md transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                    >
                      <Zap className="w-3.5 h-3.5 fill-white" />
                      <span>{isSubmitting ? "Evaluating..." : "Submit Solution"}</span>
                    </button>
                  </>
                )}
              </div>

              {/* Engine Badge */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-black tracking-tight border ${
                  isLight
                    ? "bg-slate-50 text-slate-800 border-slate-200 shadow-xs"
                    : "bg-white text-slate-900 border-transparent shadow-sm"
                }`}
              >
                <Zap className="w-3 h-3 text-indigo-600 fill-indigo-600" />
                <span>MIND2I Code IDE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
