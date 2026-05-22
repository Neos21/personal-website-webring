import { Turnstile } from '@marsidev/react-turnstile';
import { type ReactElement } from 'react';

type Props = {
  onTokenChange: (token: string) => void;
};

export function TurnstileField({ onTokenChange }: Props): ReactElement {
  const onSuccess       = (token: string): void => { onTokenChange(token); };
  const onExpireOrError = (             ): void => { onTokenChange(''   ); };
  
  return (
    <div className="turnstile-wrapper">
      <Turnstile options={{ language: 'ja' }} onSuccess={onSuccess} onExpire={onExpireOrError} onError={onExpireOrError} siteKey="0x4AAAAAADTe5cN4tNIECyYT" />
    </div>
  );
}
