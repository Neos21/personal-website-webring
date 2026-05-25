export const isImageUrl = (value: string | null | undefined): boolean => (/^https?:\/\/.+\.(jpe?g|gif|png|webp)$/).test(String(value).trim().toLowerCase());
