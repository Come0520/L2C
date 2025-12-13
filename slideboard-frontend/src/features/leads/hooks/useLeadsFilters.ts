'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

import { LeadItem } from '@/shared/types/lead';
import { debounce } from '@/utils/debounce-throttle';

export type LeadFiltersState = {
  searchTerm: string;
  status: string;
  tag: string;
  level: string;
  source: string;
  owner: string;
  dateStart: string;
  dateEnd: string;
  page: number;
  pageSize: number;
};

const DEFAULT_FILTERS: LeadFiltersState = {
  searchTerm: '',
  status: '',
  tag: '',
  level: '',
  source: '',
  owner: '',
  dateStart: '',
  dateEnd: '',
  page: 1,
  pageSize: 20,
};

export function useLeadsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Parse filters from URL search params
  const filters = useMemo((): LeadFiltersState => {
    return {
      searchTerm: searchParams.get('q') || DEFAULT_FILTERS.searchTerm,
      status: searchParams.get('status') || DEFAULT_FILTERS.status,
      tag: searchParams.get('tag') || DEFAULT_FILTERS.tag,
      level: searchParams.get('level') || DEFAULT_FILTERS.level,
      source: searchParams.get('source') || DEFAULT_FILTERS.source,
      owner: searchParams.get('owner') || DEFAULT_FILTERS.owner,
      dateStart: searchParams.get('start') || DEFAULT_FILTERS.dateStart,
      dateEnd: searchParams.get('end') || DEFAULT_FILTERS.dateEnd,
      page: Number(searchParams.get('page')) || DEFAULT_FILTERS.page,
      pageSize: Number(searchParams.get('size')) || DEFAULT_FILTERS.pageSize,
    };
  }, [searchParams]);

  // Update URL with new filters
  const updateFilters = useCallback(
    (newFilters: Partial<LeadFiltersState>) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));

      // Reset page to 1 when filter changes (except pagination)
      if (!newFilters.page && !newFilters.pageSize) {
        current.set('page', '1');
      }

      if (newFilters.searchTerm !== undefined) {
        if (newFilters.searchTerm) current.set('q', newFilters.searchTerm);
        else current.delete('q');
      }
      if (newFilters.status !== undefined) {
        if (newFilters.status) current.set('status', newFilters.status);
        else current.delete('status');
      }
      if (newFilters.tag !== undefined) {
        if (newFilters.tag) current.set('tag', newFilters.tag);
        else current.delete('tag');
      }
      if (newFilters.level !== undefined) {
        if (newFilters.level) current.set('level', newFilters.level);
        else current.delete('level');
      }
      if (newFilters.source !== undefined) {
        if (newFilters.source) current.set('source', newFilters.source);
        else current.delete('source');
      }
      if (newFilters.owner !== undefined) {
        if (newFilters.owner) current.set('owner', newFilters.owner);
        else current.delete('owner');
      }
      if (newFilters.dateStart !== undefined) {
        if (newFilters.dateStart) current.set('start', newFilters.dateStart);
        else current.delete('start');
      }
      if (newFilters.dateEnd !== undefined) {
        if (newFilters.dateEnd) current.set('end', newFilters.dateEnd);
        else current.delete('end');
      }
      if (newFilters.page !== undefined) {
        current.set('page', newFilters.page.toString());
      }
      if (newFilters.pageSize !== undefined) {
        current.set('size', newFilters.pageSize.toString());
      }

      const search = current.toString();
      const query = search ? `?${search}` : '';

      router.push(`${pathname}${query}`);
    },
    [pathname, router, searchParams]
  );

  // Debounced update for text inputs
  const debouncedUpdate = useMemo(
    () => debounce((newFilters: Partial<LeadFiltersState>) => {
      updateFilters(newFilters);
    }, 300),
    [updateFilters]
  );

  return {
    filters,
    updateFilters,
    debouncedUpdate,
  };
}
