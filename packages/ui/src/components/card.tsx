import styles from "./card.module.css";
import * as React from "react";
import { cn } from "../lib/cn";

type CardProps = React.HTMLAttributes<HTMLDivElement> & { selected?: boolean };

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, selected = false, ...props }, ref) => (
    <div ref={ref} className={cn(styles.root, selected && styles.selected, className)} {...props} />
  ),
);
Card.displayName = "Card";

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn(styles.header, className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn(styles.title, className)} {...props} />
));
CardTitle.displayName = "CardTitle";

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn(styles.content, className)} {...props} />
  ),
);
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn(styles.footer, className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";
