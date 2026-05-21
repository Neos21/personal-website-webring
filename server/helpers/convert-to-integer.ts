export const convertToInteger = (value: string | null | undefined): number | null => {
  if(value == null) return null;
  const trimmed = value.trim();
  if(trimmed === '') return null;
  
  const parsed = Number(trimmed);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};
