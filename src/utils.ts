/** 生成 datetime-local 输入框需要的本地时间字符串（YYYY-MM-DDTHH:mm） */
export function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 默认锚点时间：当前整点 */
export function defaultAnchorTime(): string {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  return toLocalInputValue(d);
}

export function isValidDateTimeLocal(value: string): boolean {
  return value.length > 0 && !Number.isNaN(new Date(value).getTime());
}

export function addMinutes(iso: string, minutes: number): Date {
  return new Date(new Date(iso).getTime() + minutes * 60_000);
}

/** 格式化为 YYYY-MM-DD HH:mm */
export function formatDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 相对偏移的友好展示，如 +1小时30分 / -45分钟 */
export function formatRelative(minutes: number): string {
  if (minutes === 0) return '±0';
  const sign = minutes > 0 ? '+' : '-';
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h === 0) return `${sign}${m}分钟`;
  if (m === 0) return `${sign}${h}小时`;
  return `${sign}${h}小时${m}分`;
}

export function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
