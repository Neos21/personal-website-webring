import type { DenyDomainAdmin } from './admin/admin-deny-domain';

export type DenyDomainPublic = Pick<DenyDomainAdmin, 'id' | 'domain'>;
