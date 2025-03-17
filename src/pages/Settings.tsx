import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, ChevronRight, Moon, Sun, Briefcase, Tag, X } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useTheme } from '@/components/theme/theme-provider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import FILTER_CATEGORIES from '@/lib/fieldCategories';
import { supabase } from '@/integrations/supabase/client';

const PrivacyPolicyContent = () => {
  const { theme } = useTheme();
  const textColor = theme === 'dark' ? 'text-white' : 'text-foreground';
  const mutedTextColor = theme === 'dark' ? 'text-xGray-dark' : 'text-muted-foreground';

  return (
    <ScrollArea className="h-[80vh] pr-4">
      <div className={cn("space-y-4", textColor)}>
        <h1 className="text-2xl font-bold mb-4">iBlue Privacy and Safety Policy</h1>
        <p className={cn("italic", mutedTextColor)}>Last Updated: [Insert Date]</p>
        
        <p>This Privacy and Safety Policy ("Policy") explains how iBlue protects your privacy and ensures a safe environment on our social media platform. iBlue is designed to help workers from various companies and roles find solutions to their challenges by allowing users to post issues anonymously and receive expert advice. By using iBlue, you agree to the practices outlined in this Policy.</p>
        
        <h2 className="text-xl font-semibold mt-6 mb-2">1. Overview</h2>
        <p>iBlue is committed to protecting your personal information and preserving your anonymity while promoting a collaborative problem-solving community. This Policy describes:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>What information we collect and how it is used.</li>
          <li>The measures in place to protect your identity.</li>
          <li>Our community safety standards and content guidelines.</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-6 mb-2">2. Anonymity and Profile Management</h2>
        <h3 className="text-lg font-medium mt-4 mb-1">2.1. User Anonymity</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Pseudonymous Identity:</strong> Every user on iBlue is assigned a system-generated username and profile picture. These elements are created by the app to ensure that your real name, photo, or any identifying details remain private.</li>
          <li><strong>No Custom Profiles:</strong> To maintain uniform anonymity, users are not permitted to upload personal profile pictures or customize usernames. This design choice minimizes the risk of linking online posts to real-world identities.</li>
        </ul>
        
        <h3 className="text-lg font-medium mt-4 mb-1">2.2. Data Minimization</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Limited Personal Data Collection:</strong> We collect only the information necessary to operate and improve iBlue. Personal data beyond your anonymized credentials (e.g., contact details or workplace affiliation) is not required unless explicitly agreed upon by you.</li>
          <li><strong>Anonymous Interaction:</strong> All posts, responses, and interactions are published under your assigned pseudonym and profile picture, ensuring that your personal identity remains confidential.</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-6 mb-2">3. Data Collection and Usage</h2>
        <h3 className="text-lg font-medium mt-4 mb-1">3.1. Information We Collect</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Account Credentials:</strong> We record your system-generated username and profile picture. No personally identifiable information (PII), such as your real name or image, is associated with your public profile.</li>
          <li><strong>User-Generated Content:</strong> Any posts, comments, or interactions you make on the platform are stored to facilitate community engagement and to improve our service.</li>
        </ul>
        
        <h3 className="text-lg font-medium mt-4 mb-1">3.2. How We Use Your Information</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Platform Functionality:</strong> Your anonymized account details enable you to post questions, provide answers, and interact with others without compromising your identity.</li>
          <li><strong>Improvement and Analytics:</strong> We analyze usage patterns and interactions to enhance platform performance and user experience while strictly maintaining user anonymity.</li>
          <li><strong>Safety and Security:</strong> Data is used to monitor for and address any behavior that could compromise the safety or integrity of the community.</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-6 mb-2">4. Safety Standards and Community Guidelines</h2>
        <h3 className="text-lg font-medium mt-4 mb-1">4.1. Content Guidelines</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Respect and Constructive Engagement:</strong> All users are expected to post content that is respectful, professional, and aimed at providing practical solutions. Abusive, harassing, or harmful content is prohibited.</li>
          <li><strong>Anonymity Respect:</strong> Do not attempt to disclose or request personal identifying information from other users. Posts that try to reveal someone's real identity will be subject to removal and may result in account suspension.</li>
        </ul>
        
        <h3 className="text-lg font-medium mt-4 mb-1">4.2. Moderation and Reporting</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Proactive Moderation:</strong> Our moderation team continuously reviews content to ensure compliance with our safety guidelines. Inappropriate content will be removed promptly.</li>
          <li><strong>User Reporting:</strong> If you encounter content or behavior that violates this Policy, please use our reporting feature. Reports are reviewed and acted upon in a timely manner.</li>
          <li><strong>Enforcement:</strong> Repeated violations of these guidelines may result in temporary or permanent suspension of your account.</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-6 mb-2">5. Security Measures</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Data Protection:</strong> We use industry-standard security measures to protect your anonymized data from unauthorized access, disclosure, alteration, or destruction.</li>
          <li><strong>Regular Audits:</strong> Our systems are periodically reviewed and updated to address new security challenges and to maintain the integrity of the platform.</li>
          <li><strong>Incident Response:</strong> In the unlikely event of a security breach, we will take immediate steps to secure the system and notify affected users if any anonymized data is compromised.</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-6 mb-2">6. Third-Party Services</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Limited Sharing:</strong> iBlue does not share your anonymized account data with third parties except where necessary to maintain platform functionality or as required by law.</li>
          <li><strong>Service Providers:</strong> Any third-party services used by iBlue adhere to strict privacy and security standards to ensure that your anonymity is maintained.</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-6 mb-2">7. Changes to This Policy</h2>
        <p>We may update this Policy from time to time to reflect changes in our practices or legal requirements. Any modifications will be posted on our platform with an updated effective date. Continued use of iBlue after such changes constitutes your acceptance of the revised Policy.</p>
        
        <h2 className="text-xl font-semibold mt-6 mb-2">8. Contact Information</h2>
        <p>If you have any questions or concerns about this Privacy and Safety Policy, please contact our support team at [Insert Contact Email/Support Link].</p>
        
        <p className="mt-6">By using iBlue, you acknowledge that you have read, understood, and agree to be bound by this Privacy and Safety Policy. Your safety and privacy are our top priorities, and we remain committed to providing a secure, anonymous, and helpful community for solving work-related challenges.</p>
      </div>
    </ScrollArea>
  );
};

