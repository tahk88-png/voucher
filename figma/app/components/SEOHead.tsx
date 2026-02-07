import { useEffect } from 'react';
import { useLocation } from 'react-router';

export interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  keywords?: string[];
  noIndex?: boolean;
  jsonLd?: Record<string, any>;
}

const DEFAULT_SEO: SEOProps = {
  title: 'GiftHub - Euroopa SaaS Vautšeri ja Soovituste Platvorm',
  description: 'Jaga, teeni ja lunasta kinkekaarte, vautšereid ja kampaaniaid üle Euroopa. Platvorm kaupmeestele ja kasutajatele.',
  image: 'https://gifthub.eu/og-image.png',
  type: 'website',
  keywords: [
    'vautšerid',
    'kinkekaardid',
    'kampaaniad',
    'soovitused',
    'boonused',
    'allahindlused',
    'Euroopa',
    'SaaS',
    'vouchers',
    'gift cards',
    'campaigns',
    'referrals',
    'ваучеры',
    'подарочные карты',
    'кампании'
  ]
};

export function SEOHead(props: SEOProps) {
  const location = useLocation();
  
  const seo = {
    ...DEFAULT_SEO,
    ...props,
    url: props.url || `https://gifthub.eu${location.pathname}`,
  };

  useEffect(() => {
    // Update document title
    document.title = seo.title || DEFAULT_SEO.title!;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, property = false) => {
      const attribute = property ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Basic meta tags
    if (seo.description) {
      updateMetaTag('description', seo.description);
    }

    if (seo.keywords && seo.keywords.length > 0) {
      updateMetaTag('keywords', seo.keywords.join(', '));
    }

    if (seo.author) {
      updateMetaTag('author', seo.author);
    }

    // Robots
    if (seo.noIndex) {
      updateMetaTag('robots', 'noindex, nofollow');
    } else {
      updateMetaTag('robots', 'index, follow');
    }

    // Open Graph tags
    updateMetaTag('og:title', seo.title || DEFAULT_SEO.title!, true);
    updateMetaTag('og:description', seo.description || DEFAULT_SEO.description!, true);
    updateMetaTag('og:type', seo.type || 'website', true);
    updateMetaTag('og:url', seo.url!, true);
    updateMetaTag('og:site_name', 'GiftHub', true);
    updateMetaTag('og:locale', 'et_EE', true);
    updateMetaTag('og:locale:alternate', 'en_GB', true);
    updateMetaTag('og:locale:alternate', 'ru_RU', true);

    if (seo.image) {
      updateMetaTag('og:image', seo.image, true);
      updateMetaTag('og:image:width', '1200', true);
      updateMetaTag('og:image:height', '630', true);
      updateMetaTag('og:image:alt', seo.title || 'GiftHub', true);
    }

    if (seo.publishedTime) {
      updateMetaTag('article:published_time', seo.publishedTime, true);
    }

    if (seo.modifiedTime) {
      updateMetaTag('article:modified_time', seo.modifiedTime, true);
    }

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', seo.title || DEFAULT_SEO.title!);
    updateMetaTag('twitter:description', seo.description || DEFAULT_SEO.description!);
    
    if (seo.image) {
      updateMetaTag('twitter:image', seo.image);
      updateMetaTag('twitter:image:alt', seo.title || 'GiftHub');
    }

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', seo.url!);

    // Structured Data (JSON-LD)
    const updateStructuredData = () => {
      let script = document.querySelector('script[type="application/ld+json"]');
      
      if (!script) {
        script = document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        document.head.appendChild(script);
      }

      // If specific JSON-LD is provided, use it. Otherwise fall back to default Organization.
      if (seo.jsonLd) {
        script.textContent = JSON.stringify(seo.jsonLd);
        return;
      }

      const structuredData: any = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'GiftHub',
        description: DEFAULT_SEO.description,
        url: 'https://gifthub.eu',
        logo: 'https://gifthub.eu/logo.png',
        sameAs: [
          'https://facebook.com/gifthub',
          'https://twitter.com/gifthub',
          'https://linkedin.com/company/gifthub',
          'https://instagram.com/gifthub'
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'Customer Support',
          email: 'support@gifthub.eu',
          availableLanguage: ['Estonian', 'English', 'Russian']
        }
      };

      // Add page-specific structured data extensions for legacy props
      if (seo.type === 'article') {
        structuredData['@type'] = 'Article';
        structuredData.headline = seo.title;
        structuredData.description = seo.description;
        structuredData.image = seo.image;
        structuredData.datePublished = seo.publishedTime;
        structuredData.dateModified = seo.modifiedTime;
        structuredData.author = {
          '@type': 'Organization',
          name: 'GiftHub'
        };
      }

      script.textContent = JSON.stringify(structuredData);
    };

    updateStructuredData();

  }, [seo, location.pathname]);

  return null;
}
