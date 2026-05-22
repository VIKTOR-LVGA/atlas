export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function formatCHF(amount: number): string {
  return new Intl.NumberFormat("de-CH", {
    style: "currency",
    currency: "CHF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("it-CH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string): string {
  return new Intl.DateTimeFormat("it-CH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function formatRelativeTime(date: string, now = new Date()): string {
  const timestamp = new Date(date).getTime();

  if (!Number.isFinite(timestamp)) {
    return formatDateTime(date);
  }

  const elapsedSeconds = Math.round((timestamp - now.getTime()) / 1000);
  const absoluteSeconds = Math.abs(elapsedSeconds);
  const relativeTime = new Intl.RelativeTimeFormat("it-CH", { numeric: "auto" });

  if (absoluteSeconds < 60) {
    return relativeTime.format(elapsedSeconds, "second");
  }

  if (absoluteSeconds < 60 * 60) {
    return relativeTime.format(Math.round(elapsedSeconds / 60), "minute");
  }

  if (absoluteSeconds < 60 * 60 * 24) {
    return relativeTime.format(Math.round(elapsedSeconds / (60 * 60)), "hour");
  }

  if (absoluteSeconds < 60 * 60 * 24 * 30) {
    return relativeTime.format(Math.round(elapsedSeconds / (60 * 60 * 24)), "day");
  }

  return formatDate(date);
}

export function formatFileSize(bytes: number | null): string {
  if (bytes === null) {
    return "N/D";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ["KB", "MB", "GB"];
  let size = bytes / 1024;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${new Intl.NumberFormat("it-CH", {
    maximumFractionDigits: size >= 10 ? 0 : 1,
  }).format(size)} ${units[unitIndex]}`;
}
