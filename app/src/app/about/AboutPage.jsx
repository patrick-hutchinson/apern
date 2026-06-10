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

const AboutPage = ({ page, landingPage }) => {
  const [isClosing, setIsClosing] = useState(false);
  const navigate = useAnimatedNavigation();
  const sections = landingPage?.sections ?? [];
  const defaultThumbnail = SECTION_MODELS[0].thumbnailPath;
  const defaultSection = sections[0];
  const credits = page?.credits;

  const handleThumbnailClick = () => {
    if (!defaultSection) {
      navigate("/?view=model");
      return;
    }
    const sectionKey = encodeURIComponent(defaultSection.sectionKey ?? defaultSection.sectionTitle ?? "");
    navigate(`/?section=${sectionKey}&view=model`);
  };

  const handleAboutClose = () => {
    if (isClosing) return;
    setIsClosing(true);

    window.setTimeout(() => {
      if (typeof window !== "undefined" && window.history.length > 1) {
        window.history.back();
        return;
      }
      navigate("/?view=model");
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
