'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';

interface MetadataState {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
}

interface MetadataContextType {
  metadata: MetadataState;
  setMetadata: (metadata: MetadataState) => void;
  resetMetadata: () => void;
}

const defaultMetadata: MetadataState = {
  title: 'Micro-SaaS Signal Engine',
  description: 'Discover highly profitable, boring B2B micro-SaaS opportunities in legacy industries.',
  keywords: ['micro-saas', 'b2b saas', 'saas ideas', 'startup ideas'],
};

const MetadataContext = createContext<MetadataContextType | undefined>(undefined);

export function MetadataProvider({ children }: { children: ReactNode }) {
  const [metadata, setMetadata] = useState<MetadataState>(defaultMetadata);

  useEffect(() => {
    // Update document title
    if (metadata.title) {
      document.title = metadata.title === defaultMetadata.title 
        ? metadata.title 
        : `${metadata.title} | Micro-SaaS Signal Engine`;
    }

    // Update meta description
    if (metadata.description) {
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', metadata.description);
      } else {
        const newMeta = document.createElement('meta');
        newMeta.name = 'description';
        newMeta.content = metadata.description;
        document.head.appendChild(newMeta);
      }

      // Also update OG description
      const ogDescription = document.querySelector('meta[property="og:description"]');
      if (ogDescription) ogDescription.setAttribute('content', metadata.description);
    }

    // Update OG title
    if (metadata.title) {
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', metadata.title);
    }

    // Update image if provided
    if (metadata.image) {
      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage) ogImage.setAttribute('content', metadata.image);
      const twitterImage = document.querySelector('meta[name="twitter:image"]');
      if (twitterImage) twitterImage.setAttribute('content', metadata.image);
    }
  }, [metadata]);
  
  const resetMetadata = useCallback(() => {
    setMetadata(defaultMetadata);
  }, []);

  const value = useMemo(() => ({
    metadata,
    setMetadata,
    resetMetadata
  }), [metadata, resetMetadata]);

  return (
    <MetadataContext.Provider value={value}>
      {children}
    </MetadataContext.Provider>
  );
}

export function useMetadata() {
  const context = useContext(MetadataContext);
  if (context === undefined) {
    throw new Error('useMetadata must be used within a MetadataProvider');
  }
  return context;
}
