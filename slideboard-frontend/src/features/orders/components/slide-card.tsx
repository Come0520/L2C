'use client';

import { SlideCard as SharedSlideCard } from '@/components/shared/slide-card';

interface Slide {
  id: string
  title: string
  description: string
  thumbnail_url: string
  updated_at: string
  is_public: boolean
}

interface SlideCardProps {
  slide: Slide;
  onDelete?: (slideId: string) => void;
}

export function SlideCard({ slide, onDelete }: SlideCardProps) {
  return (
    <SharedSlideCard 
      slide={slide} 
      onDelete={onDelete} 
    />
  );
}
