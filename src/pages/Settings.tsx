import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, ChevronRight, Moon, Sun, Code, Mail } from 'lucide-react';
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
  DialogClose
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useTheme } from '@/components/theme/theme-provider';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase, prepareArrayField, parseArrayField } from '@/integrations/supabase/client';

const PROGRAMMING_LANGUAGES = [
  "JavaScript", "TypeScript", "Python", "Java", "C#", "C++", "C", "PHP", "Go",
  "Ruby", "Swift", "Kotlin", "Rust", "Dart", "Scala", "R", "MATLAB", "Perl",
  "Haskell", "Elixir", "Clojure", "Groovy", "Lua", "Objective-C", "Shell",
  "SQL", "PL/SQL", "Assembly", "Julia", "F#", "COBOL", "Fortran", "Ada",
  "Lisp", "Prolog", "Erlang", "Scheme", "Apex", "SAS", "Crystal", "Hack", 
  "ABAP", "Solidity", "Visual Basic", "Delphi", "Bash", "PowerShell", "VBA",
  "Elm", "OCaml", "Racket", "CoffeeScript", "Tcl", "Verilog", "VHDL", "HTML", 
  "CSS", "SCSS", "Less", "Stylus", "XML", "JSON", "YAML", "Markdown", "LaTeX",
  "ReasonML", "PureScript", "Zig", "WebAssembly", "Ballerina", "Nix", "Raku",
  "Nim", "Io", "Factor", "Q", "APL", "J", "K", "Pony", "Ur", "BlitzBasic",
  "ActionScript", "CFML", "D", "Elm", "Forth", "Haxe", "Idris", "Inform",
  "Rexx", "Xojo", "Logo", "ML", "Smalltalk", "Standard ML", "Vala",
  "Agda", "T-SQL", "Pascal", "Embedded SQL", "MongoDB Query Language", 
  "GraphQL", "React", "Angular", "Vue.js", "Next.js", "Svelte", "jQuery"
];

