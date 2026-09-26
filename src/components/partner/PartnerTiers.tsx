import React from 'react';
import { motion } from 'framer-motion';

export default function PartnerTiers() {
  const tiers = [
    {
      name: "Base Partner",
      target: "Consultants, Coaches, Mentors",
      price: "Free",
      features: [
        "Partner profile on marketplace",
        "White-label referral link",
        "Basic analytics dashboard",
        "Marketing assets & community access"
      ],
      revenue: "5% referral commission, 10% on mentorship",
      buttonText: "Join for Free",
      popular: false,
      color: "blue"
    },
    {
      name: "Growth Partner",
      target: "Training Centers, Faculty",
      price: "Custom",
      features: [
        "White-label portal",
        "Bulk student import",
        "Dedicated support & co-marketing",
        "Advanced analytics & custom pathways"
      ],
      revenue: "8-12% commission, 5-8% revenue share",
      buttonText: "Apply Now",
      popular: true,
      color: "indigo"
    },
    {
      name: "Scale Partner",
      target: "Large Networks, Gov Bodies",
      price: "Enterprise",
      features: [
        "Custom integration & APIs",
        "Dedicated account manager",
        "White-label mobile app option",
        "Priority feature requests"
      ],
      revenue: "10-15% commission, 8-12% revenue share",
      buttonText: "Contact Sales",
      popular: false,
      color: "purple"
    },
    {
      name: "Anchor Partner",
      target: "Mega Networks, Industry",
      price: "Strategic",
      features: [
        "Strategic executive alignment",
        "Exclusive territories",
        "Co-create certification programs",
        "Custom SLA & dedicated team"
      ],
      revenue: "12-20% commission, 20-30% on co-creation",
      buttonText: "Contact Partnerships",
      popular: false,
      color: "rose"
    }
  ];

  return (
    <section className="py-24 relative overflow-hidden bg-gradient-to-br from-indigo-50/50 via-slate-50 to-purple-50/50" id="partner-tiers">
      {/* Background patterns */}
      <div className="absolute inset-0 z-0 opacity-[0.15] bg-[radial-gradient(#9ca3af_1px,transparent_1px)] [background-size:24px_24px]"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-extrabold text-gray-900 mb-6">Partner Tiers Architecture</h2>
            <p className="text-xl text-gray-600 font-light">
              Whether you are an independent consultant or a national industry body, we have a tier designed for your scale.
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tiers.map((tier, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className={`relative bg-white/30 backdrop-blur-xl rounded-2xl ${tier.popular ? 'ring-2 ring-indigo-500 shadow-2xl shadow-indigo-500/20 transform md:-translate-y-2' : 'border border-white/40 shadow-lg shadow-blue-900/5 hover:ring-2 hover:ring-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-2 hover:border-transparent'} p-6 flex flex-col transition-all duration-300 group`}
            >
              {tier.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm">
                  Most Popular
                </div>
              )}
              
              <div className="mb-5">
                <h3 className="text-xl font-bold text-gray-900 mb-1.5">{tier.name}</h3>
                <p className="text-xs font-medium text-indigo-600 bg-indigo-50/50 inline-block px-2.5 py-1 rounded-full">{tier.target}</p>
              </div>
              
              <div className="mb-5 pb-5 border-b border-indigo-100/50">
                <div className="flex items-baseline">
                  <span className="text-3xl font-extrabold text-gray-900 tracking-tight">{tier.price}</span>
                </div>
              </div>
              
              <div className="mb-5 flex-grow">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Features</h4>
                <ul className="space-y-3">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className={`material-symbols-outlined text-${tier.popular ? 'indigo' : 'blue'}-500 text-[16px] mr-2 mt-0.5`}>check_circle</span>
                      <span className="text-gray-700 text-[13px] font-medium leading-snug">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="mb-6 p-3 bg-indigo-50/30 rounded-xl border border-indigo-100/50">
                <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1.5">Revenue Share</h4>
                <p className="text-[13px] font-bold text-gray-800">{tier.revenue}</p>
              </div>
              
              <button className={`w-full py-2.5 px-4 text-sm rounded-xl font-bold transition-all ${tier.popular ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-500/30' : 'bg-white/80 text-indigo-700 border border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50'}`}>
                {tier.buttonText}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
