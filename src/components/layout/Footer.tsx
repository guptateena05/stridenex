"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Mail,
  MapPin,
  Phone,
  Github,
  Heart,
  Sparkles,
  Globe,
  Shield,
  Zap,
  GraduationCap,
  Building2,
  Briefcase,
  Users,
  Newspaper,
  Handshake,
  MessageCircle,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FaXTwitter } from "react-icons/fa6";
import { FaWhatsapp, FaFacebook, FaLinkedin, FaInstagram, FaYoutube } from "react-icons/fa";

interface FooterProps {
  appName?: string;
}

const footerLinks = {
  forStudents: [
    { label: "Skill Facilitating Program", href: "/students/skill-facilitating" },
    { label: "Mentorship", href: "/students/mentorship" },
    { label: "Success Stories", href: "/students/success-stories" },
    { label: "Entrepreneur Development", href: "/students/entrepreneur" },
    { label: "Higher Education Pathway", href: "/students/higher-education" },
  ],
  forInstitutes: [
    { label: "Industry Integration", href: "/institutes/integration" },
    { label: "Skill Analytics", href: "/institutes/analytics" },
    { label: "Placement Enhancement", href: "/institutes/placement" },
    { label: "Faculty Development", href: "/institutes/faculty" },
    { label: "Partner With Us", href: "/partner-with-us" },
  ],
  forIndustry: [
    { label: "Talent Pipeline", href: "/industry/talent" },
    { label: "Project Sponsorship", href: "/industry/sponsorship" },
    { label: "Curriculum Collaboration", href: "/industry/curriculum" },
    { label: "Expert Sessions", href: "/industry/experts" },
    { label: "Hire Graduates", href: "/industry/hire" },
  ],
  company: [
    { label: "About Us", href: "/about" },
    { label: "Leadership", href: "/about/leadership" },
    { label: "Mentors", href: "/about/mentors" },
    { label: "Careers", href: "/careers" },
    { label: "Contact", href: "/contact" },
  ],
  blogsAndEvents: [
    { label: "Blogs", href: "/blogs" },
    { label: "Events", href: "/events" },
    { label: "Our Videos", href: "/our-videos" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
    { label: "GDPR", href: "/gdpr" },
    { label: "Security", href: "/security" },
  ],
};

const socialLinks = [
  { icon: FaFacebook, href: "https://facebook.com/stridenex", label: "Facebook", hoverColor: "group-hover:text-[#1877F2]" },
  // { icon: X, href: "https://twitter.com/stridenex", label: "X (Twitter)", customIcon: FaXTwitter, hoverColor: "group-hover:text-black" },
  { icon: FaLinkedin, href: "https://linkedin.com/company/stridenex", label: "LinkedIn", hoverColor: "group-hover:text-[#0077B5]" },
  { icon: FaInstagram, href: "https://instagram.com/stridenex", label: "Instagram", hoverColor: "group-hover:text-[#E4405F]" },
  { icon: FaYoutube, href: "https://www.youtube.com/@stridenex", label: "YouTube", hoverColor: "group-hover:text-[#FF0000]" },
  // { icon: MessageCircle, href: "https://whatsapp.com/stridenex", label: "WhatsApp", customIcon: FaWhatsapp, hoverColor: "group-hover:text-[#25D366]" },
];

const contactInfo = {
  email: "info@stridenex.ai",
  // phone: "(+91) 9225297767",
  address: "Pune, (MH) India 411038",
  support: "support@stridenex.com",
  partnerships: "partners@stridenex.com",
};

export default function Footer({ appName = "StrideNex" }: FooterProps) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="relative bg-gradient-to-b from-slate-900 to-slate-950 text-white overflow-hidden">
      <h2 className="sr-only">Footer</h2>
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }} />
      </div>

      {/* Floating Gradient Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-primary/20 to-purple-600/20 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-accent/20 to-orange-600/20 rounded-full blur-3xl"
      />

      <div className="max-w-7xl mx-auto px-6 py-20 relative z-10">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 items-start gap-12 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 bg-white rounded-xl shadow-lg flex items-center justify-center p-2">
                  <img
                    src="/images/circularLogo.jpg" // Changed from the jpg to your actual logo file
                    alt="Skill Bridge Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <span className="text-2xl font-black tracking-tighter text-white">{appName}</span>
                  <p className="text-xs text-slate-400 mt-0.5">Pathways to Your Future</p>
                </div>
              </div>

              <p className="text-slate-300 text-sm leading-relaxed">
                StrideNex is a collaborative career development platform connecting education, innovation, and industry to enable structured growth pathways for the next generation workforce.
              </p>
            </motion.div>
          </div>

          {/* Links Columns */}
          {/* <div className="lg:col-span-6 grid grid-cols-2 md:grid-cols-4 gap-8"> */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 lg:col-span-9 xl:grid-cols-4">
            <motion.div
              className="min-w-0"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              {/* <div className="flex items-center gap-2 mb-4"> */}
              <div className="mb-4 flex min-h-10 items-center gap-2">
                <GraduationCap className="w-4 h-4 text-white" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">For Students</h3>
              </div>
              <ul className="space-y-2">
                {footerLinks.forStudents.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-300 hover:text-slate-100 transition-colors group flex items-center gap-1"
                    >
                      {link.label}
                      <ArrowRight className="w-3 h-3 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all text-slate-300" />
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              className="min-w-0"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              {/* <div className="flex items-center gap-2 mb-4"> */}
              <div className="mb-4 flex min-h-10 items-center gap-2">
                <Building2 className="w-4 h-4 text-white" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">For Institutes</h3>
              </div>
              <ul className="space-y-2">
                {footerLinks.forInstitutes.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-300 hover:text-slate-100 transition-colors group flex items-center gap-1"
                    >
                      {link.label}
                      <ArrowRight className="w-3 h-3 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all text-slate-300" />
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              className="min-w-0"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              {/* <div className="flex items-center gap-2 mb-4"> */}
              <div className="mb-4 flex min-h-10 items-center gap-2">
                <Briefcase className="w-4 h-4 text-white" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">For Industry</h3>
              </div>
              <ul className="space-y-2">
                {footerLinks.forIndustry.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-300 hover:text-slate-100 transition-colors group flex items-center gap-1"
                    >
                      {link.label}
                      <ArrowRight className="w-3 h-3 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all text-slate-300" />
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              className="min-w-0"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              {/* <div className="flex items-center gap-2 mb-4"> */}
              <div className="mb-4 flex min-h-10 items-center gap-2">
                <Users className="w-4 h-4 text-white" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">Company</h3>
              </div>
              <ul className="space-y-2">
                {footerLinks.company.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-300 hover:text-slate-100 transition-colors group flex items-center gap-1"
                    >
                      {link.label}
                      <ArrowRight className="w-3 h-3 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all text-slate-300" />
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Newsletter Column */}
          {/* <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700"
            >
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-white" />
                <h3 className="text-lg font-bold text-white">Stay Updated</h3>
              </div>
              <p className="text-sm text-slate-300 mb-4">
                Get the latest insights on career development, industry trends, and program updates.
              </p>

              <form onSubmit={handleSubscribe} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-primary"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  variant="accent"
                  className="btn-footer-cta group"
                >
                  {subscribed ? "Thanks for subscribing!" : "Subscribe to Newsletter"}
                  {!subscribed && <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                </Button>
              </form>

              {subscribed && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-green-400 mt-3"
                >
                  ✓ Check your inbox for confirmation
                </motion.p>
              )}

              <p className="text-xs text-slate-300 mt-4">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </motion.div>
          </div> */}
        </div>

        {/* Three-Part Secondary Row: 1) Contact & Social, 2) Blogs & Events, 3) Partner With Us */}
        <div className="grid grid-cols-1 md:grid-cols-3 items-start gap-8 lg:gap-12 pt-8 border-t border-slate-800/60 mb-16">
          {/* Part 1: Email, Address, and Social Icons */}
          <motion.div
            className="min-w-0"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            {/* Contact Info */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Mail className="w-4 h-4 text-white" />
                <a href={`mailto:${contactInfo.email}`} className="text-slate-300 hover:text-white transition-colors">
                  {contactInfo.email}
                </a>
              </div>
              {/* <div className="flex items-center gap-2 text-sm text-slate-300">
                <Phone className="w-4 h-4 text-accent" />
                <a href={`tel:${contactInfo.phone}`} className="text-slate-300 hover:text-white transition-colors">
                  {contactInfo.phone}
                </a>
              </div> */}
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <MapPin className="w-4 h-4 text-emerald-500" />
                <span className="text-slate-300">{contactInfo.address}</span>
              </div>
            </div>

            <div className="flex gap-3">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="group w-10 h-10 rounded-full bg-slate-800/50 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all border border-slate-700 hover:border-transparent text-slate-300"
                  aria-label={social.label}
                >
                  {/* {social.customIcon ? (
                    <social.customIcon className={`w-5 h-5 transition-colors ${social.hoverColor}`} />
                  ) : ( */}
                  <social.icon className={`w-5 h-5 transition-colors ${social.hoverColor}`} />
                  {/* )} */}
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Part 2: Blogs & Events Section */}
          <motion.div
            className="min-w-0"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="mb-4 flex min-h-10 items-center gap-2">
              <Newspaper className="w-4 h-4 text-white" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Blogs & Events</h3>
            </div>
            <ul className="space-y-2">
              {footerLinks.blogsAndEvents.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-300 hover:text-slate-100 transition-colors group flex items-center gap-1"
                  >
                    {link.label}
                    <ArrowRight className="w-3 h-3 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all text-slate-300" />
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Part 3: Partner With Us */}
          <motion.div
            className="min-w-0"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="mb-4 flex min-h-10 items-center gap-2">
              <Handshake className="w-4 h-4 text-white" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Partner With Us</h3>
            </div>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/partner-with-us"
                  className="text-sm text-slate-300 hover:text-slate-100 transition-colors group flex items-center gap-1"
                >
                  Partner With Us
                  <ArrowRight className="w-3 h-3 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all text-slate-300" />
                </Link>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Quick Contact Bar */}
        {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 py-6 border-y border-slate-800 mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-xs text-slate-500">General Enquiries</div>
              <a href={`mailto:${contactInfo.email}`} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                {contactInfo.email}
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-accent" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Institute Partnerships</div>
              <a href={`mailto:institutions@stridenex.com`} className="text-sm font-medium text-slate-300 hover:text-accent transition-colors">
                institutions@stridenex.com
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Industry Collaborations</div>
              <a href={`mailto:partners@stridenex.com`} className="text-sm font-medium text-slate-300 hover:text-emerald-500 transition-colors">
                partners@stridenex.com
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Mentor Applications</div>
              <a href={`mailto:mentors@stridenex.com`} className="text-sm font-medium text-slate-300 hover:text-purple-500 transition-colors">
                mentors@stridenex.com
              </a>
            </div>
          </div>
        </motion.div> */}

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-slate-500 flex items-center gap-2">
            © {new Date().getFullYear()} {appName}. All rights reserved.
            {/* <span className="flex items-center gap-1 ml-2">
              Made with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> for future careers
            </span> */}
          </div>

          <div className="flex items-center gap-6">
            <Link href="/privacy-policy"
              target="_blank" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              Privacy
            </Link>
            <span className="text-slate-700">•</span>
            <Link href="/terms-of-use"
              target="_blank" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              Terms
            </Link>
            {/* <span className="text-slate-700">•</span>
            <Link href="/cookies" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              Cookies
            </Link>
            <span className="text-slate-700">•</span>
            <Link href="/accessibility" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              Accessibility
            </Link> */}
          </div>

          {/* Trust Badge */}
          {/* <div className="flex items-center gap-2 text-xs text-slate-500">
            <Shield className="w-3 h-3" />
            <span>ISO 27001 Certified</span>
          </div> */}
        </div>
      </div>

      {/* Decorative Bottom Wave */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-0">
        <svg className="relative block w-full h-8" data-name="wave" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
            className="fill-slate-950 opacity-50"></path>
        </svg>
      </div>
    </footer>
  );
}
