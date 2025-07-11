'use client';

import { useState, } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CrossIcon } from '@/components/icons';
import { useDebounceCallback } from 'usehooks-ts';

interface GallerySearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function GallerySearch({ value, onChange }: GallerySearchProps) {
  const [localValue, setLocalValue] = useState(value);

  // Debounce search to avoid too many API calls
  const debouncedOnChange = useDebounceCallback(onChange, 300);

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
    debouncedOnChange(newValue);
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  return (
    <div className="relative">
      <Input
        type="text"
        placeholder="Search artifacts by title, tags..."
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        className="pr-10"
      />
      {localValue && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
        >
          <CrossIcon size={16} />
        </Button>
      )}
    </div>
  );
} 