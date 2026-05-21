export const reduceNewlines = (value: string): string => value.replace((/\r\n|\r/g), '\n').replace((/\n{3,}/g), '\n\n');
