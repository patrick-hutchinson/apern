import { Children, cloneElement, isValidElement } from "react";
import { PortableText } from "@portabletext/react";
import AnimationLink from "@/components/Animation/AnimationLink";
import styles from "./Text.module.css";

const EMAIL_PATTERN = /(^|[\s(>])([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})(?=$|[\s)<.,;!?])/gi;

const isEffectivelyEmpty = (children) => {
  if (!Array.isArray(children)) return !children;
  const flattened = children
    .flatMap((child) => (typeof child === "string" ? [child] : child?.props?.children ?? []))
    .join("")
    .replace(/\u00a0/g, " ")
    .trim();
  return flattened.length === 0;
};

const linkifyEmailString = (value) => {
  if (typeof value !== "string") return value;

  const matches = Array.from(value.matchAll(EMAIL_PATTERN));
  if (matches.length === 0) return value;

  const parts = [];
  let lastIndex = 0;

  matches.forEach((match, index) => {
    const [fullMatch, leading = "", email = ""] = match;
    const matchIndex = match.index ?? 0;
    const emailStart = matchIndex + fullMatch.indexOf(email);

    if (lastIndex < matchIndex) {
      parts.push(value.slice(lastIndex, matchIndex));
    }

    if (leading) {
      parts.push(leading);
    }

    parts.push(
      <AnimationLink key={`${email}-${index}`} link={{ type: "email", email }}>
        {email}
      </AnimationLink>,
    );

    lastIndex = emailStart + email.length;
  });

  if (lastIndex < value.length) {
    parts.push(value.slice(lastIndex));
  }

  return parts;
};

const linkifyEmailNodes = (node) => {
  if (typeof node === "string") return linkifyEmailString(node);
  if (Array.isArray(node)) return node.flatMap((child) => linkifyEmailNodes(child));
  if (!isValidElement(node)) return node;

  if (!("children" in node.props) || node.props.children == null) {
    return node;
  }

  const nextChildren = Children.map(node.props.children, (child) => linkifyEmailNodes(child));
  return cloneElement(node, undefined, nextChildren);
};

const Text = ({ text, typo, className, onClick, style }) => {
  if (!Array.isArray(text)) {
    return text ? (
      <p typo={typo} className={className} onClick={onClick} style={style}>
        {linkifyEmailNodes(text)}
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
              return <p>{linkifyEmailNodes(children)}</p>;
            },
            zwischenueberschrift: ({ children }) => {
              if (isEffectivelyEmpty(children)) {
                return <p className={styles.zwischenueberschrift} style={{ minHeight: "1em" }}>&nbsp;</p>;
              }
              return <p className={styles.zwischenueberschrift}>{linkifyEmailNodes(children)}</p>;
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
