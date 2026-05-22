import ky from 'ky';

import { getJwt, removeJwt } from './admin-auth';
import { httpStatusCode } from '../../shared/constants/http-status-code';
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
      if(response.status === httpStatusCode.unauthorized) {
        removeJwt();
        window.location.href = '/admin';
        return;
      }
    }]
  }
});
