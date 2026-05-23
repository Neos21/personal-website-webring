import ky from 'ky';

import { httpStatusCode } from '../../shared/constants/http-status-code';
import { isEmpty } from '../../shared/helpers/is-empty';
import { useAdminStore } from '../stores/admin-store';

export const adminApi = ky.extend({
  hooks: {
    beforeRequest: [({ request }): void => {
      const token = useAdminStore.getState().token;
      if(isEmpty(token)) {
        useAdminStore.getState().logout();
        window.location.href = '/admin';
        return;
      }
      request.headers.set('Authorization', `Bearer ${token}`);
    }],
    afterResponse: [({ response }): void => {
      if(response.status === httpStatusCode.unauthorized) {
        useAdminStore.getState().logout();
        window.location.href = '/admin';
        return;
      }
    }]
  }
});
