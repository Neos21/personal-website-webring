import { isEmpty } from '../../shared/helpers/is-empty';

const adminJwtKey = 'admin-jwt' as const;

export const saveJwt = (token: string): void => localStorage.setItem(adminJwtKey, token);
export const getJwt = (): string | null => localStorage.getItem(adminJwtKey);
export const removeJwt = (): void => localStorage.removeItem(adminJwtKey);
export const isAuthenticated = (): boolean => !isEmpty(getJwt());
