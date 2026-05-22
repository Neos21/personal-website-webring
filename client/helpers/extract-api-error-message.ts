import { isEmpty } from '../../shared/helpers/is-empty';

export const extractApiErrorMessage = (error: any, defaultMessage: string): string => isEmpty(error?.data?.error) ? defaultMessage : error.data.error;  // eslint-disable-line @typescript-eslint/no-explicit-any
