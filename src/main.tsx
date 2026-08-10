import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./index.css";
import { ThemeProvider } from "./lib/theme";
import { ProgressProvider } from "./lib/progress";
import { Shell } from "./components/Shell";
import { Home } from "./pages/Home";
import { LessonRoute } from "./pages/LessonRoute";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <ProgressProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Shell />}>
              <Route path="/" element={<Home />} />
              <Route path="/lesson/:id" element={<LessonRoute />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ProgressProvider>
    </ThemeProvider>
  </StrictMode>,
);
