import { Suspense, lazy } from "react";
import { Navigate, useParams } from "react-router-dom";
import { lessonById } from "../lib/curriculum";
import { LessonPage } from "../components/LessonPage";

/**
 * Each competency level is its own chunk. A student only ever reads one at a
 * time, and the whole set together is a large download on a slow connection.
 */
const BODIES: Record<string, React.LazyExoticComponent<() => React.ReactElement>> = {
  signals: lazy(() => import("../lessons/Signals").then((m) => ({ default: m.SignalsLesson }))),
  media: lazy(() => import("../lessons/Media").then((m) => ({ default: m.MediaLesson }))),
  encoding: lazy(() => import("../lessons/Encoding").then((m) => ({ default: m.EncodingLesson }))),
  pstn: lazy(() => import("../lessons/Pstn").then((m) => ({ default: m.PstnLesson }))),
  topologies: lazy(() => import("../lessons/Topologies").then((m) => ({ default: m.TopologiesLesson }))),
  mac: lazy(() => import("../lessons/Mac").then((m) => ({ default: m.MacLesson }))),
  internet: lazy(() => import("../lessons/Internet").then((m) => ({ default: m.InternetLesson }))),
  transport: lazy(() => import("../lessons/Transport").then((m) => ({ default: m.TransportLesson }))),
  applications: lazy(() => import("../lessons/Applications").then((m) => ({ default: m.ApplicationsLesson }))),
};

export function LessonRoute() {
  const { id = "" } = useParams();
  const meta = lessonById(id);
  const Body = BODIES[id];

  if (!meta || !Body) return <Navigate to="/" replace />;

  return (
    <LessonPage key={id} meta={meta}>
      <Suspense fallback={<LessonSkeleton />}>
        <Body />
      </Suspense>
    </LessonPage>
  );
}

/** Holds the page's shape while the chunk arrives, rather than collapsing it. */
function LessonSkeleton() {
  return (
    <div className="grid gap-14" aria-busy="true" aria-label="Loading this level">
      {[0, 1].map((i) => (
        <div key={i}>
          <div className="h-6 w-[min(24ch,70%)] rounded-md bg-surface-2" />
          <div className="mt-3 h-4 w-[min(60ch,95%)] rounded-md bg-surface-2 opacity-70" />
          <div className="mt-2 h-4 w-[min(48ch,80%)] rounded-md bg-surface-2 opacity-70" />
          <div className="mt-5 h-[240px] rounded-xl border border-line bg-surface" />
        </div>
      ))}
    </div>
  );
}
