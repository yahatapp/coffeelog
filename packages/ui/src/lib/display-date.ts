const displayDate = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Tokyo",
  weekday: "short",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function formatDisplayDate(value: string | null | undefined): string | null {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const parts = Object.fromEntries(
    displayDate.formatToParts(date).map(({ type, value }) => [type, value]),
  );
  return `${parts.weekday}. ${parts.year}.${parts.month}.${parts.day}`;
}
