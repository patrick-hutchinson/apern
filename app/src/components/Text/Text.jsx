import { PortableText } from "@portabletext/react";
import AnimationLink from "@/components/Animation/AnimationLink";
import styles from "./Text.module.css";

const isEffectivelyEmpty = (children) => {
  if (!Array.isArray(children)) return !children;
  const flattened = children
    .flatMap((child) => (typeof child === "string" ? [child] : child?.props?.children ?? []))
    .join("")
    .replace(/\u00a0/g, " ")
    .trim();
  return flattened.length === 0;
};

const Text = ({ text, typo, className, onClick, style }) => {
  if (!Array.isArray(text)) {
    return text ? (
      <p typo={typo} className={className} onClick={onClick} style={style}>
        {text}
      </p>
    ) : null;
  }

  return (
    <div className={className} typo={typo} onClick={onClick} style={style}>
      <PortableText
        value={text}
        components={{
          block: {
            normal: ({ children }) => {
              if (isEffectivelyEmpty(children)) {
                // Reserve one full line for intentionally empty paragraphs.
                return <p style={{ minHeight: "1em" }}>&nbsp;</p>;
              }
              return <p>{children}</p>;
            },
            zwischenueberschrift: ({ children }) => {
              if (isEffectivelyEmpty(children)) {
                return <p className={styles.zwischenueberschrift} style={{ minHeight: "1em" }}>&nbsp;</p>;
              }
              return <p className={styles.zwischenueberschrift}>{children}</p>;
            },
          },
          marks: {
            link: ({ value, children }) => {
              if (!value) return children;

              return <AnimationLink link={value}>{children}</AnimationLink>;
            },
          },
        }}
      />
    </div>
  );
};

export default Text;
