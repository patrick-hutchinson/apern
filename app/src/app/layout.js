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
  locale: "en",
  businessType: "Organization",
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

const normalizeSiteUrl = (url) => {
  if (!url) return null;
  try {
    const parsedUrl = new URL(url);
    parsedUrl.pathname = parsedUrl.pathname.replace(/\/$/, "");
    return parsedUrl.toString();
  } catch {
    return null;
  }
};

const absolutizeUrl = (url, siteUrl) => {
  if (!url) return null;
  try {
    return new URL(url, siteUrl ?? undefined).toString();
  } catch {
    return url;
  }
};

const toOpenGraphLocale = (locale) => locale?.replace("-", "_");

const cleanObject = (object) =>
  Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined && value !== null && value !== ""));

const getResolvedSite = async () => {
  let site = fallbackSite;

  try {
    const fetched = await getSite();
    if (fetched) site = fetched;
  } catch {
    site = fallbackSite;
  }

  return {
    ...fallbackSite,
    ...site,
  };
};

const getSiteMeta = (site) => {
  const resolvedTitle = site?.title || fallbackSite.title;
  const resolvedDescription = site?.description || fallbackSite.description;
  const resolvedOwner = site?.owner || undefined;
  const resolvedLocale = site?.locale || fallbackSite.locale;
  const resolvedSiteUrl = normalizeSiteUrl(site?.siteUrl);
  const faviconBaseUrl = site?.favicon?.asset?.url;
  const shareImageBaseUrl = site?.shareImage?.asset?.url;
  const resolvedShareImage = shareImageBaseUrl
    ? {
        url: buildSanityImageUrl(shareImageBaseUrl, 1200, 630),
        width: 1200,
        height: 630,
        alt: site?.shareImage?.alt || resolvedTitle,
      }
    : { ...shareImage, url: absolutizeUrl(shareImage.url, resolvedSiteUrl) ?? shareImage.url, alt: resolvedTitle };
  const socialLinks = (site?.socials ?? []).map((social) => social?.link).filter(Boolean);

  return {
    resolvedTitle,
    resolvedDescription,
    resolvedOwner,
    resolvedLocale,
    resolvedSiteUrl,
    faviconBaseUrl,
    resolvedShareImage,
    socialLinks,
  };
};

export async function generateMetadata() {
  const site = await getResolvedSite();
  const {
    resolvedTitle,
    resolvedDescription,
    resolvedOwner,
    resolvedLocale,
    resolvedSiteUrl,
    faviconBaseUrl,
    resolvedShareImage,
  } = getSiteMeta(site);

  const sanityIcons = faviconBaseUrl
    ? [
        { url: buildSanityImageUrl(faviconBaseUrl, 16), sizes: "16x16", type: "image/png" },
        { url: buildSanityImageUrl(faviconBaseUrl, 32), sizes: "32x32", type: "image/png" },
        { url: buildSanityImageUrl(faviconBaseUrl, 192), sizes: "192x192", type: "image/png" },
        { url: buildSanityImageUrl(faviconBaseUrl, 512), sizes: "512x512", type: "image/png" },
      ]
    : null;

  return {
    metadataBase: resolvedSiteUrl ? new URL(resolvedSiteUrl) : undefined,
    title: resolvedTitle,
    description: resolvedDescription,
    applicationName: resolvedTitle,
    creator: resolvedOwner,
    alternates: {
      canonical: resolvedSiteUrl || "/",
    },
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
      url: resolvedSiteUrl || undefined,
      siteName: resolvedTitle,
      locale: toOpenGraphLocale(resolvedLocale),
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

const getStructuredData = (site) => {
  const {
    resolvedTitle,
    resolvedDescription,
    resolvedOwner,
    resolvedSiteUrl,
    faviconBaseUrl,
    resolvedShareImage,
    socialLinks,
  } = getSiteMeta(site);
  const address = site?.address;
  const postalAddress =
    address?.street || address?.city || address?.postcode || address?.country
      ? cleanObject({
          "@type": "PostalAddress",
          streetAddress: address?.street,
          postalCode: address?.postcode,
          addressLocality: address?.city,
          addressCountry: address?.country,
        })
      : undefined;
  const logoUrl = faviconBaseUrl ? buildSanityImageUrl(faviconBaseUrl, 512) : undefined;

  return cleanObject({
    "@context": "https://schema.org",
    "@type": site?.businessType || fallbackSite.businessType,
    name: resolvedTitle,
    legalName: resolvedOwner,
    description: resolvedDescription,
    url: resolvedSiteUrl,
    logo: logoUrl,
    image: resolvedShareImage?.url,
    email: site?.email,
    telephone: site?.phone,
    address: postalAddress,
    sameAs: socialLinks.length > 0 ? socialLinks : undefined,
  });
};

export const dynamic = "force-dynamic";
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({ children }) {
  const site = await getResolvedSite();
  const { resolvedLocale } = getSiteMeta(site);
  const structuredData = getStructuredData(site);

  return (
    <ViewTransitions>
      <html lang={resolvedLocale}>
        <DeviceProvider>
          <ViewportProvider>
            <ScrollRestorationController />
            <body>
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
              />
              {children}
            </body>
          </ViewportProvider>
        </DeviceProvider>
      </html>
    </ViewTransitions>
  );
}
