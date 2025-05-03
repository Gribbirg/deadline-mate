import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3182ce" />
        <meta name="application-name" content="Deadline Mate" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Deadline Mate" />
        <meta name="description" content="Deadline Mate - Task and deadline management system for students and teachers" />
        <meta property="og:title" content="Deadline Mate" />
        <meta property="og:description" content="Task and deadline management system for students and teachers" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/images/logo.jpg" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
} 