'use client';

import { StyleSheetManager } from 'styled-components';
import type { Metadata } from 'next';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk">
      <body>
        <StyleSheetManager>{children}</StyleSheetManager>
      </body>
    </html>
  );
}