const PrivacyPolicyContent = () => {
  const { theme } = useTheme();
  const textColor = theme === 'dark' ? 'text-white' : 'text-foreground';
  const mutedTextColor = theme === 'dark' ? 'text-xGray-dark' : 'text-muted-foreground';
  const bgColor = theme === 'dark' ? 'bg-black' : 'bg-lightBeige';
  
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

const ProgrammingLanguageSelector = ({ 
  selectedLanguages, 
  setSelectedLanguages,
  maxSelections = 5 
}: { 
  selectedLanguages: string[];
  setSelectedLanguages: React.Dispatch<React.SetStateAction<string[]>>;
  maxSelections?: number;
}) => {
  const { theme } = useTheme();
  const textColor = theme === 'dark' ? 'text-white' : 'text-foreground';
  const mutedTextColor = theme === 'dark' ? 'text-xGray-dark' : 'text-muted-foreground';
  
  const handleLanguageChange = (language: string) => {
    setSelectedLanguages(current => {
      if (current.includes(language)) {
        return current.filter(lang => lang !== language);
      }
      
      if (current.length >= maxSelections) {
        toast.warning(`You can select up to ${maxSelections} languages. Please remove one first.`);
        return current;
      }
      
      return [...current, language];
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <span className={cn("text-sm font-medium", textColor)}>
          Select up to {maxSelections} programming languages (currently selected: {selectedLanguages.length}/{maxSelections})
        </span>
        <span className={mutedTextColor}>
          These are the programming languages you're proficient in
        </span>
      </div>
      
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {PROGRAMMING_LANGUAGES.map(language => (
            <Button
              key={language}
              variant={selectedLanguages.includes(language) ? "default" : "outline"}
              size="sm"
              onClick={() => handleLanguageChange(language)}
              className={selectedLanguages.includes(language) ? "bg-primary text-white" : ""}
            >
              {language}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

const EmailNotificationSettings = ({ emailEnabled, setEmailEnabled }: { 
  emailEnabled: boolean; 
  setEmailEnabled: (enabled: boolean) => void;
}) => {
  const { theme } = useTheme();
  const textColor = theme === 'dark' ? 'text-white' : 'text-foreground';
  const mutedTextColor = theme === 'dark' ? 'text-xGray-dark' : 'text-muted-foreground';
  const infoColor = theme === 'dark' ? 'text-blue-300' : 'text-blue-600';
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <span className={cn("text-lg font-medium", textColor)}>
          Email Notifications
        </span>
        <span className={mutedTextColor}>
          You will receive notifications by email when there are new posts about programming languages you follow
        </span>
      </div>
      
      <div className="flex items-center justify-between space-x-2 p-4 border rounded-md">
        <div className="flex-1">
          <span className={textColor}>Enable email notifications</span>
          <p className={cn("text-sm", mutedTextColor)}>
            Get email notifications when someone mentions a programming language you're following
          </p>
        </div>
        <Switch 
          checked={emailEnabled} 
          onCheckedChange={setEmailEnabled}
        />
      </div>
      
      <div className={cn("p-2 bg-blue-100 dark:bg-blue-900 rounded-md", infoColor)}>
        <span className="text-sm">
          Email notifications use the email you signed up with. This helps you stay updated on discussions about your selected programming languages.
        </span>
      </div>
    </div>
  );
};

const Settings = () => {
  const { user } = useAuth();
  const [openPrivacyDialog, setOpenPrivacyDialog] = useState(false);
  const { theme, setTheme } = useTheme();
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [openLanguagesDialog, setOpenLanguagesDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [openEmailDialog, setOpenEmailDialog] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);
  
  useEffect(() => {
    if (user) {
      const fetchUserProfile = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('programming_languages, email_notifications_enabled')
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }
        
        if (data) {
          if (data.programming_languages) {
            setSelectedLanguages(Array.isArray(data.programming_languages) ? data.programming_languages : []);
          }
          setEmailEnabled(data.email_notifications_enabled || false);
        }
      };
      
      fetchUserProfile();
    }
  }, [user]);
  
  const handlePrivacyClick = () => {
    setOpenPrivacyDialog(true);
  };

  const handleLanguagesClick = () => {
    setOpenLanguagesDialog(true);
  };

  const handleEmailNotificationsClick = () => {
    setOpenEmailDialog(true);
  };
  
  const saveLanguagesToProfile = async () => {
    if (!user) return;
    
    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ programming_languages: selectedLanguages })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      toast.success('Programming languages updated successfully');
      setOpenLanguagesDialog(false);
    } catch (error) {
      console.error('Error updating programming languages:', error);
      toast.error('Failed to update programming languages');
    } finally {
      setIsSaving(false);
    }
  };

  const saveEmailSettings = async () => {
    if (!user) return;
    
    setIsSaving(true);
    
    try {
      console.log(`Updating email notifications to: ${emailEnabled}`);
      
      const { error } = await supabase
        .from('profiles')
        .update({ email_notifications_enabled: emailEnabled })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      toast.success('Email notification settings updated successfully');
      setOpenEmailDialog(false);
    } catch (error) {
      console.error('Error updating email settings:', error);
      toast.error('Failed to update email notification settings');
    } finally {
      setIsSaving(false);
    }
  };

  const textColor = theme === 'dark' ? 'text-white' : 'text-foreground';
  const mutedTextColor = theme === 'dark' ? 'text-xGray-dark' : 'text-muted-foreground';
  const headerBg = theme === 'dark' ? 'bg-black/80' : 'bg-lightBeige/80';
  const borderColor = theme === 'dark' ? 'bg-xBorder' : 'bg-border';
  const iconColor = theme === 'dark' ? 'text-white' : 'text-primary';
  const bgColor = theme === 'dark' ? 'bg-black' : 'bg-lightBeige';
  const dialogBg = theme === 'dark' ? 'bg-black' : 'bg-background';
  const dialogBorder = theme === 'dark' ? 'border-xBorder' : 'border-border';

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
              icon={Code}
              title="Programming Languages"
              description="Select programming languages you're proficient in"
              onClick={handleLanguagesClick}
            />

            <SettingsItem 
              icon={Mail}
              title="Email Notifications"
              description="Manage email notifications for programming languages"
              onClick={handleEmailNotificationsClick}
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
      
      <Dialog open={openLanguagesDialog} onOpenChange={setOpenLanguagesDialog}>
        <DialogContent className={cn(dialogBg, dialogBorder, textColor, "max-w-4xl max-h-[90vh]")}>
          <DialogHeader>
            <DialogTitle>Programming Languages</DialogTitle>
            <DialogDescription className={mutedTextColor}>
              Select programming languages you're proficient in
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <ProgrammingLanguageSelector 
              selectedLanguages={selectedLanguages}
              setSelectedLanguages={setSelectedLanguages}
              maxSelections={5}
            />
          </ScrollArea>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setOpenLanguagesDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveLanguagesToProfile} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openEmailDialog} onOpenChange={setOpenEmailDialog}>
        <DialogContent className={cn(dialogBg, dialogBorder, textColor, "max-w-4xl max-h-[90vh]")}>
          <DialogHeader>
            <DialogTitle>Email Notifications</DialogTitle>
            <DialogDescription className={mutedTextColor}>
              Manage email notification settings
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[40vh] pr-4">
            <EmailNotificationSettings 
              emailEnabled={emailEnabled}
              setEmailEnabled={setEmailEnabled}
            />
          </ScrollArea>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setOpenEmailDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveEmailSettings} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Settings;
