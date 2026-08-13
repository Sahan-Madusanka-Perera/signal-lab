import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { LESSONS } from "./curriculum";

/**
 * Progress lives in localStorage only. There is no account, so a student can
 * open the app on a lab machine and lose nothing they care about, and the
 * "reset" affordance is honest about what it clears.
 */

const KEY = "signallab.progress.v1";

export type Progress = {
  /** lessonId -> set of section ids the student has answered correctly */
  quizzes: Record<string, string[]>;
  /** lessonId -> visited */
  visited: string[];
};

const EMPTY: Progress = { quizzes: {}, visited: [] };

type Ctx = {
  progress: Progress;
  markVisited: (lessonId: string) => void;
  markQuiz: (lessonId: string, questionId: string) => void;
  lessonScore: (lessonId: string) => { done: number; total: number };
  reset: () => void;
  totalQuestions: Record<string, number>;
  registerQuestionCount: (lessonId: string, count: number) => void;
};

const ProgressContext = createContext<Ctx | null>(null);

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Progress;
    return { quizzes: parsed.quizzes ?? {}, visited: parsed.visited ?? [] };
  } catch {
    return EMPTY;
  }
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(load);
  // Seeded from the curriculum so the overall figure is out of every question
  // in Competency 6, not only the lessons that happen to be mounted.
  const [totalQuestions, setTotals] = useState<Record<string, number>>(() =>
    Object.fromEntries(LESSONS.map((l) => [l.id, l.questions])),
  );

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(progress));
    } catch {
      // Private browsing or a full quota: progress is a convenience, not a
      // requirement, so failing to persist must never break the lesson.
    }
  }, [progress]);

  const markVisited = useCallback((lessonId: string) => {
    setProgress((p) => (p.visited.includes(lessonId) ? p : { ...p, visited: [...p.visited, lessonId] }));
  }, []);

  const markQuiz = useCallback((lessonId: string, questionId: string) => {
    setProgress((p) => {
      const cur = p.quizzes[lessonId] ?? [];
      if (cur.includes(questionId)) return p;
      return { ...p, quizzes: { ...p.quizzes, [lessonId]: [...cur, questionId] } };
    });
  }, []);

  const registerQuestionCount = useCallback((lessonId: string, count: number) => {
    setTotals((t) => (t[lessonId] === count ? t : { ...t, [lessonId]: count }));
  }, []);

  const lessonScore = useCallback(
    (lessonId: string) => ({
      done: (progress.quizzes[lessonId] ?? []).length,
      total: totalQuestions[lessonId] ?? 0,
    }),
    [progress, totalQuestions],
  );

  const reset = useCallback(() => setProgress(EMPTY), []);

  const value = useMemo(
    () => ({ progress, markVisited, markQuiz, lessonScore, reset, totalQuestions, registerQuestionCount }),
    [progress, markVisited, markQuiz, lessonScore, reset, totalQuestions, registerQuestionCount],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used inside <ProgressProvider>");
  return ctx;
}

/** Fraction 0–1 across every lesson that has registered its questions. */
export function overallProgress(p: Progress, totals: Record<string, number>): number {
  let done = 0;
  let total = 0;
  for (const l of LESSONS) {
    total += totals[l.id] ?? 0;
    done += Math.min((p.quizzes[l.id] ?? []).length, totals[l.id] ?? 0);
  }
  return total === 0 ? 0 : done / total;
}
