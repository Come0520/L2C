import { describe, it, expect, beforeEach, vi } from 'vitest';

import { fetchSlideById, fetchUserSlides } from '../slides.client';

// Mock the fetch API
global.fetch = vi.fn();

describe('slides service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchSlideById', () => {
    it('should fetch a single slide successfully', async () => {
      // Arrange
      const slideId = 'slide-123';
      const mockSlide = {
        id: slideId,
        title: 'Test Slide',
        content: '<div>Test Content</div>',
        created_at: '2025-01-01T00:00:00Z',
      };
      
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ slide: mockSlide }),
      });
      
      // Act
      const result = await fetchSlideById(slideId);
      
      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/slides/${slideId}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(mockSlide);
    });

    it('should handle error when fetching slide', async () => {
      // Arrange
      const slideId = 'slide-123';
      
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({ error: 'Slide not found' }),
      });
      
      // Act & Assert
      await expect(fetchSlideById(slideId)).rejects.toThrow('Slide not found');
    });
  });

  describe('fetchUserSlides', () => {
    it('should fetch user slides successfully', async () => {
      // Arrange
      const mockSlides = [
        {
          id: 'slide-1',
          title: 'Slide 1',
          created_at: '2025-01-01T00:00:00Z',
        },
        {
          id: 'slide-2',
          title: 'Slide 2',
          created_at: '2025-01-02T00:00:00Z',
        },
      ];
      
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ slides: mockSlides }),
      });
      
      // Act
      const result = await fetchUserSlides();
      
      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/slides',
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(mockSlides);
    });

    it('should handle error when fetching user slides', async () => {
      // Arrange
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({ error: 'Failed to fetch slides' }),
      });
      
      // Act & Assert
      await expect(fetchUserSlides()).rejects.toThrow('Failed to fetch slides');
    });

    it('should return empty array when no slides available', async () => {
      // Arrange
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      });
      
      // Act
      const result = await fetchUserSlides();
      
      // Assert
      expect(result).toEqual([]);
    });
  });
});
