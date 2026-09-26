import React from 'react';
import { motion } from 'framer-motion';

export default function PartnerCategories() {
  const categories = [
    {
      title: "Placement Consultants & Career Advisors",
      icon: "work",
      benefits: ["Automate student readiness verification", "Access verified talent pipeline to sell to employers", "Increase placement rate", "Earn commission on placements"],
      color: "blue"
    },
    {
      title: "Training Center Networks",
      icon: "school",
      benefits: ["Embed StrideNex pathways into curriculum", "Add verified Skill Ledger to certificates", "Access internship & job board", "Monetize through mentorship"],
      color: "indigo"
    },
    {
      title: "Faculty & Teacher Associations",
      icon: "group",
      benefits: ["Modernize placement infrastructure", "Reduce placement cell burden", "Improve institutional placement metrics", "Student data for curriculum feedback"],
      color: "purple"
    },
    {
      title: "Government Skill Bodies & NGOs",
      icon: "account_balance",
      benefits: ["Integrate outcome tracking for compliance", "Better job placement data", "Portability of skills", "Co-branded pathway development"],
      color: "pink"
    },
    {
      title: "Industry Association & Hiring Managers",
      icon: "domain",
      benefits: ["Vetted talent access (Readiness Score)", "Reduced hiring friction for members", "Data on skill gaps", "Co-branded hiring programs"],
      color: "rose"
    },
    {
      title: "EdTech Aggregators & LMS Resellers",
      icon: "menu_book",
      benefits: ["Add outcome layer to content", "Increase stickiness & renewal rates", "White-label integration", "Commission on new institute adopters"],
      color: "orange"
    },
    {
      title: "Mentors & Senior Professionals",
      icon: "psychology",
      benefits: ["Centralized mentor marketplace", "Automated student matching", "Income growth via commissions", "Professional badge & credibility"],
      color: "teal"
    }
  ];

  const getColorClasses = (color: string) => {
    const map: Record<string, string> = {
      blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-600",
      indigo: "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600",
      purple: "bg-purple-50 text-purple-600 group-hover:bg-purple-600",
      pink: "bg-pink-50 text-pink-600 group-hover:bg-pink-600",
      rose: "bg-rose-50 text-rose-600 group-hover:bg-rose-600",
      orange: "bg-orange-50 text-orange-600 group-hover:bg-orange-600",
      teal: "bg-teal-50 text-teal-600 group-hover:bg-teal-600"
    };
    return map[color] || map.blue;
  };

  const getHoverCardClass = (color: string) => {
    const map: Record<string, string> = {
      blue: "hover:bg-blue-50/80 hover:border-blue-200 hover:shadow-blue-500/10",
      indigo: "hover:bg-indigo-50/80 hover:border-indigo-200 hover:shadow-indigo-500/10",
      purple: "hover:bg-purple-50/80 hover:border-purple-200 hover:shadow-purple-500/10",
      pink: "hover:bg-pink-50/80 hover:border-pink-200 hover:shadow-pink-500/10",
      rose: "hover:bg-rose-50/80 hover:border-rose-200 hover:shadow-rose-500/10",
      orange: "hover:bg-orange-50/80 hover:border-orange-200 hover:shadow-orange-500/10",
      teal: "hover:bg-teal-50/80 hover:border-teal-200 hover:shadow-teal-500/10"
    };
    return map[color] || map.blue;
  };

  return (
    <section className="py-24 relative overflow-hidden bg-gradient-to-b from-blue-50/50 via-slate-50 to-indigo-50/50">
      {/* Decorative background */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#9ca3af_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.15]"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-extrabold text-gray-900 mb-6">Who Can Partner With Us?</h2>
            <p className="text-xl text-gray-600 font-light">
              If you have physical reach, existing trust, and practical execution capability, you are the right fit.
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className={`bg-white/30 backdrop-blur-xl rounded-3xl p-8 border border-white/60 shadow-lg shadow-blue-900/5 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group ${getHoverCardClass(category.color)} ${index === 6 ? 'lg:col-span-3 xl:col-span-1' : ''}`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300 ${getColorClasses(category.color)}`}>
                <span className="material-symbols-outlined text-2xl group-hover:text-white transition-colors duration-300">{category.icon}</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-5 leading-snug">{category.title}</h3>
              <ul className="space-y-4">
                {category.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-start group/item">
                    <span className="material-symbols-outlined text-green-500 text-[18px] mt-0.5 mr-3 group-hover/item:scale-110 transition-transform">check_circle</span>
                    <span className="text-gray-600 text-sm font-medium leading-relaxed">{benefit}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
