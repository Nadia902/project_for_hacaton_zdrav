import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Здоровая среда - Интерактивная карта здоровья города',
  description: 'Платформа для оценки городской инфраструктуры, улучшения качества жизни и поддержки управленческих решений',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('theme');
                  if (!savedTheme) {
                    localStorage.setItem('theme', 'light');
                  }
                  const theme = savedTheme || 'light';
                  if (theme === 'dark') {
                    document.documentElement.setAttribute('data-theme', 'dark');
                  } else {
                    document.documentElement.removeAttribute('data-theme');
                  }
                } catch (e) {}
                
                // Предотвращаем автоматическую прокрутку к якорю при обновлении страницы (только на главной)
                if (window.location.pathname === '/' && window.location.hash) {
                  window.history.replaceState(null, '', window.location.pathname + window.location.search);
                  window.scrollTo(0, 0);
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
