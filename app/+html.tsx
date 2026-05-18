import { ScrollViewStyleReset } from 'expo-router/html'
import type { PropsWithChildren } from 'react'

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{
          __html: `
            *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
            html, body {
              width: 100%; height: 100%;
              background: #F2F1EE;
              overflow: hidden;
              touch-action: none;
              overscroll-behavior: none;
            }
            #root {
              height: 100vh;
              height: 100dvh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            /* Enable momentum scrolling in RN ScrollView containers on iOS */
            div {
              -webkit-overflow-scrolling: touch;
            }
            ::-webkit-scrollbar { display: none; }
            * { scrollbar-width: none; }
          `
        }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
