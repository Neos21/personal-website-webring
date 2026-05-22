import ky from 'ky';

import { getJwt, removeJwt } from './admin-auth';
import { isEmpty } from '../../shared/helpers/is-empty';

export const adminApi = ky.extend({
  hooks: {
    beforeRequest: [({ request }): void => {
      const token = getJwt();
      if(isEmpty(token)) {
        removeJwt();
        window.location.href = '/admin';
        return;
      }
      request.headers.set('Authorization', `Bearer ${token}`);
    }],
    afterResponse: [({ response }): void => {
      if(response.status === 401) {
        removeJwt();
        window.location.href = '/admin';
        return;
      }
    }]
  }
});
