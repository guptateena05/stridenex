"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin } from "lucide-react";

export default function ContactUsPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    mobileNo: "",
    emailId: "",
    organisation: "",
    designation: "",
    message: "",
  });
  
  const generateCaptchaString = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const [captchaText, setCaptchaText] = useState("");
  const [userCaptcha, setUserCaptcha] = useState("");
  const [captchaError, setCaptchaError] = useState(false);

  React.useEffect(() => {
    setCaptchaText(generateCaptchaString());
  }, []);
  const [loading, setLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userCaptcha !== captchaText) {
      setCaptchaError(true);
      setCaptchaText(generateCaptchaString());
      setUserCaptcha("");
      return;
    }
    setCaptchaError(false);
    setLoading(true);
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_CONTACT_API_BASE_URL || "https://uat-dev.stridenex.ai/api/";
      const response = await fetch(`${baseUrl}method/quantbit_payments_platform.api.contact_us`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          full_name: formData.fullName,
          message: formData.message,
          email: formData.emailId,
          mobile_no: formData.mobileNo,
          organization: formData.organisation,
          designation: formData.designation
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to submit form");
      }
      
      setSubmitSuccess("Thank you for reaching out! We'll get back to you shortly.");
      setFormData({
        fullName: "",
        mobileNo: "",
        emailId: "",
        organisation: "",
        designation: "",
        message: "",
      });
      setUserCaptcha("");
      setCaptchaText(generateCaptchaString());
      setTimeout(() => setSubmitSuccess(""), 5000);
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-24 relative overflow-hidden bg-[#0A0F1C] min-h-screen">
      {/* Immersive Background for Contact Section */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-indigo-600/10 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-blue-600/10 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header - Top Center */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 py-1.5 px-3 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            <span className="text-blue-300 text-xs font-semibold tracking-wider uppercase">Contact Us</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight tracking-tight">
            Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Touch</span>
          </h2>
          <p className="text-lg text-gray-400 leading-relaxed font-light">
            We'd love to hear from you. Whether you have a question about features, trials, pricing, need a demo, or anything else, our team is ready to answer all your questions.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-10 items-start">
          
          {/* Left Column: Contact Cards */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col space-y-4"
          >
            <div className="flex items-center gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm transition-transform hover:scale-[1.02] hover:bg-white/10">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center shrink-0 border border-blue-500/20">
                <Phone className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white mb-0.5">Phone</h4>
                <p className="text-gray-400 text-sm">(+91) 9225297767</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm transition-transform hover:scale-[1.02] hover:bg-white/10">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center shrink-0 border border-blue-500/20">
                <Mail className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white mb-0.5">Email</h4>
                <p className="text-gray-400 text-sm">info@stridenex.ai</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm transition-transform hover:scale-[1.02] hover:bg-white/10">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center shrink-0 border border-blue-500/20">
                <MapPin className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white mb-0.5">Headquarters</h4>
                <p className="text-gray-400 text-sm leading-relaxed">B2/20, Saudamini Co-Operative Housing Society,<br/>Paud Road, Kothrud, Pune, (MH) India 411038</p>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/5 backdrop-blur-2xl p-8 md:p-10 rounded-3xl shadow-2xl shadow-indigo-900/20 border border-white/10"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {submitSuccess && (
                <div className="bg-green-500/20 text-green-300 p-4 rounded-lg text-sm border border-green-500/30">
                  {submitSuccess}
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="fullName" className="sr-only">Full Name</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    placeholder="Full Name *"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/5 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 outline-none transition-colors text-white placeholder-gray-400"
                  />
                </div>
                <div>
                  <label htmlFor="mobileNo" className="sr-only">Mobile No.</label>
                  <input
                    type="tel"
                    id="mobileNo"
                    name="mobileNo"
                    placeholder="Mobile No. *"
                    required
                    value={formData.mobileNo}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/5 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 outline-none transition-colors text-white placeholder-gray-400"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="emailId" className="sr-only">Email Id</label>
                <input
                  type="email"
                  id="emailId"
                  name="emailId"
                  placeholder="Email Address *"
                  required
                  value={formData.emailId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/5 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 outline-none transition-colors text-white placeholder-gray-400"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="organisation" className="sr-only">Organisation</label>
                  <input
                    type="text"
                    id="organisation"
                    name="organisation"
                    placeholder="Organisation"
                    value={formData.organisation}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/5 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 outline-none transition-colors text-white placeholder-gray-400"
                  />
                </div>
                <div>
                  <label htmlFor="designation" className="sr-only">Designation</label>
                  <input
                    type="text"
                    id="designation"
                    name="designation"
                    placeholder="Designation"
                    value={formData.designation}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/5 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 outline-none transition-colors text-white placeholder-gray-400"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="message" className="sr-only">Message</label>
                <textarea
                  id="message"
                  name="message"
                  placeholder="How can we help you? *"
                  required
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/5 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 outline-none transition-colors text-white placeholder-gray-400 resize-none"
                />
              </div>
              
              {/* Captcha representation */}
              <div className="flex flex-col gap-3 w-full sm:w-[60%]">
                <label htmlFor="captchaInput" className="text-sm font-medium text-gray-300">
                  Security Check *
                </label>
                <div className="flex gap-4 items-center">
                  <div className="relative select-none bg-white/10 px-6 py-3 rounded-lg border border-white/20 overflow-hidden font-mono text-3xl tracking-widest font-bold text-white shadow-inner flex-1 text-center">
                    {/* Noise background */}
                    <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '8px 8px', opacity: 0.15 }}></div>
                    {/* Strike-through lines */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none">
                      <div className="w-[120%] h-[3px] bg-white transform -rotate-6"></div>
                      <div className="w-[120%] h-[1px] bg-white transform rotate-3 absolute"></div>
                    </div>
                    <span className="relative z-10 drop-shadow-md">{captchaText}</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setCaptchaText(generateCaptchaString())}
                    className="p-3 h-full bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors text-blue-400 shrink-0"
                    title="Refresh Captcha"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
                <input 
                  type="text"
                  id="captchaInput"
                  required
                  value={userCaptcha}
                  onChange={(e) => setUserCaptcha(e.target.value)}
                  placeholder="Enter the code shown above"
                  className={`w-full px-4 py-3 rounded-xl border bg-white/5 focus:ring-2 outline-none transition-colors text-white placeholder-gray-400 ${captchaError ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30' : 'border-white/20 focus:border-blue-400 focus:ring-blue-400/30'}`}
                />
                {captchaError && <p className="text-red-400 text-xs mt-1">Incorrect code. Please try again.</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/30 disabled:opacity-70 flex justify-center items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  "Send Message"
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
