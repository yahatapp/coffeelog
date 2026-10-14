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
      className="space-y-1 data-disabled:opacity-50"
    >
      <div className="flex items-center justify-between gap-2">
        <SliderPrimitive.Label render={<Label />}>{label}</SliderPrimitive.Label>
        {valueDescription && (
          <span className="shrink-0 rounded-full bg-coffee-primary/10 px-3 py-0.5 text-sm font-bold text-coffee-primary">
            {valueDescription}
          </span>
        )}
      </div>
      {/* The thumb, tick marks, and labels share exactly the same track width. */}
      <div>
        <SliderPrimitive.Control className="relative flex min-h-11 w-full touch-pan-y cursor-pointer items-center px-3 select-none data-disabled:cursor-default">
          <SliderPrimitive.Track className="relative h-2 w-full rounded-full bg-coffee-secondary/20">
            <SliderPrimitive.Indicator className="rounded-full bg-coffee-primary" />
            {visibleMarks.map((mark) => (
              <span
                key={mark.value}
                aria-hidden="true"
                data-slider-mark={mark.value}
                className={cn(
                  "pointer-events-none absolute top-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full",
                  mark.value <= value ? "bg-white/70" : "bg-coffee-primary/50",
                )}
                style={{ left: position(mark.value) }}
              />
            ))}
            <SliderPrimitive.Thumb
              onBlur={onBlur}
              getAriaValueText={(_formatted, nextValue) => getValueText(nextValue)}
              className="size-5 rounded-full border-2 border-white bg-coffee-primary shadow-sm outline-none has-focus-visible:ring-2 has-focus-visible:ring-ring has-focus-visible:ring-offset-2 data-dragging:ring-4 data-dragging:ring-coffee-primary/15"
            />
          </SliderPrimitive.Track>
        </SliderPrimitive.Control>
        <div ref={labelsRef} aria-hidden="true" className="relative mx-3 -mt-1 h-7">
          {visibleMarks.map((mark) => (
            <span
              key={mark.value}
              data-slider-label={mark.value}
              className={cn(
                "absolute top-0 flex -translate-x-1/2 flex-col items-center whitespace-nowrap text-[10px] leading-3.5 text-coffee-primary",
                hiddenLabels.includes(mark.value) && "invisible",
              )}
              style={{ left: position(mark.value) }}
            >
              <span className="font-medium tabular-nums">{mark.value}</span>
              <span>{mark.label}</span>
            </span>
          ))}
        </div>
      </div>
    </SliderPrimitive.Root>
  );
};
