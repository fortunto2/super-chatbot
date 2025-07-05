'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DocumentFilters } from '../page';
import type { ArtifactKind } from '@/components/artifact';

interface GalleryFiltersProps {
  filters: DocumentFilters;
  onFiltersChange: (filters: DocumentFilters) => void;
  isAuthenticated: boolean;
}

const ARTIFACT_TYPES: Array<{ value: ArtifactKind; label: string }> = [
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Videos' },
  { value: 'text', label: 'Text' },
  { value: 'sheet', label: 'Sheets' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'popular', label: 'Most Popular' },
];

export function GalleryFilters({
  filters,
  onFiltersChange,
  isAuthenticated,
}: GalleryFiltersProps) {
  const [models, setModels] = useState<string[]>([]);

  // Fetch available models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('/api/config/models');
        if (response.ok) {
          const data = await response.json();
          const allModels = [
            ...data.imageModels.map((m: any) => m.name),
            ...data.videoModels.map((m: any) => m.name),
          ];
          setModels(Array.from(new Set(allModels)));
        }
      } catch (error) {
        console.error('Failed to fetch models:', error);
      }
    };
    fetchModels();
  }, []);

  const handleReset = () => {
    onFiltersChange({
      visibility: 'all',
      sort: 'newest',
    });
  };

  // AICODE-NOTE: Filter options adapt based on authentication status
  return (
    <div className="space-y-6">
      {/* Visibility Filter */}
      <div>
        <Label>Show</Label>
        <Select
          value={filters.visibility}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, visibility: value as any })
          }
        >
          <SelectTrigger className="w-full mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {isAuthenticated && (
              <>
                <SelectItem value="all">All Artifacts</SelectItem>
                <SelectItem value="mine">My Artifacts</SelectItem>
              </>
            )}
            <SelectItem value="public">Public Artifacts</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Type Filter */}
      <div>
        <Label>Type</Label>
        <div className="space-y-2 mt-2">
          {ARTIFACT_TYPES.map((type) => (
            <label key={type.value} className="flex items-center gap-2">
              <input
                type="checkbox"
                className="rounded"
                checked={filters.kind === type.value}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    kind: e.target.checked ? type.value : undefined,
                  })
                }
              />
              <span className="text-sm">{type.label}</span>
            </label>
          ))}
        </div>
      </div>

      <Separator />

      {/* Model Filter */}
      {models.length > 0 && (
        <>
          <div>
            <Label>Model</Label>
            <Select
              value={filters.model || ''}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  model: value || undefined,
                })
              }
            >
              <SelectTrigger className="w-full mt-2">
                <SelectValue placeholder="All models" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All models</SelectItem>
                {models.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Separator />
        </>
      )}

      {/* Sort */}
      <div>
        <Label>Sort By</Label>
        <Select
          value={filters.sort}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, sort: value as any })
          }
        >
          <SelectTrigger className="w-full mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Reset Button */}
      <Button
        variant="outline"
        className="w-full"
        onClick={handleReset}
      >
        Clear Filters
      </Button>
    </div>
  );
} 