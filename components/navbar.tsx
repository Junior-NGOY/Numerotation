"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { LogOut, BarChart3, Users, FileText, Menu, X, Car, MapPin, FileSearch } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function Navbar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (!user) return null

  const navLinks = [
    { href: "/dashboard", icon: BarChart3, label: "Tableau de Bord" },
    { href: "/vehicules", icon: Car, label: "Véhicules" },
    { href: "/proprietaires", icon: Users, label: "Propriétaires" },
    { href: "/itineraires", icon: MapPin, label: "Itinéraires" },
    { href: "/documents", icon: FileSearch, label: "Documents" },
    { href: "/documents/manager", icon: FileText, label: "Gestionnaire Documents" },
  ]

  const adminLinks = [
    { href: "/utilisateurs", icon: Users, label: "Utilisateurs" },
  ]

  const isActiveLink = (href: string) => pathname === href

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors">
              Système Transport
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <Link href="/dashboard">
              <Button 
                variant={isActiveLink("/dashboard") ? "default" : "ghost"} 
                size="sm"
                className="transition-all"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Tableau de Bord
              </Button>
            </Link>

            <Link href="/documents/manager">
              <Button 
                variant={isActiveLink("/documents/manager") ? "default" : "ghost"} 
                size="sm"
                className="transition-all"
              >
                <FileText className="h-4 w-4 mr-2" />
                Gestionnaire Documents
              </Button>
            </Link>

            {user.role === "ADMIN" && (
              <Link href="/utilisateurs">
                <Button 
                  variant={isActiveLink("/utilisateurs") ? "default" : "ghost"} 
                  size="sm"
                  className="transition-all"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Utilisateurs
                </Button>
              </Link>
            )}
          </div>

          {/* Right Side - Avatar + Mobile Menu */}
          <div className="flex items-center space-x-2">
            {/* Desktop User Menu */}
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:ring-2 hover:ring-offset-2 hover:ring-primary transition-all">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user.name
                          ? user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                          : "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-3 border-b">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user.name
                          ? user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                          : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.name}</p>
                      <p className="w-[180px] truncate text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-blue-600 capitalize font-semibold">{user.role}</p>
                    </div>
                  </div>
                  <DropdownMenuItem onClick={logout} className="cursor-pointer mt-1">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Se déconnecter</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle className="text-left">Menu</SheetTitle>
                </SheetHeader>
                
                <div className="flex flex-col space-y-4 mt-6">
                  {/* User Info Mobile */}
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                        {user.name
                          ? user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                          : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-sm text-muted-foreground truncate max-w-[180px]">{user.email}</p>
                      <p className="text-xs text-blue-600 capitalize font-semibold">{user.role}</p>
                    </div>
                  </div>

                  {/* Navigation Links Mobile */}
                  <div className="flex flex-col space-y-2">
                    {navLinks.map((link) => (
                      <Link 
                        key={link.href} 
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Button 
                          variant={isActiveLink(link.href) ? "default" : "ghost"} 
                          className="w-full justify-start h-12 text-base"
                        >
                          <link.icon className="h-5 w-5 mr-3" />
                          {link.label}
                        </Button>
                      </Link>
                    ))}

                    {user.role === "ADMIN" && (
                      <>
                        <div className="h-px bg-border my-2" />
                        <p className="text-xs font-semibold text-muted-foreground px-2">Administration</p>
                        {adminLinks.map((link) => (
                          <Link 
                            key={link.href} 
                            href={link.href}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Button 
                              variant={isActiveLink(link.href) ? "default" : "ghost"} 
                              className="w-full justify-start h-12 text-base"
                            >
                              <link.icon className="h-5 w-5 mr-3" />
                              {link.label}
                            </Button>
                          </Link>
                        ))}
                      </>
                    )}
                  </div>

                  {/* Logout Button Mobile */}
                  <div className="pt-4 border-t">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start h-12 text-base text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => {
                        setMobileMenuOpen(false)
                        logout()
                      }}
                    >
                      <LogOut className="h-5 w-5 mr-3" />
                      Se déconnecter
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}
