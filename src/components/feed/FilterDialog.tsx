
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

interface FilterDialogProps {
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
}

const FILTER_CATEGORIES = {
  "Tech & Digital Careers": [
    "Software Engineering",
    "Prompt Engineering",
    "Tech Sales",
    "IT",
    "Web Development",
    "UI/UX Design",
    "Cloud Computing",
    "AI Researcher",
    "Blockchain Developer",
    "Ethical Hacking",
    "IT Support Specialist",
    "Network Engineering",
    "DevOps Engineering",
    "Mobile App Development",
  ],
  "Content Creation": [
    "Gamer",
    "Youtuber",
    "Book Readers",
    "News",
    "Journalism",
  ],
  "Business & Sales": [
    "Business Consulting",
    "Product Management",
    "Venture Capitalist",
    "Real Estate Agent",
    "E-commerce Seller",
    "Copywriting",
    "Business Coaching",
    "Affiliate Marketing",
    "Customer Success Manager",
    "Public Relations",
  ],
  "Creative Fields": [
    "Video Editing",
    "Animation",
    "Acting",
    "Voice Acting",
    "Scriptwriting",
    "Film Directing",
    "Interior Design",
    "3D Modeling",
    "Fashion Design",
    "Illustration",
  ],
  "Finance & Investing": [
    "Accounting",
    "Financial Planning",
    "Forex Trading",
    "Cryptocurrency Investing",
    "Private Equity",
    "Risk Management",
    "Insurance Brokerage",
    "Hedge Fund Management",
    "Corporate Finance",
    "Credit Analysis",
  ],
  "Health & Wellness": [
    "Personal Training",
    "Nutrition Coaching",
    "Yoga Instruction",
    "Physical Therapy",
    "Mental Health Counseling",
    "Medical Coding",
    "Sports Coaching",
    "Healthcare Administration",
    "Alternative Medicine",
    "Meditation Coaching",
  ],
  "Science & Engineering": [
    "Aerospace Engineering",
    "Biomedical Engineering",
    "Robotics",
    "Civil Engineering",
    "Mechanical Engineering",
    "Chemistry Research",
    "Physics Research",
    "Environmental Science",
    "Biotechnology",
    "Marine Biology",
  ],
  "Software Development": [
    "Frontend Developer",
    "Backend Developer",
    "Full-Stack Developer",
    "Game Developer",
    "Embedded Systems Engineer",
    "API Developer",
    "Software Architect",
    "Open Source Contributor",
    "Test Automation Engineer",
    "Low-Code/No-Code Developer",
  ],
  "AI & Machine Learning": [
    "AI Engineer",
    "Deep Learning Engineer",
    "Computer Vision Engineer",
    "NLP Engineer",
    "AI Ethics Researcher",
    "Reinforcement Learning Engineer",
    "AI Chatbot Developer",
    "Generative AI Specialist",
    "Data Annotation Specialist",
    "AI Product Manager",
  ],
  "Data Science": [
    "Data Analyst",
    "Data Engineer",
    "MLOps Engineer",
    "Business Intelligence Analyst",
    "Data Visualization Specialist",
    "Database Administrator",
    "Big Data Engineer",
    "ETL Developer",
    "Predictive Analytics Expert",
    "Data Governance Specialist",
  ],
  "Cybersecurity": [
    "Penetration Tester",
    "Security Analyst",
    "Security Engineer",
    "Cyber Threat Intelligence Analyst",
    "Network Security Engineer",
    "Cloud Security Engineer",
    "Incident Response Analyst",
    "SOC Analyst",
    "Digital Forensics Analyst",
    "Cryptography Engineer",
  ],
  "Cloud & DevOps": [
    "Cloud Architect",
    "Cloud Engineer",
    "Site Reliability Engineer",
    "DevOps Engineer",
    "Kubernetes Specialist",
    "Infrastructure as Code Engineer",
    "Serverless Computing Engineer",
    "Platform Engineer",
    "Multi-Cloud Specialist",
    "Edge Computing Engineer",
  ],
  "Blockchain & Web3": [
    "Blockchain Developer",
    "Smart Contract Developer",
    "Web3 Developer",
    "Crypto Analyst",
    "DeFi Developer",
    "NFT Developer",
    "Consensus Algorithm Engineer",
    "Layer 2 Scaling Engineer",
    "DAO Specialist",
    "Metaverse Developer",
  ],
  "Other": [
    "Youth Adult",
    "Other Interests",
  ]
};

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
          className={`${textColor} flex items-center gap-2 text-lg font-medium p-0 hover:bg-transparent`}
        >
          <span className="text-lg font-medium">Filter</span>
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
