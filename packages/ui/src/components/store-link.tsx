import type { MouseEventHandler } from "react";
import { Button } from "./button";
import { classifyStoreLink } from "../lib/store-links";
import styles from "./store-link.module.css";

export type StoreLinkProps = {
  href: string;
  showExternalIndicator?: boolean;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

const instagramGlyph = new URL("../assets/instagram-glyph-gradient.png", import.meta.url).href;

export function StoreLink({ href, onClick, showExternalIndicator = false }: StoreLinkProps) {
  const type = classifyStoreLink(href);
  const label =
    type === "instagram" ? "Instagram" : type === "google_maps" ? "Google Map" : "ホームページ";

  return (
    <Button asChild variant="secondary" size="xs">
      <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick}>
        {type === "instagram" ? (
          <img
            src={instagramGlyph}
            alt=""
            aria-hidden="true"
            width={16}
            height={16}
            className={styles.brandIcon}
          />
        ) : (
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
            className={styles.icon}
          >
            {type === "google_maps" ? (
              <>
                <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </>
            ) : (
              <>
                <circle cx="12" cy="12" r="10" />
                <ellipse cx="12" cy="12" rx="4" ry="10" />
                <path d="M2 12h20" />
              </>
            )}
          </svg>
        )}
        <span>{label}</span>
        {showExternalIndicator && (
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
            data-external-indicator="true"
            className={styles.icon}
          >
            <path d="M14 3h7v7M21 3l-9 9M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" />
          </svg>
        )}
      </a>
    </Button>
  );
}
