// components/layout/PublicNavbar.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  Search,
  GraduationCap,
  Building2,
  Briefcase,
} from "lucide-react";
import {
  FaLinkedin,
  FaInstagram,
  FaFacebook,
  FaYoutube
} from "react-icons/fa";
import { navigationConfig, getBadgeColorClasses, type NavSection, type NavItem } from "@/config/navigation";
import Image from "next/image";

interface NavbarProps {
  appName?: string;
}

// Animation variants
const menuVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      staggerChildren: 0.05
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
};

const megaMenuVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
    transition: { duration: 0.2 }
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      staggerChildren: 0.03
    }
  },
  exit: {
    opacity: 0,
    y: 20,
    scale: 0.95,
    transition: { duration: 0.2 }
  }
};

const sectionVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

export default function PublicNavbar({ }: NavbarProps) {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const megaMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const { scrollY, innerHeight } = window;
      const pageHeight = document.documentElement.scrollHeight;

      setIsScrolled(window.scrollY > 20);
      setIsAtBottom(innerHeight + scrollY >= pageHeight - 1);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      setActiveMegaMenu(null);
      setSearchOpen(false);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!mobileMenuOpen && megaMenuRef.current && !megaMenuRef.current.contains(event.target as Node)) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        setActiveMegaMenu(null);
      }

      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (activeMegaMenu || mobileMenuOpen || searchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [activeMegaMenu, mobileMenuOpen, searchOpen]);

  const handleMegaMenuEnter = (key: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    const item = navItems.find(item => item.key === key);
    if (item?.sections && item.sections.length > 0) {
      setActiveMegaMenu(key);
    } else {
      setActiveMegaMenu(null);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleMegaMenuLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      if (!megaMenuRef.current?.matches(':hover')) {
        setActiveMegaMenu(null);
      }
    }, 100);
  };

  const handleNavigation = (href: string) => {
    router.push(href);
    setMobileMenuOpen(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setActiveMegaMenu(null);
    setSearchOpen(false);
  };

  const navItems = Object.entries(navigationConfig).map(([key, value]) => ({
    key,
    ...value
  }));

  const quickActions = [
    { label: "LinkedIn", icon: FaLinkedin, color: "from-blue-600 to-blue-700", href: "https://www.linkedin.com/company/stridenex-ai/about/" },
    { label: "Instagram", icon: FaInstagram, color: "from-pink-500 to-purple-600", href: "https://instagram.com/stridenex" },
    { label: "Facebook", icon: FaFacebook, color: "from-blue-600 to-blue-700", href: "https://facebook.com/stridenex" },
    { label: "YouTube", icon: FaYoutube, color: "from-red-600 to-red-700", href: "https://youtube.com/@stridenex" },
  ];


  return (
    <>
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-lg'
          : 'bg-white/80 backdrop-blur-sm'
          }`}
      >
        <div className="max-w-7xl mx-auto px-6">
          {/* Main Navbar Row */}
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center cursor-pointer">
              {/* <img
                src="/images/Logo.png"
                alt="StrideNex Logo"
                className="w-[140px] h-[140px] object-contain hover:scale-105 transition-transform duration-300"
              /> */}
              <Image
                src="/images/Logo.png"
                alt="StrideNex"
                width={700}
                height={148}
                sizes="140px"
                priority
                className="h-[60px] w-[140px] object-contain hover:scale-105 transition-transform duration-300"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center justify-center gap-1">
              {navItems.map((item) => {
                const hasSections = item.sections && item.sections.length > 0;

                // Hide Join Us from main loop, it will be rendered on the right
                if (item.key === 'join') {
                  return null;
                }

                return (
                  <div
                    key={item.key}
                    className="relative"
                    onMouseEnter={() => handleMegaMenuEnter(item.key)}
                    onMouseLeave={hasSections ? handleMegaMenuLeave : undefined}
                  >
                    {item.href ? (
                      <button
                        onClick={() => handleNavigation(item.href!)}
                        className={`px-2 xl:px-3 py-2 rounded-lg font-medium text-[13px] xl:text-sm transition-all duration-300 flex items-center gap-1 xl:gap-1.5 group ${activeMegaMenu === item.key
                          ? 'text-primary bg-primary/10'
                          : 'text-slate-700 hover:text-primary hover:bg-primary/5'
                          }`}
                      >
                        {item.label}
                        {hasSections && (
                          <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${activeMegaMenu === item.key ? 'rotate-180' : ''
                            }`} />
                        )}
                      </button>
                    ) : (
                      <button
                        className={`px-2 xl:px-3 py-2 rounded-lg font-medium text-[13px] xl:text-sm transition-all duration-300 flex items-center gap-1 xl:gap-1.5 group ${activeMegaMenu === item.key
                          ? 'text-primary bg-primary/10'
                          : 'text-slate-700 hover:text-primary hover:bg-primary/5'
                          }`}
                      >
                        {item.label}
                        {hasSections && (
                          <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${activeMegaMenu === item.key ? 'rotate-180' : ''
                            }`} />
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              {/* Login Button and Join Us */}
              <div className="hidden lg:flex items-center gap-3">
                {(() => {
                  const joinItem = navItems.find(i => i.key === 'join');
                  if (!joinItem) return null;
                  const hasSections = joinItem.sections && joinItem.sections.length > 0;
                  return (
                    <div className="relative group">
                      <button
                        onClick={() => window.open(joinItem.href, '_blank')}
                        className="px-5 py-2 rounded-full font-bold text-sm transition-all duration-300 flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800 shadow-md hover:shadow-lg"
                      >
                        <joinItem.icon className="w-4 h-4" />
                        {joinItem.label}
                        {hasSections && (
                          <ChevronDown className="w-3 h-3 transition-transform duration-300 group-hover:rotate-180" />
                        )}
                      </button>

                      {/* Normal Dropdown */}
                      {hasSections && (
                        <div className="absolute top-full right-0 pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                          <div className="w-64 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
                            <div className="p-2">
                              {joinItem.sections.map(section => (
                                section.items.map(item => (
                                  <button
                                    key={item.label}
                                    onClick={() => item.href === '/partner-with-us' ? handleNavigation(item.href) : window.open(item.href, '_blank')}
                                    className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-primary/5 transition-colors text-left group/item"
                                  >
                                    {item.icon && (
                                      <div className="w-8 h-8 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover/item:bg-primary group-hover/item:text-white transition-colors">
                                        <item.icon className="w-4 h-4" />
                                      </div>
                                    )}
                                    <div>
                                      <div className="text-sm font-semibold text-slate-900 group-hover/item:text-primary transition-colors">
                                        {item.label}
                                      </div>
                                      <div className="text-xs text-slate-500 mt-0.5">
                                        {item.description}
                                      </div>
                                    </div>
                                  </button>
                                ))
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <button
                  onClick={() => window.open('/login', '_blank')}
                  className="px-6 py-2 text-sm font-bold text-orange-600 bg-orange-100 hover:bg-orange-200 rounded-full transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 border border-orange-200 hover:border-orange-300"
                >
                  Login
                </button>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-slate-700 hover:text-primary hover:bg-primary/5 transition-colors"
                aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mega Menu */}
        <AnimatePresence>
          {activeMegaMenu && (
            <motion.div
              key={activeMegaMenu}
              ref={megaMenuRef}
              variants={megaMenuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onMouseLeave={handleMegaMenuLeave}
              className="hidden lg:block absolute left-0 right-0 top-full bg-white shadow-2xl border-t border-primary/10 overflow-hidden"
              style={{ originY: 0 }}
            >
              <div className="max-w-7xl mx-auto px-6 py-6">
                <div className="flex flex-col md:flex-row flex-wrap gap-6 md:gap-8 lg:gap-12 justify-center">
                  {navItems.find(item => item.key === activeMegaMenu)?.sections.map((section) => (
                    <motion.div
                      key={section.title}
                      variants={sectionVariants}
                      className="space-y-4 w-full md:flex-1 md:min-w-[220px] md:max-w-[280px]"
                    >
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gradient-orange">
                        {section.title}
                      </h4>
                      <div className="space-y-1">
                        {section.items.map((item) => (
                          <motion.div
                            key={item.label}
                            variants={itemVariants}
                            whileHover={{ x: 5 }}
                            className="group"
                          >
                            <button
                              onClick={() => handleNavigation(item.href)}
                              className="flex items-start gap-3 p-2 rounded-xl hover:bg-primary/5 transition-colors w-full text-left"
                            >
                              {item.icon && (
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                  <item.icon className="w-4 h-4" />
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-slate-900 group-hover:text-primary transition-colors">
                                    {item.label}
                                  </span>
                                  {item.badge && (
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${getBadgeColorClasses(item.badgeColor).bg
                                      } ${getBadgeColorClasses(item.badgeColor).text
                                      }`}>
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                                {item.description && (
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>


              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Overlay */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              ref={searchRef}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute left-0 right-0 top-16 bg-white shadow-2xl border-t border-primary/10 p-6"
            >
              <div className="max-w-3xl mx-auto">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search for programs, pathways, opportunities..."
                    className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-primary/10 focus:border-primary outline-none transition-colors"
                    autoFocus
                  />
                </div>
                <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
                  <span>Popular:</span>
                  <button className="hover:text-primary transition-colors">Skill Facilitating</button>
                  <button className="hover:text-primary transition-colors">Entrepreneurship</button>
                  <button className="hover:text-primary transition-colors">Higher Education</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              variants={menuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="lg:hidden absolute left-0 right-0 top-16 bg-white shadow-2xl border-t border-primary/10 max-h-[calc(100vh-5rem)] overflow-y-auto"
            >
              <div className="p-6 space-y-6">
                {/* Mobile Role Switcher */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleNavigation('/students')}
                    className="text-center p-2 rounded-lg bg-primary/5"
                  >
                    <GraduationCap className="w-5 h-5 mx-auto text-primary mb-1" />
                    <span className="text-xs font-medium">Students</span>
                  </button>
                  <button
                    onClick={() => handleNavigation('/institutes')}
                    className="text-center p-2 rounded-lg bg-accent/5"
                  >
                    <Building2 className="w-5 h-5 mx-auto text-accent mb-1" />
                    <span className="text-xs font-medium">Institutes</span>
                  </button>
                  <button
                    onClick={() => handleNavigation('/industry')}
                    className="text-center p-2 rounded-lg bg-emerald-500/5"
                  >
                    <Briefcase className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
                    <span className="text-xs font-medium">Industry</span>
                  </button>
                </div>

                {/* Mobile Navigation Items */}
                {navItems.map((item) => {
                  const hasSections = item.sections && item.sections.length > 0;

                  return (
                    <motion.div key={item.key} variants={itemVariants} className="space-y-3">
                      {item.href ? (
                        <div className="flex items-center justify-between w-full">
                          <button
                            onClick={() => handleNavigation(item.href!)}
                            className="text-left flex-1 py-1"
                          >
                            <span className="text-lg font-bold text-slate-900">{item.label}</span>
                          </button>
                          {hasSections && (
                            <button
                              type="button"
                              onClick={() => setActiveMegaMenu(activeMegaMenu === item.key ? null : item.key)}
                              className="p-2 -mr-2 rounded-lg hover:bg-primary/5 transition-colors"
                              aria-label={`Toggle ${item.label} submenu`}
                              aria-expanded={activeMegaMenu === item.key}
                            >
                              <ChevronDown className={`w-5 h-5 text-accent transition-transform duration-200 ${activeMegaMenu === item.key ? 'rotate-180' : ''
                                }`} />
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => setActiveMegaMenu(activeMegaMenu === item.key ? null : item.key)}
                          className="flex items-center justify-between w-full text-left"
                        >
                          <span className="text-lg font-bold text-slate-900">{item.label}</span>
                          {hasSections && (
                            <ChevronDown className={`w-5 h-5 text-accent transition-transform ${activeMegaMenu === item.key ? 'rotate-180' : ''
                              }`} />
                          )}
                        </button>
                      )}

                      {hasSections && activeMegaMenu === item.key && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4 overflow-hidden"
                        >
                          {item.sections.map((section: NavSection) => (
                            <div key={section.title} className="space-y-2">
                              <h5 className="text-xs font-bold uppercase text-primary tracking-wider">
                                {section.title}
                              </h5>
                              <div className="space-y-1">
                                {section.items.map((subItem: NavItem) => (
                                  <button
                                    key={subItem.label}
                                    onClick={() => handleNavigation(subItem.href)}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors w-full text-left"
                                  >
                                    {subItem.icon && (
                                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                        <subItem.icon className="w-4 h-4" />
                                      </div>
                                    )}
                                    <div>
                                      <div className="text-sm font-semibold text-slate-900">
                                        {subItem.label}
                                      </div>
                                      {subItem.description && (
                                        <p className="text-xs text-slate-500">{subItem.description}</p>
                                      )}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}

                <hr className="border-slate-200" />

                {/* Auth buttons for public users */}
                <div className="space-y-2">
                  <button
                    onClick={() => handleNavigation('/login')}
                    className="w-full px-4 py-2 text-center text-primary font-semibold hover:bg-primary/5 rounded-lg transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => handleNavigation('/signup')}
                    className="w-full px-4 py-2 text-center bg-gradient-to-r from-primary to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                  >

                    Join Now
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Backdrop for mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>
      {/* Floating Social Media Icons */}
      <div className="fixed right-0 top-32 z-50 flex flex-col gap-3 p-3 bg-white/80 backdrop-blur-md shadow-[-4px_0_15px_rgba(0,0,0,0.05)] rounded-l-2xl border border-r-0 border-slate-200 hidden md:flex">
        {quickActions.map((action) => (
          <motion.button
            key={action.label}
            whileHover={{ scale: 1.1, x: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.open(action.href, '_blank')}
            className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-white shadow-sm hover:shadow-md transition-all group relative"
            title={action.label}
          >
            <action.icon
              className={`w-5 h-5 transition-colors ${action.label === 'LinkedIn' ? 'text-slate-400 group-hover:text-[#0077B5]' :
                action.label === 'Instagram' ? 'text-slate-400 group-hover:text-[#E4405F]' :
                  action.label === 'Facebook' ? 'text-slate-400 group-hover:text-[#1877F2]' :
                    action.label === 'YouTube' ? 'text-slate-400 group-hover:text-[#FF0000]' : ''
                }`}
            />
          </motion.button>
        ))}
      </div>

      {/* Floating Scroll Buttons */}
      <div className="fixed right-6 bottom-6 z-50 flex flex-col gap-2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={scrollToTop}
          className={`w-12 h-12 rounded-full bg-white text-slate-700 shadow-lg border border-slate-200 flex items-center justify-center hover:text-primary hover:border-primary/30 transition-all ${isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
          title="Scroll to Top"
        >
          <ChevronUp className="w-6 h-6" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={scrollToBottom}
          className={`w-12 h-12 rounded-full bg-white text-slate-700 shadow-lg border border-slate-200 flex items-center justify-center hover:text-primary hover:border-primary/30 transition-all ${isAtBottom ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'}`}
          title="Scroll to Bottom"
        >
          <ChevronDown className="w-6 h-6" />
        </motion.button>
      </div>
    </>
  );
}