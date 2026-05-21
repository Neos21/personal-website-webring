import { type ReactElement, type ReactNode } from 'react';
import { isRouteErrorResponse, Links, Outlet, Scripts, ScrollRestoration } from 'react-router';

import { isEmpty } from '../shared/helpers/is-empty';

import type { Route } from './+types/root';

import './styles.css';

export function Layout({ children }: { children: ReactNode }): ReactElement {
  return (
    <html lang="ja">
      <head>
        <meta charSet="UTF-8" />
        <title>個人サイトウェブリング</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0088ff" />
        <meta name="description" content="個人サイトウェブリング" />
        <meta name="keywords" content="Persona WebSite WebRing, 個人サイトウェブリング" />
        <meta name="robots" content="index, follow" />
        
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="個人サイトウェブリング" />
        <meta property="og:title" content="個人サイトウェブリング" />
        <meta property="og:description" content="個人サイトウェブリング" />
        <meta property="og:url" content="https://personal-website-webring.neos21.workers.dev" />
        <meta property="og:image" content="https://personal-website-webring.neos21.workers.dev/icon-512.png" />
        <meta property="og:locale" content="ja_JP" />
        
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content="個人サイトウェブリング" />
        <meta property="twitter:description" content="個人サイトウェブリング" />
        <meta property="twitter:url" content="https://personal-website-webring.neos21.workers.dev" />
        <meta property="twitter:image" content="https://personal-website-webring.neos21.workers.dev/icon-512.png" />
        
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
        
        <link rel="preconnect" href="https://challenges.cloudflare.com" />
        <link rel="preconnect" href="https://static.cloudflareinsights.com" />
        
        <Links />
        
        <script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token" : "TODO"}' />
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
    <main className="error-page">
      <h1>{title}</h1>
      <p>{text}</p>
    </main>
  );
}
