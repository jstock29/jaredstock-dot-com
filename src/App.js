import "./App.scss";
import "./components/Scroll/Scroll.scss";
import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "./components/SiteChrome/SiteChrome";
import Home from "./pages/Home";

const EntryPage = lazy(() => import("./components/EntryPage/EntryPage"));
const ProjectsOrbit = lazy(() => import("./components/ProjectsOrbit/ProjectsOrbit"));
const AdminApp = lazy(() => import("./components/Admin/AdminApp"));

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin/*" element={<AdminApp />} />
          <Route path="/projects" element={<ProjectsOrbit />} />
          <Route path="/projects/:slug" element={<EntryPage type="projects" />} />
          <Route path="/publications/:slug" element={<EntryPage type="publications" />} />
          <Route path="/:slug" element={<EntryPage type="pages" />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
