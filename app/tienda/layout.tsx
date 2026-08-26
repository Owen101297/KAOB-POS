import { Playfair_Display } from 'next/font/google';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['500', '600', '700', '800', '900'],
});

export default function TiendaLayout({ children }: { children: React.ReactNode }) {
  return <div className={playfair.variable}>{children}</div>;
}
