import { ViewTransitions } from "next-view-transitions";

import { DeviceProvider } from "@/context/DeviceContext";

import "./globals.css";
import "./fonts.css";

import { getSite } from "@/sanity/fetch";

import ScrollRestorationController from "@/controllers/ScrollRestorationController";
import { ViewportProvider } from "../context/ViewportContext";

const fallbackSite = {
  title: "Apern",
  description: "",
};

const shareImage = {
  url: "/assets/images/share.jpeg",
  width: 1200,
  height: 706,
  alt: fallbackSite.title,
};

const buildSanityImageUrl = (baseUrl, width, height = width) => {
  if (!baseUrl) return null;
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}w=${width}&h=${height}&fit=crop&auto=format`;
};

export async function generateMetadata() {
  let site = fallbackSite;

  try {
    const fetched = await getSite();
    if (fetched) site = fetched;
  } catch {
    site = fallbackSite;
  }

  const resolvedTitle = site?.title || fallbackSite.title;
  const resolvedDescription = site?.description || fallbackSite.description;
  const resolvedOwner = site?.owner || undefined;
  const resolvedShareImage = { ...shareImage, alt: resolvedTitle };

  const faviconBaseUrl = site?.favicon?.asset?.url;
  const sanityIcons = faviconBaseUrl
    ? [
        { url: buildSanityImageUrl(faviconBaseUrl, 16), sizes: "16x16", type: "image/png" },
        { url: buildSanityImageUrl(faviconBaseUrl, 32), sizes: "32x32", type: "image/png" },
        { url: buildSanityImageUrl(faviconBaseUrl, 192), sizes: "192x192", type: "image/png" },
        { url: buildSanityImageUrl(faviconBaseUrl, 512), sizes: "512x512", type: "image/png" },
      ]
    : null;

  return {
    title: resolvedTitle,
    description: resolvedDescription,
    applicationName: resolvedTitle,
    creator: resolvedOwner,
    icons: {
      icon: sanityIcons || [
        { url: "/icons/favicon/favicon.ico" },
        { url: "/icons/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/icons/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/icons/favicon/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
        { url: "/icons/favicon/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: faviconBaseUrl
        ? [{ url: buildSanityImageUrl(faviconBaseUrl, 180), sizes: "180x180", type: "image/png" }]
        : undefined,
      shortcut: faviconBaseUrl ? buildSanityImageUrl(faviconBaseUrl, 32) : "/icons/favicon/favicon.ico",
    },
    openGraph: {
      title: resolvedTitle,
      description: resolvedDescription,
      type: "website",
      images: [resolvedShareImage],
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description: resolvedDescription,
      images: [resolvedShareImage.url],
    },
  };
}

export const dynamic = "force-dynamic";

export default function RootLayout({ children }) {
  return (
    <ViewTransitions>
      <html lang="en">
        <DeviceProvider>
          <ViewportProvider>
            <ScrollRestorationController />
            <body>
              {children}
            </body>
          </ViewportProvider>
        </DeviceProvider>
      </html>
    </ViewTransitions>
  );
}
