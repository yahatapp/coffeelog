import styles from "./slider.module.css";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { cn } from "./button";
import { Label } from "./label";

type SliderMark = {
  value: number;
  label: string;
};

type SliderProps = {
  id: string;
  label: ReactNode;
  valueDescription?: string;
  min: number;
  max: number;
  value: number;
  marks: SliderMark[];
  disabled?: boolean;
  onValueChange: (value: number) => void;
  onBlur: () => void;
  getValueText: (value: number) => string;
};

export const Slider = ({
  id,
  label,
  valueDescription,
  min,
  max,
  value,
  marks,
  disabled = false,
  onValueChange,
  onBlur,
  getValueText,
}: SliderProps) => {
  const labelsRef = useRef<HTMLDivElement>(null);
  const [hiddenLabels, setHiddenLabels] = useState<number[]>([]);
  const visibleMarks = marks
    .filter((mark) => mark.value >= min && mark.value <= max)
    .toSorted((first, second) => first.value - second.value);
  const position = (markValue: number) => `${((markValue - min) / (max - min)) * 100}%`;

  useLayoutEffect(() => {
    const labels = labelsRef.current;
    if (!labels) return;

    const updateLabels = () => {
      const elements = Array.from(labels.querySelectorAll<HTMLElement>("[data-slider-label]"));
      const lastBounds = elements.at(-1)?.getBoundingClientRect();
      const hidden: number[] = [];
      let previousRight = -Infinity;

      // Keep the end labels and omit crowded intermediate text, never move a mark.
      for (const [index, element] of elements.entries()) {
        const bounds = element.getBoundingClientRect();
        const overlapsPrevious = bounds.left < previousRight + 1;
        const overlapsLast =
          index > 0 &&
          index < elements.length - 1 &&
          lastBounds &&
          bounds.right + 1 > lastBounds.left;
        if (overlapsPrevious || overlapsLast) {
          hidden.push(Number(element.dataset.sliderLabel));
        } else {
          previousRight = bounds.right;
        }
      }

      setHiddenLabels((previous) =>
        previous.length === hidden.length && previous.every((item, index) => item === hidden[index])
          ? previous
          : hidden,
      );
    };

    updateLabels();
    const observer = new ResizeObserver(updateLabels);
    observer.observe(labels);
    return () => observer.disconnect();
  }, [marks, min, max]);

  return (
    <SliderPrimitive.Root
      id={id}
      min={min}
      max={max}
      step={1}
      value={value}
      disabled={disabled}
      onValueChange={onValueChange}
      thumbAlignment="center"
      className={styles.root}
    >
      <div className={styles.heading}>
        <SliderPrimitive.Label render={<Label />}>{label}</SliderPrimitive.Label>
        {valueDescription && <span className={styles.value}>{valueDescription}</span>}
      </div>
      {/* The thumb, tick marks, and labels share exactly the same track width. */}
      <div>
        <SliderPrimitive.Control className={styles.control}>
          <SliderPrimitive.Track data-slider-track className={styles.track}>
            <SliderPrimitive.Indicator className={styles.indicator} />
            {visibleMarks.map((mark) => (
              <span
                key={mark.value}
                aria-hidden="true"
                data-slider-mark={mark.value}
                className={cn(
                  styles.tick,
                  mark.value <= value ? styles.tickDone : styles.tickPending,
                )}
                style={{ left: position(mark.value) }}
              />
            ))}
            <SliderPrimitive.Thumb
              onBlur={onBlur}
              getAriaValueText={(_formatted, nextValue) => getValueText(nextValue)}
              className={styles.thumb}
            />
          </SliderPrimitive.Track>
        </SliderPrimitive.Control>
        <div ref={labelsRef} aria-hidden="true" className={styles.labels}>
          {visibleMarks.map((mark) => (
            <span
              key={mark.value}
              data-slider-label={mark.value}
              className={cn(styles.markLabel, hiddenLabels.includes(mark.value) && styles.hidden)}
              style={{ left: position(mark.value) }}
            >
              <span className={styles.markValue}>{mark.value}</span>
              <span>{mark.label}</span>
            </span>
          ))}
        </div>
      </div>
    </SliderPrimitive.Root>
  );
};
