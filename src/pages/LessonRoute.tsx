import { Navigate, useParams } from "react-router-dom";
import { lessonById } from "../lib/curriculum";
import { LessonPage } from "../components/LessonPage";
import { SignalsLesson } from "../lessons/Signals";
import { MediaLesson } from "../lessons/Media";
import { EncodingLesson } from "../lessons/Encoding";
import { PstnLesson } from "../lessons/Pstn";
import { TopologiesLesson } from "../lessons/Topologies";

const BODIES: Record<string, () => React.ReactElement> = {
  signals: SignalsLesson,
  media: MediaLesson,
  encoding: EncodingLesson,
  pstn: PstnLesson,
  topologies: TopologiesLesson,
};

export function LessonRoute() {
  const { id = "" } = useParams();
  const meta = lessonById(id);
  const Body = BODIES[id];

  if (!meta || !Body) return <Navigate to="/" replace />;

  return (
    <LessonPage key={id} meta={meta}>
      <Body />
    </LessonPage>
  );
}
