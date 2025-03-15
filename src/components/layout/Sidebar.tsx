
import * as React from "react"
import {
  Home,
  Search,
  Bell,
  Bookmark,
  User,
  Settings,
  LayoutDashboard,
  Calendar,
  HelpCircle,
  LogOut,
} from "lucide-react"
import { Link } from "react-router-dom"

import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent } from "@/components/ui/sheet"

const SidebarLinks = [
  {
    label: "Home",
    href: "/",
    icon: Home,
  },
  {
    label: "Explore",
    href: "/explore",
    icon: Search,
  },
  {
    label: "Notifications",
    href: "/notifications",
    icon: Bell,
  },
  {
    label: "Bookmarks",
    href: "/bookmarks",
    icon: Bookmark,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: User,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
]

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Sidebar = ({ className, ...props }: SidebarProps) => {
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)

  const handleSignOut = async (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    try {
      await signOut()
      toast({
        title: "Success",
        description: "Signed out successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-full sm:w-64">
          <div className="flex flex-col gap-4">
            <Link to="/" className="flex items-center space-x-2">
              <Avatar>
                <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || "Avatar"} />
                <AvatarFallback>
                  {user?.displayName?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-semibold">{user?.displayName || "User"}</span>
                <span className="text-sm text-muted-foreground">{user?.email}</span>
              </div>
            </Link>
            <Separator />
            <nav className="flex flex-col space-y-1">
              {SidebarLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="flex items-center space-x-2 px-4 py-2 rounded-md hover:bg-secondary"
                >
                  <link.icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>
            <Separator />
            <Button variant="outline" onClick={(e) => handleSignOut(e as any)}>
              Sign Out
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div
      className={cn(
        "hidden border-r bg-secondary/50 flex-col p-3 md:flex",
        className
      )}
      {...props}
    >
      <Link to="/" className="flex items-center space-x-2">
        <Avatar>
          <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || "Avatar"} />
          <AvatarFallback>
            {user?.displayName?.charAt(0).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-semibold">{user?.displayName || "User"}</span>
          <span className="text-sm text-muted-foreground">{user?.email}</span>
        </div>
      </Link>
      <Separator className="my-2" />
      <nav className="flex flex-col space-y-1">
        {SidebarLinks.map((link) => (
          <Link
            key={link.href}
            to={link.href}
            className="flex items-center space-x-2 px-4 py-2 rounded-md hover:bg-secondary"
          >
            <link.icon className="h-4 w-4" />
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>
      <Separator className="my-2" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">My Account</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-60" align="end" forceMount>
          <DropdownMenuItem>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Calendar className="mr-2 h-4 w-4" />
            <span>Calendar</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>Support</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={(e) => handleSignOut(e as any)}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
