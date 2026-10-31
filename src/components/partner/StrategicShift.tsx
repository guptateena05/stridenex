import React from 'react';
import { motion } from 'framer-motion';

export default function StrategicShift() {
  const shifts = [
    {
      title: "From Monetization",
      description: "Selling partnerships and extracting commissions was the old way. It limits scale and creates friction.",
      icon: "money_off",
      gradient: "from-rose-500/10 to-red-500/5",
      iconColor: "text-rose-500",
      borderColor: "border-rose-100",
    },
    {
      title: "To Growth Multiplier",
      description: "Enabling partners to reach their communities and aligning incentives is our new core. We win when you win.",
      icon: "rocket_launch",
      gradient: "from-emerald-500/10 to-teal-500/5",
      iconColor: "text-emerald-500",
      borderColor: "border-emerald-100",
    }
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/70 py-10 lg:py-12">
      {/* Decorative background elements */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-24 h-[600px] w-[600px] translate-x-1/4 -translate-y-1/4 rounded-full bg-gradient-to-bl from-blue-300/70 via-sky-200/50 to-transparent blur-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-20 h-[560px] w-[560px] -translate-x-1/4 translate-y-1/4 rounded-full bg-gradient-to-tr from-violet-300/65 via-indigo-200/45 to-transparent blur-2xl"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-blue-600 font-semibold tracking-wider uppercase mb-1.5 text-xs">The Core Shift</h2>
            <h3 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">A Strategic Reframe</h3>
            <p className="text-base md:text-lg text-gray-600 font-light leading-relaxed">
              We are moving from a transactional model to a collaborative growth network. Your existing trust and physical presence are exactly what the ecosystem needs.
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 relative">
          {/* Connecting arrow/line for desktop */}
          <div className="hidden md:block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
            <div className="w-10 h-10 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-gray-400">
              <span className="material-symbols-outlined text-xl">arrow_forward</span>
            </div>
          </div>

          {shifts.map((shift, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className={`p-6 rounded-2xl bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-xl border border-white/60 shadow-xl shadow-gray-200/20 relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${shift.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="relative z-10 flex items-start gap-4">
                <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center bg-white/50 backdrop-blur-sm shadow-sm border border-white/60 group-hover:scale-110 transition-transform duration-300`}>
                  <span className={`material-symbols-outlined text-2xl ${shift.iconColor}`}>{shift.icon}</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-1.5">{shift.title}</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{shift.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-6 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 backdrop-blur-xl rounded-2xl p-6 border border-white/60 shadow-xl shadow-blue-900/5"
        >
          <div className="text-center mb-5">
            <h4 className="text-lg font-bold text-gray-900">What We Bring to the Table</h4>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Technology Layer", icon: "laptop_mac", desc: "White-label portal & APIs" },
              { title: "Outcome Verification", icon: "verified", desc: "Skill Ledger & readiness" },
              { title: "Distribution Channel", icon: "hub", desc: "Job board & marketplace" },
              { title: "Revenue Stream", icon: "payments", desc: "Commission & rev-share" }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white/50 border border-white/60 group">
                <div className="w-11 h-11 shrink-0 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-300">
                  <span className="material-symbols-outlined text-xl text-blue-600 group-hover:text-white transition-colors duration-300">{item.icon}</span>
                </div>
                <div className="text-left">
                  <div className="font-bold text-sm text-gray-900">{item.title}</div>
                  <div className="text-xs text-gray-500">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
