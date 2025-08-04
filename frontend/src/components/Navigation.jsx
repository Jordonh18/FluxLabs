import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { 
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger
} from './ui/menubar'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { 
  FlaskConical,
  Plus,
  User,
  LogOut,
  Settings,
  Home,
  Moon,
  Sun,
  Monitor
} from 'lucide-react'
import { useTheme } from './ThemeProvider'

export function Navigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, setTheme } = useTheme()
  
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const getUserInfo = () => {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : { username: 'User', email: '' }
  }

  const userInfo = getUserInfo()

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-4">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <img 
              src="/logo-with-text-light.svg" 
              alt="FluxLabs" 
              className="h-8 dark:hidden"
            />
            <img 
              src="/logo-with-text-dark.svg" 
              alt="FluxLabs" 
              className="h-8 hidden dark:block"
            />
          </Link>
        </div>

        <Menubar className="ml-8">
          <MenubarMenu>
            <MenubarTrigger className="px-3 py-2">Labs</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={() => navigate('/dashboard')}>
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </MenubarItem>
              <MenubarItem onClick={() => navigate('/create-lab')}>
                <Plus className="mr-2 h-4 w-4" />
                Create New Lab
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger className="px-3 py-2">View</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={() => setTheme('light')}>
                <Sun className="mr-2 h-4 w-4" />
                Light Mode
              </MenubarItem>
              <MenubarItem onClick={() => setTheme('dark')}>
                <Moon className="mr-2 h-4 w-4" />
                Dark Mode
              </MenubarItem>
              <MenubarItem onClick={() => setTheme('system')}>
                <Monitor className="mr-2 h-4 w-4" />
                System
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>

        <div className="ml-auto flex items-center space-x-4">
          <Badge variant="outline" className="hidden sm:inline-flex">
            {location.pathname === '/dashboard' ? 'Dashboard' : 
             location.pathname === '/create-lab' ? 'Create Lab' :
             location.pathname === '/profile' ? 'Profile' :
             location.pathname.startsWith('/lab/') ? 'Lab Details' : 'FluxLabs'}
          </Badge>

          <Menubar>
            <MenubarMenu>
              <MenubarTrigger className="p-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {userInfo.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </MenubarTrigger>
              <MenubarContent align="end">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{userInfo.username}</p>
                  <p className="text-xs text-muted-foreground">{userInfo.email}</p>
                </div>
                <MenubarSeparator />
                <MenubarItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </MenubarItem>
                <MenubarItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </div>
      </div>
    </div>
  )
}
