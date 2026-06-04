"use client";

import {
  BadgeCheck,
  Boxes,
  CheckCircle2,
  Lightbulb,
  ListChecks,
} from "lucide-react";
import { motion } from "framer-motion";
import type { ArchitectureNotes, SampleApp } from "@/lib/types";

type ResultCardProps =
  | {
      title: string;
      icon: "spark";
      type: "sample";
      content: SampleApp;
      animationDelay: number;
    }
  | {
      title: string;
      icon: "list";
      type: "tutorial";
      content: string[];
      animationDelay: number;
    }
  | {
      title: string;
      icon: "network";
      type: "architecture";
      content: ArchitectureNotes;
      animationDelay: number;
    }
  | {
      title: string;
      icon: "check";
      type: "checklist";
      content: string[];
      animationDelay: number;
    };

function CardIcon({ icon }: { icon: ResultCardProps["icon"] }) {
  const className = "text-[var(--foreground)]";

  if (icon === "spark") {
    return <Lightbulb className={className} size={22} aria-hidden="true" />;
  }

  if (icon === "list") {
    return <ListChecks className={className} size={22} aria-hidden="true" />;
  }

  if (icon === "network") {
    return <Boxes className={className} size={22} aria-hidden="true" />;
  }

  return <BadgeCheck className={className} size={22} aria-hidden="true" />;
}

function cleanListText(value: string) {
  return value
    .replace(/^\s*[-*]\s+/, "")
    .replace(/^\s*\d+[.)]\s+/, "")
    .replace(/\*\*/g, "")
    .trim();
}

export function ResultCard(props: ResultCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: props.animationDelay }}
      className="border border-[var(--foreground)] bg-[var(--panel)] p-5 shadow-[8px_8px_0_var(--foreground)] md:p-6"
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="grid size-11 shrink-0 place-items-center border border-[var(--foreground)] bg-[#f2c84b]">
          <CardIcon icon={props.icon} />
        </div>
        <h2 className="text-2xl font-black">{props.title}</h2>
      </div>

      {props.type === "sample" ? (
        <div className="grid gap-4">
          <h3 className="text-xl font-black">{props.content.title}</h3>
          <p className="max-w-3xl leading-7 text-[var(--muted)]">
            {props.content.description}
          </p>
          <div className="border-l-4 border-[var(--orange)] bg-[#fff3ec] px-4 py-3 italic leading-7 text-[var(--foreground)]">
            {props.content.why}
          </div>
        </div>
      ) : null}

      {props.type === "tutorial" ? (
        <ol className="grid gap-3">
          {props.content.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="grid grid-cols-[2.5rem_1fr] items-start gap-3"
            >
              <span className="mono grid size-10 place-items-center border border-[var(--foreground)] bg-[var(--blue)] text-sm font-black text-white">
                {index + 1}
              </span>
              <span className="pt-2 leading-7 text-[var(--muted)]">
                {cleanListText(item)}
              </span>
            </li>
          ))}
        </ol>
      ) : null}

      {props.type === "architecture" ? (
        <div className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            {props.content.apis.map((api) => (
              <span
                key={api}
                className="border border-[var(--foreground)] bg-[#dcebd2] px-3 py-1 text-sm font-black text-[var(--accent-strong)]"
              >
                {api}
              </span>
            ))}
          </div>
          <p className="max-w-3xl leading-7 text-[var(--muted)]">
            {props.content.reasoning}
          </p>
        </div>
      ) : null}

      {props.type === "checklist" ? (
        <ul className="grid gap-3">
          {props.content.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="grid grid-cols-[2.25rem_1fr] items-start gap-3"
            >
              <span className="pt-1 text-[var(--accent)]">
                <CheckCircle2 size={22} aria-hidden="true" />
              </span>
              <span className="leading-7 text-[var(--muted)]">
                {cleanListText(item)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </motion.article>
  );
}
