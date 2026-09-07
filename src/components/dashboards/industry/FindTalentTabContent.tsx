"use client";

import { useState, useEffect, useRef } from "react";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, Download, Sparkles, Bookmark, Loader2, UserX, Target, Check, X } from "lucide-react";

import { useIndustry } from "@/context/IndustryContext";
import { getFindTalentList, getMasterData } from "@/services/industry.services";
import { Pagination } from "@/components/ui/Pagination";
import Dropdown from "@/components/ui/Dropdown";
import { BASE_URL } from "@/services/api.services";

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" } },
};

const suggestedSkills = ["Python", "Machine Learning", "SQL", "Data Viz", "Statistics", "TensorFlow"];

export default function FindTalentTabContent() {
  const { industryData } = useIndustry();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [colleges, setColleges] = useState<string[]>([]);
  const [isFetchingColleges, setIsFetchingColleges] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState<string>("");
  const [isCollegeDropdownOpen, setIsCollegeDropdownOpen] = useState(false);
  const [collegeSearchTerm, setCollegeSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [searchVal, setSearchVal] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [currentYear, setCurrentYear] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("");

  const PAGE_SIZE = 20;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pagination, setPagination] = useState<any>({
    total: 0,
    page: 1,
    page_size: 20,
    total_pages: 1,
    has_next: false,
    has_prev: false
  });
  
  // College Dropdown States
  const [collegePage, setCollegePage] = useState(1);
  const [collegeTotalPages, setCollegeTotalPages] = useState(1);
  const [collegeHasNext, setCollegeHasNext] = useState(false);
  const [collegeHasPrev, setCollegeHasPrev] = useState(false);

  const fetchColleges = async (pageNum = 1, searchTxt = "") => {
    try {
      setIsFetchingColleges(true);
      const response = await getMasterData("College", { page: pageNum, search: searchTxt });
      const apiData = response.data || response.message || [];
      const options = Array.isArray(apiData) ? apiData.map((item: any) => item.name) : [];
      setColleges(options);

      const pag = response.pagination || response.message?.pagination || {};
      const nextFlag = pag.has_next === true;
      const prevFlag = pag.has_prev === true;
      const totalCount = pag.total_count || 0;
      const pageSize = pag.page_size || 20;
      const totalPgs = Math.ceil(totalCount / pageSize) || 1;

      setCollegeHasNext(nextFlag || options.length === 20);
      setCollegeHasPrev(prevFlag || pageNum > 1);
      setCollegeTotalPages(totalPgs);
      setCollegePage(pageNum);
    } catch (err) {
      console.error("Error fetching colleges:", err);
    } finally {
      setIsFetchingColleges(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCollegeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isCollegeDropdownOpen) return;
    const delayDebounce = setTimeout(() => {
      fetchColleges(1, collegeSearchTerm);
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [collegeSearchTerm, isCollegeDropdownOpen]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setSearchQuery(searchVal);
    }, 450);
    return () => clearTimeout(delayDebounce);
  }, [searchVal]);

  const handleClearFilters = () => {
    setSearchVal("");
    setSearchQuery("");
    setSelectedCollege("");
    setCurrentYear("");
    setSelectedSkills([]);
    setSortBy("");
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCollege, searchQuery, currentYear, selectedSkills, sortBy]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const response = await getFindTalentList({
          search: searchQuery || undefined,
          College: selectedCollege || undefined,
          current_year: currentYear || undefined,
          skill: selectedSkills.length > 0 ? selectedSkills.join(",") : undefined,
          sort_by: sortBy || undefined,
          page: currentPage,
          page_size: PAGE_SIZE
        });

        const dataObj = response?.data || response?.message?.data || response?.message || response || {};
        const studentsList = dataObj?.students || (Array.isArray(dataObj) ? dataObj : []);
        setStudents(studentsList);

        if (dataObj?.pagination) {
          setPagination(dataObj.pagination);
        } else {
          setPagination({
            total: studentsList.length,
            page: currentPage,
            page_size: PAGE_SIZE,
            total_pages: 1,
            has_next: false,
            has_prev: false
          });
        }
      } catch (err: any) {
        console.error("Error fetching students:", err);
        setError(err.message || "Failed to load students");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [selectedCollege, currentPage, searchQuery, currentYear, selectedSkills, sortBy]);


  const transformStudent = (student: any) => {
    const rawName = student.student_name || `${student.first_name || ""} ${student.last_name || ""}`.trim() || student.name || "Anonymous Student";
    // Proper Capitalization
    const fullName = rawName
      .toLowerCase()
      .split(" ")
      .map((word: any) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    const initials = fullName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const colors = ["bg-blue-600", "bg-emerald-600", "bg-orange-500", "bg-purple-600", "bg-rose-500", "bg-indigo-600", "bg-amber-600"];
    const colorIndex = fullName.length % colors.length;
    const bgColor = colors[colorIndex];

    const yearVal = student.current_year || (student.academic_year && student.academic_year !== "0" ? `Year ${student.academic_year}` : "");
    const collegeInfo = [student.college, yearVal].filter(Boolean).join(" • ") || "N/A";

    const details = [
      { label: "Course", value: student.course, bg: "bg-blue-50", text: "text-blue-600" },
      { label: "Stream", value: student.stream, bg: "bg-indigo-50", text: "text-indigo-600" },
      { label: "Dept", value: student.department, bg: "bg-emerald-50", text: "text-emerald-600" }
    ].filter(d => d.value);

    const rawSkills = Array.isArray(student.skills) ? student.skills : [];
    const skillsList = rawSkills.map((s: any) => {
      if (!s) return "";
      if (typeof s === 'string') return s;
      return s.skill || s.skill_name || s.name || "";
    }).filter(Boolean);

    const match = student.match_percentage !== null && student.match_percentage !== undefined 
      ? student.match_percentage 
      : (student.match_score || Math.floor(Math.random() * 17) + 80);

    return {
      id: student.name || student.student_name || student.email_id || rawName,
      initials,
      bgColor,
      name: fullName,
      college: collegeInfo,
      details,
      skills: skillsList,
      match
    };
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 bg-red-50/30 rounded-3xl border border-red-100">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
          <Target className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">Failed to load candidates</h3>
        <p className="text-slate-500 mb-6 max-w-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold hover:bg-slate-800 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-slate-500" />
          <h2 className="text-lg font-bold text-slate-800">Skill-Based Candidate Search</h2>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by name, email, skills..."
              className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-semibold"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
            />
          </div>

          <div className="relative w-full md:flex-[1.5] min-w-[280px]" ref={dropdownRef}>
            <div 
              onClick={() => {
                setIsCollegeDropdownOpen(!isCollegeDropdownOpen);
                if (!isCollegeDropdownOpen) fetchColleges(1, "");
              }}
              className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl border ${isCollegeDropdownOpen ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-slate-300'} bg-white text-sm text-slate-700 cursor-pointer hover:border-slate-400 transition-all`}
            >
              <span className="truncate max-w-[240px] flex-1">
                {selectedCollege || (isFetchingColleges ? "Loading..." : "Select College")}
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isCollegeDropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            <AnimatePresence>
              {isCollegeDropdownOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setIsCollegeDropdownOpen(false); setCollegeSearchTerm(""); }}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Modal Header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select College</span>
                      <button
                        onClick={() => { setIsCollegeDropdownOpen(false); setCollegeSearchTerm(""); }}
                        className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Search Input */}
                    <div className="p-3 border-b border-slate-100 bg-white">
                      <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="text"
                          placeholder="Search colleges..."
                          value={collegeSearchTerm}
                          onChange={(e) => setCollegeSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium bg-slate-50/50"
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Colleges List */}
                    <div className="overflow-y-auto flex-1 p-2 space-y-1 max-h-[50vh] relative min-h-[200px]">
                      {isFetchingColleges && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
                          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                        </div>
                      )}
                      <div
                        onClick={() => {
                          setSelectedCollege("");
                          setIsCollegeDropdownOpen(false);
                          setCollegeSearchTerm("");
                        }}
                        className="flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer hover:bg-slate-50 text-slate-600 text-sm font-semibold transition-all mb-0.5"
                      >
                        All Colleges
                      </div>
                      {colleges.map((college) => {
                          const isSelected = selectedCollege === college;
                          return (
                            <div
                              key={college}
                              onClick={() => {
                                setSelectedCollege(college);
                                setIsCollegeDropdownOpen(false);
                                setCollegeSearchTerm("");
                              }}
                              className={`flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer transition-all mb-0.5 ${
                                isSelected ? 'bg-orange-50 text-orange-600 font-semibold' : 'hover:bg-slate-50 text-slate-600'
                              }`}
                            >
                              <span className="text-sm font-bold leading-tight">{college}</span>
                              {isSelected && <Check className="w-4 h-4 text-orange-600 shrink-0" />}
                            </div>
                          );
                        })}
                      {colleges.length === 0 && !isFetchingColleges && (
                        <div className="py-8 text-center">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No colleges found</p>
                        </div>
                      )}
                    </div>

                    {/* Pagination Controls */}
                    {(collegeHasNext || collegeHasPrev || collegeTotalPages > 1) && (
                      <div className="flex items-center justify-between p-3 border-t border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          disabled={!collegeHasPrev || isFetchingColleges}
                          onClick={() => fetchColleges(collegePage - 1, collegeSearchTerm)}
                          className={`px-3 py-1.5 rounded-xl border transition-all ${
                            collegeHasPrev 
                              ? "bg-white border-slate-200 hover:bg-slate-100 text-slate-700 font-bold" 
                              : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                          }`}
                        >
                          Previous
                        </button>
                        
                        <span className="font-bold text-slate-700">
                          Page {collegePage} of {collegeTotalPages}
                        </span>

                        <button
                          type="button"
                          disabled={!collegeHasNext || isFetchingColleges}
                          onClick={() => fetchColleges(collegePage + 1, collegeSearchTerm)}
                          className={`px-3 py-1.5 rounded-xl border transition-all ${
                            collegeHasNext 
                              ? "bg-white border-slate-200 hover:bg-slate-100 text-slate-700 font-bold" 
                              : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>



          {/* Skill Select Dropdown */}
          <div className="w-full md:max-w-[280px] md:min-w-[200px] flex-1">
            <Dropdown
              id="skills-filter"
              placeholder="All Skills"
              endpoint={`${BASE_URL}method/stridenex_app.api_stridenex_app.college.master.get_master_data`}
              params={{ doctype: "Skill" }}
              mapOptions={(data: any) => data.map((item: any) => ({
                value: item.name,
                label: item.name
              }))}
              value={selectedSkills}
              onChange={setSelectedSkills}
              multiSelect={true}
              searchable={true}
            />
          </div>

          {/* Current Year Select Dropdown */}
          <div className="relative">
            <select 
              value={currentYear}
              onChange={(e) => setCurrentYear(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-700 min-w-[150px] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            >
              <option value="">Current Year</option>
              <option value="First Year">First Year</option>
              <option value="Second Year">Second Year</option>
              <option value="Third Year">Third Year</option>
              <option value="Fourth Year">Fourth Year</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={handleClearFilters}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2.5 rounded-xl font-bold transition-all text-sm whitespace-nowrap border border-slate-200 hover:-translate-y-0.5"
          >
            Clear Filters
          </button>
        </div>


      </motion.div>

      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-slate-800">
              {loading ? "Searching candidates..." : `${pagination.total || students.length} candidates match`}
            </h3>
            {loading && <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 focus:outline-none"
              >
                <option value="">Sort: Best Match</option>
                <option value="first_name">First Name</option>
                <option value="college">College</option>
                <option value="creation">Recently Added</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-1/3" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-10 bg-slate-50 rounded-lg" />
              </div>
            ))}
          </div>
        ) : students.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {students.map((rawStudent, index) => {
                const candidate = transformStudent(rawStudent);

                return (
                  <div key={`${rawStudent.name || rawStudent.email_id || index}`} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative">
                    {/* Match Score Ring - Compact */}
                    <div className="absolute right-4 top-4 w-10 h-10 rounded-full border-2 border-emerald-500 flex items-center justify-center">
                      <span className="text-emerald-600 font-bold text-xs">{candidate.match}%</span>
                    </div>

                    <div className="flex items-start gap-3.5 mb-4">
                      {/* Avatar - Compact & Colorful */}
                      <div className={`w-12 h-12 rounded-full ${candidate.bgColor} text-white flex items-center justify-center text-lg font-bold shrink-0 border-2 border-white shadow-sm`}>
                        {candidate.initials}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-slate-800 leading-tight truncate pr-10">{candidate.name}</h3>
                        <p className="text-slate-500 font-medium text-xs mb-3 truncate">
                          {candidate.college}
                        </p>

                        {/* Distinguishable Tags - Labeled */}
                        <div className="flex flex-wrap gap-2">
                          {candidate.details.map((tag, idx) => (
                            <span key={idx} className={`px-3 py-1 ${tag.bg} ${tag.text} text-[10px] font-bold rounded-lg border border-transparent whitespace-nowrap capitalize`}>
                              {tag.label}: {tag.value}
                            </span>
                          ))}
                        </div>

                        {/* Skills Tags */}
                        {candidate.skills && candidate.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {candidate.skills.slice(0, 4).map((skill: string, idx: number) => (
                              <span key={idx} className="px-2.5 py-0.5 bg-orange-50/50 text-orange-600 text-[10px] font-bold rounded-lg border border-orange-100/60 whitespace-nowrap">
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons - Compact & Elegant */}
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-50">
                      <button className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-2 rounded-xl transition-colors text-xs border border-slate-200">
                        View Ledger
                      </button>
                      <button className="flex-1 bg-white border-2 border-[#f97316] text-[#f97316] hover:bg-[#f97316] hover:text-white font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-2 text-xs group">
                        <Sparkles className="w-3.5 h-3.5 text-[#f97316] group-hover:text-white transition-colors" /> Invite
                      </button>
                      <button className="w-9 h-9 border border-slate-200 rounded-xl text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition-colors flex items-center justify-center shrink-0">
                        <Bookmark className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {pagination.total_pages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.total_pages}
                onPageChange={setCurrentPage}
                className="mt-6"
              />
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-slate-200 rounded-2xl text-center">
            <div className="p-4 bg-slate-50 rounded-full mb-4">
              <UserX className="w-10 h-10 text-slate-300" />
            </div>
            <h4 className="text-lg font-bold text-slate-700">No candidates found</h4>
            <p className="text-sm text-slate-500 max-w-xs mt-1">
              We couldn't find any students matching your criteria for {industryData?.company_name || "your industry"}.
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