const SettingsItem = ({ icon: Icon, title, description, onClick }: {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
}) => {
  const { theme } = useTheme();
  const textColor = theme === 'dark' ? 'text-white' : 'text-foreground';
  const mutedTextColor = theme === 'dark' ? 'text-xGray-dark' : 'text-muted-foreground';
  const hoverBg = theme === 'dark' ? 'hover:bg-xSecondary' : 'hover:bg-secondary/50';
  const iconColor = theme === 'dark' ? 'text-white' : 'text-primary';
  const separatorColor = theme === 'dark' ? 'bg-xBorder' : 'bg-border';
  
  return (
    <div onClick={onClick} className="w-full cursor-pointer">
      <div className={cn("flex items-center justify-between p-4", hoverBg, "transition-colors")}>
        <div className="flex items-start gap-3">
          <div className="p-2">
            <Icon className={cn("h-6 w-6", iconColor)} />
          </div>
          <div className="flex flex-col text-left">
            <span className={cn("font-medium text-lg", textColor)}>{title}</span>
            <span className={mutedTextColor}>{description}</span>
          </div>
        </div>
        <ChevronRight className={cn("h-5 w-5", mutedTextColor)} />
      </div>
      <Separator className={separatorColor} />
    </div>
  );
};

const Settings = () => {
  const { user } = useAuth();
  const [openPrivacyDialog, setOpenPrivacyDialog] = useState(false);
  const [openFieldsDialog, setOpenFieldsDialog] = useState(false);
  const [openCompaniesDialog, setOpenCompaniesDialog] = useState(false);
  const { theme, setTheme } = useTheme();
  
  const [fields, setFields] = useState<string[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [selectedField, setSelectedField] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  const allFields = Object.values(FILTER_CATEGORIES).flat();
  
  const popularCompanies = [
    "Google", "Microsoft", "Apple", "Amazon", "Meta", "IBM", "Intel", "Oracle", 
    "Cisco", "Adobe", "Salesforce", "Twitter", "Netflix", "Shopify", "Uber", 
    "Airbnb", "Tesla", "SpaceX", "PayPal", "LinkedIn", "Dropbox", "Slack", 
    "Zoom", "Stripe", "Square", "Samsung", "Sony", "Nintendo", "Nvidia", "AMD",
    "Dell", "HP", "Lenovo", "Asus", "LG", "Huawei", "Xiaomi", "Tencent",
    "Alibaba", "Baidu", "ByteDance", "TikTok", "Spotify", "Twitch", "Reddit",
    "Pinterest", "Snapchat", "Instagram", "WhatsApp", "Telegram", "Signal",
    "Discord", "Robinhood", "Coinbase", "Binance", "JPMorgan Chase", "Goldman Sachs",
    "Morgan Stanley", "Bank of America", "Wells Fargo", "Citigroup", "Deloitte",
    "PwC", "EY", "KPMG", "McKinsey", "Boston Consulting Group", "Bain & Company",
    "Accenture", "Capgemini", "Infosys", "Wipro", "TCS", "Cognizant", "HCL",
    "Palantir", "Snowflake", "MongoDB", "Cloudflare", "Datadog", "Splunk",
    "Atlassian", "Zendesk", "ServiceNow", "Workday", "SAP", "Siemens", "GE",
    "Boeing", "Lockheed Martin", "Northrop Grumman", "Raytheon", "Ford", "GM",
    "Toyota", "Volkswagen", "BMW", "Mercedes-Benz", "Disney", "Warner Bros",
    "Universal", "Pixar", "DreamWorks", "Other", "None (Not working yet)"
  ];

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('field, company')
            .eq('user_id', user.id)
            .single();
          
          if (error) throw error;
          
          if (data) {
            if (data.field) {
              const fieldArray = Array.isArray(data.field) 
                ? data.field.slice(0, 3) 
                : typeof data.field === 'string' 
                  ? [data.field] 
                  : [];
              setFields(fieldArray);
            }
            
            if (data.company) {
              const companyArray = Array.isArray(data.company) 
                ? data.company.slice(0, 3) 
                : typeof data.company === 'string'
                  ? [data.company] 
                  : [];
              setCompanies(companyArray);
            }
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };
    
    fetchUserProfile();
  }, [user]);

  const handlePrivacyClick = () => {
    setOpenPrivacyDialog(true);
  };

  const handleFieldsClick = () => {
    setOpenFieldsDialog(true);
  };

  const handleCompaniesClick = () => {
    setOpenCompaniesDialog(true);
  };

  const handleAddField = () => {
    if (!selectedField || fields.length >= 3 || fields.includes(selectedField)) {
      return;
    }
    
    const newFields = [...fields, selectedField];
    setFields(newFields);
    setSelectedField('');
  };

  const handleRemoveField = (field: string) => {
    setFields(fields.filter(f => f !== field));
  };

  const handleAddCompany = () => {
    if (!selectedCompany || companies.length >= 3 || companies.includes(selectedCompany)) {
      return;
    }
    
    const newCompanies = [...companies, selectedCompany];
    setCompanies(newCompanies);
    setSelectedCompany('');
  };

  const handleRemoveCompany = (company: string) => {
    setCompanies(companies.filter(c => c !== company));
  };

  const saveFieldsToProfile = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ field: fields })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      toast.success('Fields updated successfully');
      setOpenFieldsDialog(false);
    } catch (error) {
      console.error('Error updating fields:', error);
      toast.error('Failed to update fields');
    } finally {
      setIsLoading(false);
    }
  };

  const saveCompaniesToProfile = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ company: companies })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      toast.success('Companies updated successfully');
      setOpenCompaniesDialog(false);
    } catch (error) {
      console.error('Error updating companies:', error);
      toast.error('Failed to update companies');
    } finally {
      setIsLoading(false);
    }
  };

  const textColor = theme === 'dark' ? 'text-white' : 'text-foreground';
  const mutedTextColor = theme === 'dark' ? 'text-xGray-dark' : 'text-muted-foreground';
  const headerBg = theme === 'dark' ? 'bg-black/80' : 'bg-lightBeige/80';
  const borderColor = theme === 'dark' ? 'bg-xBorder' : 'bg-border';
  const iconColor = theme === 'dark' ? 'text-white' : 'text-primary';
  const bgColor = theme === 'dark' ? 'bg-black' : 'bg-lightBeige';
  const inputBg = theme === 'dark' ? 'bg-gray-100' : 'bg-white';
  const dialogBg = theme === 'dark' ? 'bg-black' : 'bg-background';
  const dialogBorder = theme === 'dark' ? 'border-xBorder' : 'border-border';
  const pillBg = theme === 'dark' ? 'bg-xSecondary' : 'bg-secondary';

  return (
    <AppLayout>
      <div className={bgColor + " min-h-screen"}>
        <div className="max-w-3xl mx-auto">
          <header className={cn("sticky top-0 z-10", headerBg, "backdrop-blur-md")}>
            <div className="p-4 flex items-center gap-6">
              <Link to="/" className={textColor}>
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className={cn("text-xl font-bold", textColor)}>Settings</h1>
            </div>
            <Separator className={borderColor} />
          </header>

          <Card className={cn(
            "rounded-none bg-transparent border-none",
            "divide-y", borderColor
          )}>
            <SettingsItem 
              icon={Shield}
              title="Privacy and safety"
              description="Manage what information you see and share on iblue"
              onClick={handlePrivacyClick}
            />
            
            <SettingsItem 
              icon={Tag}
              title="Fields of Interest"
              description="Manage fields you're interested in (up to 3)"
              onClick={handleFieldsClick}
            />
            
            <SettingsItem 
              icon={Briefcase}
              title="Companies"
              description="Manage companies you're interested in (up to 3)"
              onClick={handleCompaniesClick}
            />
            
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2">
                  <Sun className={cn("h-6 w-6", iconColor)} />
                </div>
                <div className="flex flex-col text-left">
                  <span className={cn("font-medium text-lg", textColor)}>Theme</span>
                  <span className={mutedTextColor}>Manage your display preferences</span>
                  <div className="mt-3">
                    <ToggleGroup type="single" value={theme} onValueChange={(value) => value && setTheme(value as "light" | "dark")}>
                      <ToggleGroupItem value="light" aria-label="Light mode" className={theme === 'light' ? 'bg-primary text-white' : ''}>
                        <Sun className="h-4 w-4" />
                        <span className="ml-2">Light</span>
                      </ToggleGroupItem>
                      <ToggleGroupItem value="dark" aria-label="Dark mode" className={theme === 'dark' ? 'bg-primary text-white' : ''}>
                        <Moon className="h-4 w-4" />
                        <span className="ml-2">Dark</span>
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                </div>
              </div>
            </div>
            
            <Separator className={borderColor} />
          </Card>
        </div>
      </div>

      <Dialog open={openPrivacyDialog} onOpenChange={setOpenPrivacyDialog}>
        <DialogContent className={cn(dialogBg, dialogBorder, textColor, "max-w-4xl max-h-[90vh]")}>
          <DialogHeader>
            <DialogTitle>Privacy and Safety Policy</DialogTitle>
            <DialogDescription className={mutedTextColor}>
              iBlue's privacy and safety guidelines
            </DialogDescription>
          </DialogHeader>
          <PrivacyPolicyContent />
        </DialogContent>
      </Dialog>

      <Dialog open={openFieldsDialog} onOpenChange={setOpenFieldsDialog}>
        <DialogContent className={cn(dialogBg, dialogBorder, textColor, "max-w-md")}>
          <DialogHeader>
            <DialogTitle>Fields of Interest</DialogTitle>
            <DialogDescription className={mutedTextColor}>
              Select up to 3 fields that interest you. You'll see more content from these areas.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {fields.map((field) => (
                <div 
                  key={field} 
                  className={cn(pillBg, "flex items-center gap-2 px-3 py-1 rounded-full")}
                >
                  <span>{field}</span>
                  <button 
                    onClick={() => handleRemoveField(field)}
                    className="text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            
            {fields.length < 3 && (
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label htmlFor="field-select" className="mb-2 block">
                    Add a field
                  </Label>
                  <Select value={selectedField} onValueChange={setSelectedField}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a field" />
                    </SelectTrigger>
                    <SelectContent>
                      {allFields.map((field) => (
                        <SelectItem 
                          key={field} 
                          value={field}
                          disabled={fields.includes(field)}
                        >
                          {field}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleAddField} 
                  disabled={!selectedField || fields.includes(selectedField)}
                >
                  Add
                </Button>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setOpenFieldsDialog(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={saveFieldsToProfile} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openCompaniesDialog} onOpenChange={setOpenCompaniesDialog}>
        <DialogContent className={cn(dialogBg, dialogBorder, textColor, "max-w-md")}>
          <DialogHeader>
            <DialogTitle>Companies</DialogTitle>
            <DialogDescription className={mutedTextColor}>
              Select up to 3 companies you're interested in. This is optional.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {companies.map((company) => (
                <div 
                  key={company} 
                  className={cn(pillBg, "flex items-center gap-2 px-3 py-1 rounded-full")}
                >
                  <span>{company}</span>
                  <button 
                    onClick={() => handleRemoveCompany(company)}
                    className="text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            
            {companies.length < 3 && (
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label htmlFor="company-select" className="mb-2 block">
                    Add a company
                  </Label>
                  <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a company" />
                    </SelectTrigger>
                    <SelectContent>
                      {popularCompanies.map((company) => (
                        <SelectItem 
                          key={company} 
                          value={company}
                          disabled={companies.includes(company)}
                        >
                          {company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleAddCompany} 
                  disabled={!selectedCompany || companies.includes(selectedCompany)}
                >
                  Add
                </Button>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setOpenCompaniesDialog(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={saveCompaniesToProfile} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Settings;
