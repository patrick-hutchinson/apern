export const siteQuery = `*[_type=="site"][0]{
  title,
  owner,
  siteUrl,
  locale,
  businessType,
  favicon{
    asset->{
      url
    }
  },
  shareImage{
    alt,
    asset->{
      url,
      metadata{
        dimensions{
          width,
          height
        }
      }
    }
  },
  description,
  address,
  email,
  phone,
  socials[]{
    platform,
    link
  },
}`;

export const landingPageQuery = `*[_type=="landingPage"][0]{
  sections[]{
    sectionTitle,
    sectionText,
    sectionKey
  },
}`;

export const aboutPageQuery = `*[_type=="aboutPage"][0]{
 credits
}`;
