
import React, { useState } from 'react';
import { SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme/theme-provider';
import FILTER_CATEGORIES from '../../lib/fieldCategories';

interface FilterDialogProps {
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
}

const FilterDialog = ({ selectedCategories, setSelectedCategories }: FilterDialogProps) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const { theme } = useTheme();

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    });
  };

  // Determine the text color based on theme
  const textColor = theme === 'dark' ? 'text-white' : 'text-black';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          className={`${textColor} flex items-center p-0 hover:bg-transparent`}
        >
          <SlidersHorizontal className="w-5 h-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn(
        "w-80 border text-white p-2",
        theme === 'dark' ? 'bg-black border-neutral-800' : 'bg-white border-gray-200 text-black'
      )}>
        <div className="flex flex-col gap-1.5">
          <div className={cn(
            "text-sm pb-2 border-b",
            theme === 'dark' ? 'text-neutral-400 border-neutral-800' : 'text-gray-600 border-gray-200'
          )}>
            Select categories to filter posts
          </div>
          
          <div className="py-2 flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
            {Object.entries(FILTER_CATEGORIES).map(([section, categories]) => (
              <div key={section} className="mb-2">
                <div 
                  className={cn(
                    "flex justify-between items-center px-3 py-2 rounded-md cursor-pointer",
                    theme === 'dark' ? 'bg-neutral-900' : 'bg-gray-100'
                  )}
                  onClick={() => toggleSection(section)}
                >
                  <span className="font-medium text-sm">{section}</span>
                  {expandedSections[section] ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
                
                {expandedSections[section] && (
                  <div className="mt-1 ml-2 flex flex-col gap-1">
                    {categories.map((category) => (
                      <div 
                        key={category}
                        onClick={() => toggleCategory(category)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors",
                          theme === 'dark' 
                            ? (selectedCategories.includes(category) ? 'bg-neutral-800' : 'hover:bg-neutral-800') 
                            : (selectedCategories.includes(category) ? 'bg-gray-200' : 'hover:bg-gray-100')
                        )}
                      >
                        <div 
                          className={cn(
                            "w-4 h-4 rounded-sm border",
                            selectedCategories.includes(category) 
                              ? "bg-blue-500 border-blue-500" 
                              : theme === 'dark' ? "border-neutral-500" : "border-gray-400"
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
                )}
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default FilterDialog;
