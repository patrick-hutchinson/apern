"use client";

import { useEffect, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

import { createHDRI } from "./components/Scene/hdri/hdri";

import Scene from "./components/Scene/Scene";
import Text from "@/components/Text/Text";

import LandingPageHeader from "./components/LandingPageHeader";
import LandingPageFooter from "./components/LandingPageFooter";

import styles from "./LandingPage.module.css";

const SECTION_MODELS = [
  { modelPath: "/assets/models/13/13-optimized.glb", thumbnailPath: "/assets/models/13/13.gif" },
  { modelPath: "/assets/models/14/14-optimized.glb", thumbnailPath: "/assets/models/14/14.gif" },
  { modelPath: "/assets/models/16/16-optimized.glb", thumbnailPath: "/assets/models/16/16.gif" },
];

const LandingPage = ({ page, selectedSectionKey, selectedView }) => {
  const [view, setView] = useState(selectedView === "text" ? "text" : "model");
  const [activeSection, setActiveSection] = useState();

  const hdri = createHDRI;
  const activeSectionIndex = page?.sections?.findIndex((section) => section.sectionKey === activeSection?.sectionKey);
  const activeModel = SECTION_MODELS[Math.max(0, activeSectionIndex)] ?? SECTION_MODELS[0];

  if (!page || page.length === 0) return;

  useEffect(() => {
    const sections = page?.sections ?? [];
    if (sections.length === 0) return;
    const requested = sections.find((section) => section.sectionKey === selectedSectionKey);
    if (requested) {
      setActiveSection(requested);
      setView(selectedView === "text" ? "text" : "model");
      return;
    }

    const randomIndex = Math.floor(Math.random() * sections.length);
    setActiveSection(sections[randomIndex]);
  }, [page, selectedSectionKey, selectedView]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      if (view !== "model") return;
      setView("text");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [view]);

  useEffect(() => {
    const activeSectionKey = activeSection?.sectionKey ?? activeSection?.sectionTitle ?? "";
    if (!activeSectionKey) return;
    window.sessionStorage.setItem("lastSection", activeSectionKey);
  }, [activeSection]);

  if (!activeSection) return null;

  const activeSectionKey = activeSection.sectionKey ?? activeSection.sectionTitle ?? "";
  const activeSectionParam = encodeURIComponent(activeSectionKey);
  const activeSectionAboutPath = `/about?section=${activeSectionParam}`;

  return (
    <main className={styles.page}>
      <AnimatePresence mode="wait">
        {view === "text" ? (
          <motion.div
            key="text-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: "easeOut" }}
          >
            <LandingPageHeader
              thumbnailPath={activeModel.thumbnailPath}
              setView={setView}
              infoPath={activeSectionAboutPath}
            />

            <AnimatePresence mode="wait">
              <motion.div
                className={styles.sectionText}
                key={activeSection.sectionKey}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2, ease: "easeOut" }}
              >
                <Text text={activeSection.sectionText} typo="h2" />
              </motion.div>
            </AnimatePresence>

            <LandingPageFooter
              page={page}
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              setView={setView}
              shouldAnimate
            />
          </motion.div>
        ) : (
          <Scene
            key={`${activeSection.sectionKey}-${activeModel.modelPath}`}
            createEnvironmentScene={hdri}
            activeSection={activeSection}
            activeSectionIndex={activeSectionIndex}
            modelPath={activeModel.modelPath}
            setView={setView}
          />
        )}
      </AnimatePresence>
    </main>
  );
};

export default LandingPage;
