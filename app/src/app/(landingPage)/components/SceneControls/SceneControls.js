"use client";

import { useState } from "react";

import styles from "./SceneControls.module.css";

export default function SceneControls({
  sections = [],
  activeSection,
  setActiveSection,
  setView,
  showHDRI,
  setShowHDRI,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSectionClick = (section) => {
    setActiveSection(section);
    setView("model");
  };

  return (
    <div className={styles.menuRoot}>
      <button
        type="button"
        aria-label={isOpen ? "Close scene menu" : "Open scene menu"}
        aria-expanded={isOpen}
        className={`${styles.burgerButton} ${isOpen ? styles.burgerOpen : ""}`}
        onClick={() => setIsOpen((value) => !value)}
      >
        <span className={styles.burgerLine} />
        <span className={styles.burgerLine} />
        <span className={styles.burgerLine} />
      </button>

      <div className={`${styles.menuPanel} ${isOpen ? styles.menuPanelOpen : ""}`}>
        <p className={styles.menuLabel}>Scene</p>
        {sections.map((section, index) => {
          const isActive = section === activeSection || section.sectionKey === activeSection?.sectionKey;
          return (
            <button
              key={section.sectionKey || section.sectionTitle || index}
              type="button"
              aria-pressed={isActive}
              className={`${styles.menuButton} ${isActive ? styles.active : ""}`}
              onClick={() => handleSectionClick(section)}
            >
              {section.sectionTitle || `Stone ${index + 1}`}
            </button>
          );
        })}

        <p className={styles.menuLabel}>View</p>
        <button
          type="button"
          className={`${styles.menuButton} ${showHDRI ? styles.active : ""}`}
          onClick={() => setShowHDRI((value) => !value)}
        >
          {showHDRI ? "Hide HDRI" : "Show HDRI"}
        </button>
      </div>
    </div>
  );
}
