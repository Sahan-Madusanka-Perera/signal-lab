import { useEffect, useMemo, useState, type ReactNode } from "react";
import clsx from "clsx";
import { useProgress } from "../lib/progress";
import { Badge, Button } from "./ui";

export type Question = {
  id: string;
  prompt: ReactNode;
  options: { label: ReactNode; correct?: boolean }[];
  /** Shown after the student answers, right or wrong. */
  explain: ReactNode;
};

/**
 * A checkpoint, not a test. Wrong answers keep the question open and say why
 * the choice fails; the explanation appears either way so the student always
 * leaves with the reasoning rather than just the letter.
 */
export function Quiz({
  lessonId,
  questions,
  title = "Check yourself",
}: {
  lessonId: string;
  questions: Question[];
  title?: string;
}) {
  const { markQuiz, registerQuestionCount, progress } = useProgress();
  const [picked, setPicked] = useState<Record<string, number | null>>({});

  useEffect(() => {
    registerQuestionCount(lessonId, questions.length);
  }, [lessonId, questions.length, registerQuestionCount]);

  const solved = useMemo(() => new Set(progress.quizzes[lessonId] ?? []), [progress, lessonId]);

  return (
    <div className="rounded-xl border border-line bg-surface">
      <header className="flex items-center justify-between gap-4 border-b border-line px-4 py-3">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        <Badge tone={solved.size === questions.length ? "ok" : "neutral"}>
          {solved.size} / {questions.length} correct
        </Badge>
      </header>

      <ol className="divide-y divide-[var(--line)]">
        {questions.map((q, qi) => {
          const choice = picked[q.id] ?? null;
          const isSolved = solved.has(q.id);
          const answered = choice !== null || isSolved;
          const correctIndex = q.options.findIndex((o) => o.correct);

          return (
            <li key={q.id} className="px-4 py-4">
              <div className="flex items-start gap-2.5">
                <span
                  className={clsx(
                    "tnum mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md font-mono text-2xs font-semibold",
                    isSolved ? "bg-ok-wash text-ok" : "bg-surface-2 text-ink-3",
                  )}
                >
                  {isSolved ? <Tick /> : qi + 1}
                </span>
                <p className="max-w-[68ch] text-sm text-ink">{q.prompt}</p>
              </div>

              <div className="mt-3 ml-7.5 grid gap-1.5">
                {q.options.map((o, oi) => {
                  const chosen = choice === oi;
                  const showAsCorrect = answered && oi === correctIndex;
                  const showAsWrong = chosen && !o.correct;

                  return (
                    <button
                      key={oi}
                      type="button"
                      disabled={isSolved}
                      onClick={() => {
                        setPicked((p) => ({ ...p, [q.id]: oi }));
                        if (o.correct) markQuiz(lessonId, q.id);
                      }}
                      className={clsx(
                        "flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-sm transition-all duration-150 ease-[var(--ease-out-quart)]",
                        showAsCorrect
                          ? "border-ok bg-ok-wash text-ink"
                          : showAsWrong
                            ? "border-bad bg-bad-wash text-ink"
                            : "border-line bg-surface hover:border-line-strong hover:bg-surface-2",
                        isSolved && !showAsCorrect && "opacity-55",
                      )}
                    >
                      <span
                        className={clsx(
                          "grid h-4.5 w-4.5 shrink-0 place-items-center rounded-full border text-2xs font-semibold",
                          showAsCorrect
                            ? "border-ok bg-ok text-[var(--bg)]"
                            : showAsWrong
                              ? "border-bad bg-bad text-[var(--bg)]"
                              : "border-line-strong text-ink-3",
                        )}
                      >
                        {showAsCorrect ? <Tick /> : showAsWrong ? <Cross /> : String.fromCharCode(65 + oi)}
                      </span>
                      <span className="min-w-0">{o.label}</span>
                    </button>
                  );
                })}
              </div>

              {answered && (
                <div
                  className="mt-3 ml-7.5 rounded-lg border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-ink-2"
                  style={{ animation: "rise var(--dur) var(--ease-out-quart)" }}
                >
                  <span
                    className={clsx(
                      "mr-1.5 text-2xs font-semibold",
                      isSolved || q.options[choice ?? -1]?.correct ? "text-ok" : "text-bad",
                    )}
                  >
                    {isSolved || q.options[choice ?? -1]?.correct ? "Correct." : "Not quite."}
                  </span>
                  {q.explain}
                  {!isSolved && !q.options[choice ?? -1]?.correct && (
                    <div className="mt-2">
                      <Button size="sm" onClick={() => setPicked((p) => ({ ...p, [q.id]: null }))}>
                        Try again
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Tick() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path d="M2 5.2L4 7.2L8 2.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Cross() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path d="M2.6 2.6l4.8 4.8M7.4 2.6L2.6 7.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
