import { isHTTPError } from 'ky';

export const extractApiErrorMessage = async (error: unknown, defaultMessage: string): Promise<string> => {
  if(!isHTTPError(error)) return defaultMessage;
  
  const errorJson = await error.response.json<{ error: string; }>().catch(() => ({ error: defaultMessage }));
  return errorJson.error;
};
