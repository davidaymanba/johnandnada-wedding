import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost, Pinyon_Script } from "next/font/google";
import { site } from "@/content/site";
import "./globals.css";

const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500"], style: ["normal", "italic"], variable: "--nf-serif", display: "swap" });
const script = Pinyon_Script({ subsets: ["latin"], weight: "400", variable: "--nf-script", display: "swap" });
const sans = Jost({ subsets: ["latin"], weight: ["300", "400", "500"], variable: "--nf-sans", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: site.title,
  description: site.description,
  openGraph: { title: site.title, description: site.description, type: "website", url: "/", siteName: "John Michel & Nada Nassef" },
  twitter: { card: "summary_large_image", title: site.title, description: site.description },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1C2230",
};

// Runs before first paint: decide whether the door intro plays, so nothing flashes.
const gate = `try{var d=document.documentElement;d.classList.add('js');var t=localStorage.getItem('nj-theme');d.dataset.theme=t==='light'?'light':'dark';if(t==='light'){var m=document.querySelector('meta[name=theme-color]');m&&m.setAttribute('content','#F0EEE9')}var h=location.hash.length>1,q=/[?&]skip/.test(location.search),s=sessionStorage.getItem('nj-door')==='1';if(h||q||s){d.dataset.intro='skip'}else{d.classList.add('is-locked');history.scrollRestoration='manual'}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={`${serif.variable} ${script.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: gate }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
