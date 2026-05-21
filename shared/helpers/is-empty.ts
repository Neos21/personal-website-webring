export const isEmpty = (value: unknown): boolean => value == null || value === '' || String(value).trim().length === 0;
