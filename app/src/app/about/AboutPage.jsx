"use client";

import { useState } from "react";
import Text from "@/components/Text/Text";
import LandingPageHeader from "../(landingPage)/components/LandingPageHeader";
import LandingPageFooter from "../(landingPage)/components/LandingPageFooter";
import styles from "../(landingPage)/LandingPage.module.css";
import { motion } from "framer-motion";
import { useAnimatedNavigation } from "@/components/Animation/hooks/useAnimatedNavigation";

const SECTION_MODELS = [
  { thumbnailPath: "/assets/models/13/13.gif" },
  { thumbnailPath: "/assets/models/14/14.gif" },
  { thumbnailPath: "/assets/models/16/16.gif" },
];

const AboutPage = ({ page, landingPage, selectedSectionKey }) => {
  const [isClosing, setIsClosing] = useState(false);
  const navigate = useAnimatedNavigation();
  const sections = landingPage?.sections ?? [];
  const selectedSection = sections.find(
    (section) => section.sectionKey === selectedSectionKey || section.sectionTitle === selectedSectionKey,
  );
  const selectedSectionIndex = selectedSection ? sections.indexOf(selectedSection) : 0;
  const currentSection = selectedSection ?? sections[0];
  const defaultThumbnail = SECTION_MODELS[Math.max(0, selectedSectionIndex)]?.thumbnailPath ?? SECTION_MODELS[0].thumbnailPath;
  const credits = page?.credits;

  const getReturnSectionKey = () => {
    const storedSectionKey = typeof window !== "undefined" ? window.sessionStorage.getItem("lastSection") : "";
    return selectedSectionKey || storedSectionKey || currentSection?.sectionKey || currentSection?.sectionTitle || "";
  };

  const handleThumbnailClick = () => {
    const sectionKey = getReturnSectionKey();
    if (!sectionKey) {
      navigate("/?view=model");
      return;
    }
    navigate(`/?section=${encodeURIComponent(sectionKey)}&view=model`);
  };

  const handleAboutClose = () => {
    if (isClosing) return;
    setIsClosing(true);

    window.setTimeout(() => {
      const sectionKey = getReturnSectionKey();
      if (sectionKey) {
        navigate(`/?section=${encodeURIComponent(sectionKey)}&view=text`);
        return;
      }
      setIsClosing(false);
    }, 2000);
  };

  return (
    <main className={styles.page}>
      <motion.div
        animate={{ opacity: isClosing ? 0 : 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
        style={{ pointerEvents: isClosing ? "none" : "auto" }}
      >
        <LandingPageHeader
          thumbnailPath={defaultThumbnail}
          onThumbnailClick={handleThumbnailClick}
          infoLabel="Close"
          onInfoClick={handleAboutClose}
        />
      </motion.div>

      <motion.div
        className={styles.aboutCredits}
        animate={{ opacity: isClosing ? 0 : 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
      >
        {credits ? (
          <div>
            <Text text={credits} typo="h3" />
          </div>
        ) : null}
      </motion.div>

      {/* <motion.div
        animate={{ opacity: isClosing ? 0 : 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
        style={{ pointerEvents: isClosing ? "none" : "auto" }}
      >
        <LandingPageFooter
          page={{ sections }}
          activeSection={null}
          setActiveSection={() => {}}
          setView={() => {}}
          getSectionHref={(section) =>
            `/?section=${encodeURIComponent(section.sectionKey ?? section.sectionTitle ?? "")}&view=text`
          }
        />
      </motion.div> */}
    </main>
  );
};

export default AboutPage;
