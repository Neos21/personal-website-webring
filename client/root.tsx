import { type ReactElement, type ReactNode } from 'react';
import { isRouteErrorResponse, Link, Links, Outlet, Scripts, ScrollRestoration } from 'react-router';

import { appConstants } from '../shared/constants/app-constants';
import { isEmpty } from '../shared/helpers/is-empty';

import type { Route } from './+types/root';

import './styles.css';

export function Layout({ children }: { children: ReactNode }): ReactElement {
  return (
    <html lang="ja">
      <head>
        <meta charSet="UTF-8" />
        <title>{appConstants.siteNameJapanese}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0088ff" />
        <meta name="description" content={appConstants.siteNameJapanese} />
        <meta name="keywords" content={`${appConstants.siteNameJapanese}, ${appConstants.siteNameEnglish}`} />
        <meta name="robots" content="index, follow" />
        
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={appConstants.siteNameJapanese} />
        <meta property="og:title" content={appConstants.siteNameJapanese} />
        <meta property="og:description" content={appConstants.siteNameJapanese} />
        <meta property="og:url" content={appConstants.origin} />
        <meta property="og:image" content={`${appConstants.origin}/icon-512.png`} />
        <meta property="og:locale" content="ja_JP" />
        
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content={appConstants.siteNameJapanese} />
        <meta property="twitter:description" content={appConstants.siteNameJapanese} />
        <meta property="twitter:url" content={appConstants.origin} />
        <meta property="twitter:image" content={`${appConstants.origin}/icon-512.png`} />
        
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
        
        <link rel="preconnect" href="https://challenges.cloudflare.com" />
        <link rel="preconnect" href="https://static.cloudflareinsights.com" />
        
        <Links />
        
        <script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token" : "5590bcb26e704bdba93a62251bd2dba0"}' />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App(): ReactElement {
  return (<Outlet />);
}

export function HydrateFallback(): ReactElement {
  return (<></>);
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps): ReactElement {
  console.error('ErrorBoundary', error);
  
  let title = 'エラー';
  let text = 'エラーが発生しました';
  if(isRouteErrorResponse(error)) {
    if(error.status === 404) {
      title = '404';
      text  = 'ページが見つかりませんでした';
    }
    if(!isEmpty(error.statusText)) text = error.statusText;
  }
  
  return (
    <main>
      <h1>{appConstants.siteNameJapanese}</h1>
      
      <div className="mb-8 p-4 font-bold text-red-600 text-center bg-red-50">
        <div className="mb-4 text-lg">{title}</div>
        <div>{text}</div>
      </div>
      
      <div className="text-center"><Link to="/">トップへ戻る</Link></div>
    </main>
  );
}
