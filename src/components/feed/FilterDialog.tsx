
import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FilterDialogProps {
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
}

const FILTER_CATEGORIES = [
  "Software Engineering",
  "Prompt Engineering",
  "Tech Sales",
  "IT",
  "Gamer",
  "Youtuber",
  "Book Readers",
  "News",
  "Journalism",
  "Youth Adult"
];

const FilterDialog = ({ selectedCategories, setSelectedCategories }: FilterDialogProps) => {
  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          className="text-white flex items-center gap-2 text-lg font-medium p-0 hover:bg-transparent"
        >
          <span className="text-lg font-medium">Filter</span>
          <SlidersHorizontal className="w-5 h-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 bg-black border border-neutral-800 text-white p-2">
        <div className="flex flex-col gap-1.5">
          <div className="text-sm text-neutral-400 pb-2 border-b border-neutral-800">
            Select categories to filter posts
          </div>
          
          <div className="py-2 flex flex-col gap-2 max-h-60 overflow-y-auto">
            {FILTER_CATEGORIES.map((category) => (
              <div 
                key={category}
                onClick={() => toggleCategory(category)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer hover:bg-neutral-800 transition-colors",
                  selectedCategories.includes(category) && "bg-neutral-800"
                )}
              >
                <div 
                  className={cn(
                    "w-4 h-4 rounded-sm border border-neutral-500",
                    selectedCategories.includes(category) && "bg-blue-500 border-blue-500"
                  )}
                >
                  {selectedCategories.includes(category) && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </div>
                <span className="text-sm">{category}</span>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default FilterDialog;
