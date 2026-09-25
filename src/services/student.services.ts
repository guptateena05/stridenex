import { apiService, BASE_DOMAIN } from "./api.services";

/**
 * Internship Application API
 * Endpoint for students to apply for an internship.
 */
export const applyOpportunity = async (data: {
  student: string;
  opportunity_type: string;
  opportunity_name: string;
  notes?: string;
  expected_salary?: string;
}) => {
  try {
    const response = await apiService.post(
      "method/stridenex_app.stridenex_app.doctype.student_applications.student_applications.apply",
      data
    );
    return response;
  } catch (error) {
    console.error("Error applying for opportunity:", error);
    throw error;
  }
};

export const getStudentApplications = async (params: {
  student: string;
  opportunity_type?: string;
}) => {
  try {
    const response = await apiService.get(
      "method/stridenex_app.stridenex_app.doctype.student_applications.student_applications.get_applications",
      { params }
    );
    return response;
  } catch (error) {
    console.error("Error getting student applications:", error);
    throw error;
  }
};

export const updateApplicationStatus = async (name: string, status: string) => {
  try {
    const response = await apiService.post(
      "method/stridenex_app.stridenex_app.doctype.student_applications.student_applications.update_application_status",
      { name, status }
    );
    return response;
  } catch (error) {
    console.error("Error updating application status:", error);
    throw error;
  }
};

export const createStudentApplication = async (data: any) => {
  try {
    return await applyOpportunity({
      student: data.student,
      opportunity_type: "Internship",
      opportunity_name: data.internship || data.opportunity_name,
      notes: data.notes || "Interested in this internship."
    });
  } catch (error) {
    console.error("Error creating student application:", error);
    throw error;
  }
};

export const createStudentProjectEnrollment = async (data: any) => {
  try {
    return await applyOpportunity({
      student: data.student,
      opportunity_type: "Project",
      opportunity_name: data.project || data.opportunity_name,
      notes: data.notes || "Interested in this project."
    });
  } catch (error) {
    console.error("Error creating student project enrollment:", error);
    throw error;
  }
};

export const mapYearToWord = (year: any): string | null => {
  if (!year) return null;
  const str = String(year).trim().toLowerCase();
  if (str === "1" || str.includes("1st") || str.includes("first")) return "First Year";
  if (str === "2" || str.includes("2nd") || str.includes("second")) return "Second Year";
  if (str === "3" || str.includes("3rd") || str.includes("third")) return "Third Year";
  if (str === "4" || str.includes("4th") || str.includes("final") || str.includes("fourth")) return "Final Year";
  return year;
};

/**
 * Fetch all available internships for students.
 */
export const getStudentInternshipList = async (
  studentEmail?: string | null,
  course?: string | null,
  department?: string | null,
  academicYear?: string | null,
  search?: string,
  workMode?: string | null
) => {
  try {
    let url = "method/stridenex_app.stridenex_app.doctype.internship.internship.get_internship_list";
    const params = new URLSearchParams();

    if (studentEmail) params.append("student", studentEmail);
    params.append("course", course || "null");
    params.append("department", department || "null");

    const yearWord = mapYearToWord(academicYear);
    params.append("current_year", yearWord || "null");

    if (search) {
      params.append("search", search);
    }

    if (workMode && workMode !== "All") {
      params.append("work_mode", workMode.toLowerCase());
    }

    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    const response = await apiService.get(url);
    return response;
  } catch (error) {
    console.error("Error fetching student internship list:", error);
    throw error;
  }
};

/**
 * Fetch all available projects for students.
 */
export const getStudentProjectList = async (
  studentEmail?: string,
  course?: string | null,
  department?: string | null,
  academicYear?: string | null,
  search?: string
) => {
  try {
    let url = "method/stridenex_app.stridenex_app.doctype.industry_project.industry_project.get_project_list";
    const params = new URLSearchParams();

    if (studentEmail) params.append("student", studentEmail);
    params.append("course", course || "null");
    params.append("department", department || "null");

    const yearWord = mapYearToWord(academicYear);
    params.append("current_year", yearWord || "null");

    if (search) {
      params.append("search", search);
    }

    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    const response = await apiService.get(url);
    return response;
  } catch (error) {
    console.error("Error fetching student project list:", error);
    throw error;
  }
};

/**
 * Fetch master data for a specific doctype.
 */
export const getMasterData = async (doctype: string, additionalPayload: any = {}) => {
  try {
    const payload = {
      doctype,
      page: additionalPayload.page !== undefined ? additionalPayload.page : 1,
      search: additionalPayload.search !== undefined ? additionalPayload.search : "",
      ...additionalPayload
    };
    const response = await apiService.post(
      "method/stridenex_app.api_stridenex_app.college.master.get_master_data",
      payload
    );
    let arr = [];
    if (response?.data && response?.data?.data && Array.isArray(response?.data?.data)) {
      arr = response.data.data;
    } else if (response?.data && Array.isArray(response?.data)) {
      arr = response.data;
    } else if (response?.message && Array.isArray(response?.message)) {
      arr = response.message;
    } else if (response?.message && response?.message?.data && Array.isArray(response?.message?.data)) {
      arr = response.message.data;
    }
    return { data: arr, message: arr, pagination: response?.data?.pagination || response?.message?.pagination };
  } catch (error) {
    console.error(`Error fetching master data for ${doctype}:`, error);
    throw error;
  }
};

/**
 * Fetch mentor list for students.
 */
export const getMentorList = async (page: number = 1, page_size: number = 20, search?: string) => {
  try {
    const params = new URLSearchParams();
    params.append("page", String(page));
    params.append("page_size", String(page_size));
    if (search) {
      params.append("search", search);
    }
    const response = await apiService.get(
      `method/stridenex_app.api_stridenex_app.mentor.mentor.get_mentor_list?${params.toString()}`
    );
    return response;
  } catch (error) {
    console.error("Error fetching mentor list:", error);
    throw error;
  }
};

/**
 * Fetch mentor slot calendar.
 */
export const getMentorSlotCalendar = async (mentorEmail: string, offeringName: string) => {
  try {
    const response = await apiService.post(
      "method/stridenex_app.stridenex_app.doctype.mentor_session_booking.mentor_session_booking.get_slot_calendar",
      { mentor: mentorEmail, offering: offeringName }
    );
    return response;
  } catch (error) {
    console.error("Error fetching mentor slot calendar:", error);
    throw error;
  }
};

/**
 * Book a mentor slot.
 */
export const bookMentorSlot = async (data: Record<string, string>) => {
  try {
    const queryString = new URLSearchParams(data).toString();
    const url = `method/stridenex_app.stridenex_app.doctype.mentor_session_booking.mentor_session_booking.book_slot?${queryString}`;

    const response = await apiService.get(url);
    return response;
  } catch (error) {
    console.error("Error booking mentor slot:", error);
    throw error;
  }
};
/**
 * Fetch the next available slot for a mentor.
 */
export const getMentorNextAvailableSlot = async (mentorEmail: string) => {
  try {
    const response = await apiService.post(
      "method/stridenex_app.stridenex_app.doctype.mentor_offering.mentor_offering._get_next_available_slot",
      { mentor: mentorEmail }
    );
    return response;
  } catch (error) {
    console.error("Error fetching mentor next available slot:", error);
    throw error;
  }
};
/**
 * Fetch skill ledger summary for a student.
 */
export const getSkillLedger = async (studentEmail: string) => {
  try {
    const response = await apiService.post(
      "method/nexedu.skill_ledger.doctype.student_skill.student_skill.get_skill_ledger",
      { student: studentEmail }
    );
    return response;
  } catch (error) {
    console.error("Error fetching skill ledger:", error);
    throw error;
  }
};

/**
 * Fetch employability score for a student.
 */
export const getEmployabilityScore = async (studentEmail: string) => {
  try {
    const response = await apiService.post(
      "method/nexedu.skill_ledger.doctype.student_skill.student_skill.get_employability_score",
      { student: studentEmail }
    );
    return response;
  } catch (error) {
    console.error("Error fetching employability score:", error);
    throw error;
  }
};
/**
 * Create a group session booking.
 */
export const createGroupSessionBooking = async (data: any) => {
  try {
    const response = await apiService.post(
      "method/stridenex_app.stridenex_app.doctype.mentor_session_booking.mentor_session_booking.create_group_session_booking",
      data
    );
    return response;
  } catch (error) {
    console.error("Error creating group session booking:", error);
    throw error;
  }
};

/**
 * Fetch student details by email.
 */
export const getStudentByEmail = async (emailId: string) => {
  try {
    const response = await apiService.get(
      `method/stridenex_app.api_stridenex_app.student.student.get_student_by_email?email_id=${encodeURIComponent(emailId)}`
    );
    return response;
  } catch (error) {
    console.error("Error fetching student by email:", error);
    throw error;
  }
};
/**
 * Format mobile number to standard "+CountryCode-PhoneNumber" (like +91-7656787656)
 */
export const formatMobileNumber = (mobileNo: string): string => {
  if (!mobileNo) return "";
  let cleaned = String(mobileNo).trim();

  // If already in the format "+XX-XXXXXXXXXX" or similar (+country_code-number)
  if (/^\+\d+-\d+$/.test(cleaned)) {
    return cleaned;
  }

  // Remove all non-digit characters except the leading "+" if present
  const hasPlus = cleaned.startsWith("+");
  let digits = cleaned.replace(/\D/g, "");

  if (hasPlus) {
    if (digits.startsWith("91")) {
      const rest = digits.substring(2);
      return `+91-${rest}`;
    } else {
      if (digits.length === 11) {
        return `+${digits.substring(0, 1)}-${digits.substring(1)}`;
      } else if (digits.length === 12) {
        return `+${digits.substring(0, 2)}-${digits.substring(2)}`;
      } else if (digits.length === 13) {
        return `+${digits.substring(0, 3)}-${digits.substring(3)}`;
      }
      return `+${digits}`;
    }
  } else {
    if (digits.startsWith("91") && digits.length === 12) {
      return `+91-${digits.substring(2)}`;
    }
    if (digits.length === 10) {
      return `+91-${digits}`;
    }
    return `+91-${digits}`;
  }
};

/**
 * Update student details.
 */
export const updateStudent = async (emailId: string, data: any) => {
  try {
    const formattedData = { ...data };
    if (formattedData.mobile_no) {
      formattedData.mobile_no = formatMobileNumber(formattedData.mobile_no);
    }
    const response = await apiService.post(
      `method/stridenex_app.api_stridenex_app.student.student.update_student?email_id=${encodeURIComponent(emailId)}`,
      formattedData
    );
    return response;
  } catch (error) {
    console.error("Error updating student:", error);
    throw error;
  }
};
/**
 * Create a student event registration.
 */
export const createStudentEventRegistration = async (data: any) => {
  try {
    const response = await apiService.post(
      "method/stridenex_app.stridenex_app.doctype.student_event_registeration.student_event_registeration.create_student_event_registeration",
      data
    );
    return response;
  } catch (error) {
    console.error("Error creating student event registration:", error);
    throw error;
  }
};

/**
 * Fetch college event list for a specific college and student.
 */
export const getCollegeEventList = async (college: string, studentEmail: string) => {
  try {
    const response = await apiService.get(
      `method/stridenex_app.stridenex_app.doctype.college_event.college_event.get_college_event_list?college=${encodeURIComponent(college)}&student=${encodeURIComponent(studentEmail)}`
    );
    return response;
  } catch (error) {
    console.error("Error fetching college event list:", error);
    throw error;
  }
};

/**
 * Create a new student skill.
 */
export const createStudentSkill = async (data: any) => {
  try {
    const response = await apiService.post(
      "method/nexedu.skill_ledger.doctype.student_skill.student_skill.create_student_skill",
      { data }
    );
    return response;
  } catch (error) {
    console.error("Error creating student skill:", error);
    throw error;
  }
};

/**
 * Add skill evidence for a student.
 */
export const addSkillEvidence = async (data: any) => {
  try {
    const response = await apiService.post(
      "method/nexedu.skill_ledger.doctype.skill_evidence.skill_evidence.add_evidence",
      data
    );
    return response;
  } catch (error) {
    console.error("Error adding skill evidence:", error);
    throw error;
  }
};

/**
 * Fetch student habits dashboard.
 */
export const getStudentDashboardHabits = async (studentEmail: string) => {
  try {
    const response = await apiService.post(
      "method/nexedu.habits_builder.api.get_student_dashboard",
      { student: studentEmail }
    );
    return response;
  } catch (error) {
    console.error("Error fetching student habits dashboard:", error);
    throw error;
  }
};

/**
 * Log daily habits.
 */
export const logDailyHabits = async (data: any) => {
  try {
    const response = await apiService.post(
      "method/nexedu.habits_builder.api.log_daily_habits",
      data
    );
    return response;
  } catch (error) {
    console.error("Error logging daily habits:", error);
    throw error;
  }
};

/**
 * Update habit log status.
 */
export const updateLogStatus = async (logName: string, status: string) => {
  try {
    const response = await apiService.post(
      "method/nexedu.habits_builder.api.update_log_status",
      { log_name: logName, status }
    );
    return response;
  } catch (error) {
    console.error("Error updating log status:", error);
    throw error;
  }
};

/**
 * Create a new habit plan.
 */
export const createHabitPlan = async (data: any) => {
  try {
    const response = await apiService.post(
      "method/nexedu.habits_builder.api.create_habit_plan",
      data
    );
    return response;
  } catch (error) {
    console.error("Error creating habit plan:", error);
    throw error;
  }
};

/**
 * Fetch student habit plans.
 */
export const getStudentPlans = async (studentEmail: string, status?: string) => {
  try {
    const payload: any = { student: studentEmail };
    if (status) payload.status = status;
    const response = await apiService.post(
      "method/nexedu.habits_builder.api.get_student_plans",
      payload
    );
    return response;
  } catch (error) {
    console.error("Error fetching student plans:", error);
    throw error;
  }
};

/**
 * Fetch habit streaks for a student.
 */
export const getHabitStreaks = async (studentEmail: string) => {
  try {
    const response = await apiService.post(
      "method/nexedu.habits_builder.api.get_habit_streaks",
      { student: studentEmail }
    );
    return response;
  } catch (error) {
    console.error("Error fetching habit streaks:", error);
    throw error;
  }
};

/**
 * Fetch habit history.
 */
export const getHabitHistory = async (studentEmail: string, habit: string, days: number = 30) => {
  try {
    const response = await apiService.post(
      "method/nexedu.habits_builder.api.get_habit_history",
      { student: studentEmail, habit, days }
    );
    return response;
  } catch (error) {
    console.error("Error fetching habit history:", error);
    throw error;
  }
};

/**
 * Fetch today's pending habits.
 */
export const getTodaysPendingHabits = async (studentEmail: string) => {
  try {
    const response = await apiService.post(
      "method/nexedu.habits_builder.api.get_todays_pending_habits",
      { student: studentEmail }
    );
    return response;
  } catch (error) {
    console.error("Error fetching today's pending habits:", error);
    throw error;
  }
};

/**
 * Fetch habit plan summary.
 */
export const getPlanSummary = async (planName: string) => {
  try {
    const response = await apiService.post(
      "method/nexedu.habits_builder.api.get_plan_summary",
      { plan_name: planName }
    );
    return response;
  } catch (error) {
    console.error("Error fetching plan summary:", error);
    throw error;
  }
};

/**
 * Complete habit plan status.
 */
export const completeHabitPlanStatus = async (planName: string, habitName: string, student: string) => {
  try {
    const response = await apiService.post(
      "method/nexedu.habits_builder.api.complete_habit_plan_status",
      {
        plan_name: planName,
        habit_name: habitName,
        student: student
      }
    );
    return response;
  } catch (error) {
    console.error("Error completing habit plan status:", error);
    throw error;
  }
};

/**
 * Delete habit plan.
 */
export const deleteHabitPlan = async (planName: string, habitName: string, student: string) => {
  try {
    const response = await apiService.post(
      "method/nexedu.habits_builder.api.delete_habit_plan",
      {
        plan_name: planName,
        habit_name: habitName,
        student: student
      }
    );
    return response;
  } catch (error) {
    console.error("Error deleting habit plan:", error);
    throw error;
  }
};

/**
 * Fetch student badges (earned and locked).
 */
export const getStudentBadges = async (studentEmail: string) => {
  try {
    const response = await apiService.get(
      `method/nexedu.habits_builder.api.get_student_badges?student=${encodeURIComponent(studentEmail)}`
    );
    return response?.message || response;
  } catch (error) {
    console.error("Error fetching student badges:", error);
    throw error;
  }
};

/**
 * Share earned badge on LinkedIn.
 */
export const shareBadgeOnLinkedIn = async (studentEmail: string, badgeId: string) => {
  try {
    const response = await apiService.post(
      "method/nexedu.habits_builder.api.share_badge_on_linkedin",
      { student: studentEmail, badge_id: badgeId }
    );
    return response;
  } catch (error) {
    console.error("Error sharing badge on LinkedIn:", error);
    throw error;
  }
};

/**
 * Fetch habit completion heatmap for a student (GitHub-style activity grid).
 */
export const getHabitCompletionHeatmap = async (studentEmail: string, year?: number) => {
  try {
    const params = new URLSearchParams({ student: studentEmail });
    if (year) params.append("year", String(year));
    const response = await apiService.get(
      `method/nexedu.habits_builder.api.get_habit_completion_heatmap?${params.toString()}`
    );
    return response?.message || response;
  } catch (error) {
    console.error("Error fetching habit completion heatmap:", error);
    throw error;
  }
};


export const getBookedSessions = async (studentEmail: string) => {
  try {
    const response = await apiService.get(
      `method/stridenex_app.stridenex_app.doctype.mentor_session_booking.mentor_session_booking.get_booked_sessions?student_email=${encodeURIComponent(studentEmail)}`
    );
    return response;
  } catch (error) {
    console.error("Error fetching booked sessions:", error);
    throw error;
  }
};

/**
 * Fetch shared session notes for a booking.
 */
export const getSessionNote = async (sessionName: string, studentEmail: string) => {
  try {
    const response = await apiService.get(
      `method/stridenex_app.stridenex_app.doctype.mentor_session_booking.mentor_session_booking.get_session_note?session_name=${encodeURIComponent(sessionName)}&student=${encodeURIComponent(studentEmail)}`
    );
    return response;
  } catch (error) {
    console.error("Error fetching session note:", error);
    throw error;
  }
};


/**
 * Fetch group session and workshop offerings.
 */
export const getNewGroupWorkshopOfferings = async (params: {
  offering_type?: string;
  search?: string;
}) => {
  try {
    const response = await apiService.get(
      "method/stridenex_app.stridenex_app.doctype.mentor_offering.mentor_offering.get_new_group_workshop_offerings",
      { params }
    );
    return response;
  } catch (error) {
    console.error("Error fetching group/workshop offerings:", error);
    throw error;
  }
};

/**
 * Fetch billing packages for a user by email.
 */
export const getUserPackages = async (email: string) => {
  try {
    const response = await apiService.get(
      `method/quantbit_billing_platform.quantbit_billing_platform.api.get_user_packages?email=${encodeURIComponent(email)}`
    );
    return response;
  } catch (error) {
    console.error("Error fetching user packages:", error);
    throw error;
  }
};
/**
 * Fetch mentor offerings list.
 */
export const getMentorOfferings = async (mentorEmail: string) => {
  try {
    const response = await apiService.get(
      `method/stridenex_app.stridenex_app.doctype.mentor_offering.mentor_offering.get_mentor_offerings?mentor=${encodeURIComponent(mentorEmail)}`
    );
    return response;
  } catch (error) {
    console.error("Error fetching mentor offerings:", error);
    throw error;
  }
};

/**
 * Fetch package remaining days for a user.
 */
export const getPackageRemainingDays = async (user: string) => {
  try {
    const response = await apiService.get(
      `method/quantbit_billing_platform.quantbit_billing_platform.api.get_remaining_days?user=${encodeURIComponent(user)}`
    );
    return response;
  } catch (error) {
    console.error("Error fetching package remaining days:", error);
    throw error;
  }
};

/**
 * Fetch skill test questions.
 */
export const getSkillTestQuestions = async (student: string, skill: string, level: string) => {
  try {
    const response = await apiService.get(
      `method/nexedu.api.skill_assessment_ai.get_skill_test_questions?student=${encodeURIComponent(student)}&skill=${encodeURIComponent(skill)}&level=${encodeURIComponent(level)}`
    );
    return response;
  } catch (error) {
    console.error("Error fetching skill test questions:", error);
    throw error;
  }
};

/**
 * Submit skill test.
 */
export const submitSkillTest = async (payload: {
  student: string;
  skill: string;
  level: string;
  answers: Record<string, string>;
}) => {
  try {
    const response = await apiService.post(
      "method/nexedu.api.skill_assessment_ai.submit_skill_test",
      payload
    );
    return response;
  } catch (error) {
    console.error("Error submitting skill test:", error);
    throw error;
  }
};

/**
 * Fetch student career path.
 */
export const getStudentCareerPath = async (studentEmail: string) => {
  try {
    const response = await apiService.get(
      `method/nexedu.path_finder.app_api.get_student_career_path?student=${encodeURIComponent(studentEmail)}`
    );
    return response;
  } catch (error) {
    console.error("Error fetching student career path:", error);
    throw error;
  }
};

/**
 * Fetch all available career paths in the system.
 */
export const getAllCareerPaths = async (searchQuery?: string, page: number = 1, pageLength: number = 20) => {
  try {
    const response = await apiService.get(
      "method/nexedu.path_finder.app_api.get_all_career_paths",
      {
        params: {
          search_query: searchQuery || undefined,
          page,
          page_length: pageLength
        }
      }
    );
    return response;
  } catch (error) {
    console.error("Error fetching all career paths:", error);
    throw error;
  }
};

/**
 * Fetch recommended paths.
 */
export const getRecommendedPaths = async (studentEmail: string) => {
  try {
    const response = await apiService.get(
      `method/nexedu.path_finder.app_api.get_recommended_paths?student=${encodeURIComponent(studentEmail)}`
    );
    return response;
  } catch (error) {
    console.error("Error fetching recommended paths:", error);
    throw error;
  }
};

/**
 * Enroll student in a career path.
 */
/**
 * Get career path quota status
 */
export const getCareerPathQuotaStatus = async (studentEmail: string) => {
  try {
    const response = await apiService.get(
      `method/nexedu.path_finder.app_api.get_career_path_quota_status?student=${encodeURIComponent(studentEmail)}`
    );
    return response;
  } catch (error) {
    console.error("Error fetching career path quota status:", error);
    throw error;
  }
};

export const enrollStudentPath = async (
  studentEmail: string,
  careerPath: string,
  pathGenerationMode?: string
) => {
  try {
    const response = await apiService.post(
      "method/nexedu.path_finder.api.path_enrollment.enroll_student",
      {
        student: studentEmail,
        career_path: careerPath,
        path_generation_mode: pathGenerationMode,
        roadmap_source: pathGenerationMode
      }
    );
    return response;
  } catch (error) {
    console.error("Error enrolling student path:", error);
    throw error;
  }
};

/**
 * Delete student enrollment if it was paused/failed.
 */
export const deleteStudentEnrollment = async (enrollment: string) => {
  try {
    const response = await apiService.post(
      "method/nexedu.path_finder.api.path_enrollment.delete_student_enrollment",
      { enrollment }
    );
    return response;
  } catch (error) {
    console.error("Error deleting student enrollment:", error);
    throw error;
  }
};

/**
 * Get career path detail.
 */
export const getCareerPathDetail = async (careerPath: string, studentEmail?: string) => {
  try {
    const student = studentEmail || localStorage.getItem("currentUser") || "ac1@gmail.com";
    const response = await apiService.get(
      `method/nexedu.path_finder.api.path_enrollment.get_career_path_detail`,
      {
        params: {
          career_path: careerPath,
          student: student
        }
      }
    );
    return response;
  } catch (error) {
    console.error("Error getting career path detail:", error);
    throw error;
  }
};

/**
 * Get career recommendations.
 */
export const getCareerRecommendations = async (params: any) => {
  try {
    const response = await apiService.post(
      "method/job_search_ai.api.career_trends.get_career_trends",
      params
    );
    return response;
  } catch (error) {
    console.error("Error getting career recommendations:", error);
    throw error;
  }
};

/**
 * Get hierarchy skills for a path.
 */
export const getHierarchySkillsForPath = async (careerPath: string) => {
  try {
    const response = await apiService.get(
      `method/nexedu.path_finder.api.path_enrollment.get_hierarchy_skills_for_path`,
      {
        params: {
          career_path: careerPath
        }
      }
    );
    return response;
  } catch (error) {
    console.error("Error getting hierarchy skills for path:", error);
    throw error;
  }
};

/**
 * Log milestone progress.
 */
export const logMilestoneProgress = async (
  enrollmentId: string,
  milestoneRowName: string,
  score?: number,
  aiFeedback?: string,
  evidence?: string
) => {
  try {
    const response = await apiService.post(
      "method/nexedu.path_finder.api.path_enrollment.log_milestone_progress",
      {
        enrollment: enrollmentId,
        milestone_row_name: milestoneRowName,
        score,
        ai_feedback: aiFeedback,
        evidence
      }
    );
    return response;
  } catch (error) {
    console.error("Error logging milestone progress:", error);
    throw error;
  }
};

export const getCertificate = async (payload: {
  student_name: string;
  assessment_name: string;
  sr_no: number;
  email_id: string;
}) => {
  try {
    const response = await apiService.post(
      "method/stridenex_app.api_stridenex_app.app.get_certificate",
      payload
    );
    return response;
  } catch (error) {
    console.error("Error getting certificate:", error);
    throw error;
  }
};


export const initiateSessionBooking = async (payload: any): Promise<any> => {
  try {
    const response = await fetch(
      `${BASE_DOMAIN}/api/method/quantbit_billing_platform.quantbit_billing_platform.api.initiate_session_booking`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({ payload: JSON.stringify(payload) }),
      }
    );

    const data = await response.json();

    if (!response.ok) {

      let errMsg = `Server error ${response.status}`;
      try {
        if (data?._server_messages) {
          const msgs = typeof data._server_messages === "string"
            ? JSON.parse(data._server_messages)
            : data._server_messages;
          if (Array.isArray(msgs) && msgs.length > 0) {
            const msgObj = typeof msgs[0] === "string" ? JSON.parse(msgs[0]) : msgs[0];
            errMsg = msgObj?.message ?? errMsg;
          }
        } else if (data?.message) {
          errMsg = data.message;
        } else if (data?.exception) {
          const exc = String(data.exception);
          const idx = exc.indexOf(":");
          errMsg = idx !== -1 ? exc.slice(idx + 1).trim() : exc;
        }
      } catch (_) {
      }
      throw new Error(errMsg);
    }

    return data;
  } catch (error) {
    console.error("Error initiating session booking:", error);
    throw error;
  }
};

export const verifySessionPayment = async (payload: {
  booking_id: string;
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}): Promise<any> => {
  try {
    const response = await apiService.post(
      "method/quantbit_billing_platform.quantbit_billing_platform.api.verify_session_payment",
      payload
    );
    return response;
  } catch (error) {
    console.error("Error verifying session payment:", error);
    throw error;
  }
};

/**
 * Fetch all success stories.
 */
export const getSuccessStories = async (): Promise<any> => {
  try {
    const response = await apiService.get(
      "method/stridenex_app.stridenex_app.doctype.success_story.success_story.get_success_stories"
    );
    return response;
  } catch (error) {
    console.error("Error fetching success stories:", error);
    throw error;
  }
};

/**
 * Create a new success story.
 */
export const createSuccessStory = async (data: any): Promise<any> => {
  try {
    const response = await apiService.post(
      "method/stridenex_app.stridenex_app.doctype.success_story.success_story.create_success_story",
      data
    );
    return response;
  } catch (error) {
    console.error("Error creating success story:", error);
    throw error;
  }
};

/**
 * Fetch educational shorts feed.
 */
export const getShortsFeed = async (userEmail?: string): Promise<any> => {
  try {
    const apiKey = typeof window !== "undefined" ? localStorage.getItem("apiKey") : null;
    const apiSecret = typeof window !== "undefined" ? localStorage.getItem("apiSecret") : null;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey && apiSecret) {
      headers["Authorization"] = `token ${apiKey}:${apiSecret}`;
    }

    const response = await apiService.get(
      "method/stridenex_app.stridenex_app.doctype.educational_short.educational_short.get_shorts_feed",
      {
        params: userEmail ? { user: userEmail } : {},
        headers
      }
    );
    return response;
  } catch (error) {
    console.error("Error fetching shorts feed:", error);
    throw error;
  }
};

/**
 * Save an educational short.
 */
export const saveShort = async (payload: { user: string; short_name: string }): Promise<any> => {
  try {
    const apiKey = typeof window !== "undefined" ? localStorage.getItem("apiKey") : null;
    const apiSecret = typeof window !== "undefined" ? localStorage.getItem("apiSecret") : null;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey && apiSecret) {
      headers["Authorization"] = `token ${apiKey}:${apiSecret}`;
    }

    const response = await apiService.post(
      "method/stridenex_app.stridenex_app.doctype.educational_short.educational_short.save_short",
      payload,
      { headers }
    );
    return response;
  } catch (error) {
    console.error("Error saving short:", error);
    throw error;
  }
};

/**
 * Unsave an educational short.
 */
export const unsaveShort = async (payload: { user: string; short_name: string }): Promise<any> => {
  try {
    const apiKey = typeof window !== "undefined" ? localStorage.getItem("apiKey") : null;
    const apiSecret = typeof window !== "undefined" ? localStorage.getItem("apiSecret") : null;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey && apiSecret) {
      headers["Authorization"] = `token ${apiKey}:${apiSecret}`;
    }

    const response = await apiService.post(
      "method/stridenex_app.stridenex_app.doctype.educational_short.educational_short.unsave_short",
      payload,
      { headers }
    );
    return response;
  } catch (error) {
    console.error("Error unsaving short:", error);
    throw error;
  }
};

/**
 * Toggle like status of an educational short.
 */
export const toggleLikeShort = async (payload: { short: string }): Promise<any> => {
  try {
    const apiKey = typeof window !== "undefined" ? localStorage.getItem("apiKey") : null;
    const apiSecret = typeof window !== "undefined" ? localStorage.getItem("apiSecret") : null;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey && apiSecret) {
      headers["Authorization"] = `token ${apiKey}:${apiSecret}`;
    }

    const response = await apiService.post(
      "method/stridenex_app.stridenex_app.doctype.educational_short.educational_short.toggle_like",
      payload,
      { headers }
    );
    return response;
  } catch (error) {
    console.error("Error toggling like:", error);
    throw error;
  }
};

/**
 * Fetch saved educational shorts.
 */
export const getSavedShorts = async (userEmail: string): Promise<any> => {
  try {
    const apiKey = typeof window !== "undefined" ? localStorage.getItem("apiKey") : null;
    const apiSecret = typeof window !== "undefined" ? localStorage.getItem("apiSecret") : null;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey && apiSecret) {
      headers["Authorization"] = `token ${apiKey}:${apiSecret}`;
    }

    const response = await apiService.get(
      "method/stridenex_app.stridenex_app.doctype.educational_short.educational_short.get_saved_shorts",
      {
        params: { user: userEmail },
        headers
      }
    );
    return response;
  } catch (error) {
    console.error("Error fetching saved shorts:", error);
    throw error;
  }
};

/**
 * Add a comment or reply on an educational short video.
 * Endpoint: method/stridenex_app.stridenex_app.doctype.short_comment.short_comment.add_comment
 */
export const addShortComment = async (payload: { short: string; content: string; parent_comment?: string }): Promise<any> => {
  try {
    const apiKey = typeof window !== "undefined" ? localStorage.getItem("apiKey") : null;
    const apiSecret = typeof window !== "undefined" ? localStorage.getItem("apiSecret") : null;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey && apiSecret) {
      headers["Authorization"] = `token ${apiKey}:${apiSecret}`;
    }

    const response = await apiService.post(
      "method/stridenex_app.stridenex_app.doctype.short_comment.short_comment.add_comment",
      {
        short: payload.short,
        content: payload.content,
        parent_comment: payload.parent_comment || ""
      },
      { headers }
    );
    return response;
  } catch (error) {
    console.error("Error adding short comment:", error);
    throw error;
  }
};

/**
 * Fetch comments for an educational short video.
 * Endpoint: method/stridenex_app.stridenex_app.doctype.short_comment.short_comment.get_comments
 */
export const getShortComments = async (shortId: string): Promise<any> => {
  try {
    const apiKey = typeof window !== "undefined" ? localStorage.getItem("apiKey") : null;
    const apiSecret = typeof window !== "undefined" ? localStorage.getItem("apiSecret") : null;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey && apiSecret) {
      headers["Authorization"] = `token ${apiKey}:${apiSecret}`;
    }

    const response = await apiService.post(
      "method/stridenex_app.stridenex_app.doctype.short_comment.short_comment.get_comments",
      { short: shortId },
      { headers }
    );
    return response;
  } catch (error) {
    console.error("Error fetching short comments:", error);
    throw error;
  }
};

/**
 * Toggle like/unlike on a short comment.
 * Endpoint: method/stridenex_app.stridenex_app.doctype.short_comment.short_comment.toggle_like
 */
export const toggleLikeComment = async (payload: { comment: string }): Promise<any> => {
  try {
    const apiKey = typeof window !== "undefined" ? localStorage.getItem("apiKey") : null;
    const apiSecret = typeof window !== "undefined" ? localStorage.getItem("apiSecret") : null;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey && apiSecret) {
      headers["Authorization"] = `token ${apiKey}:${apiSecret}`;
    }

    const response = await apiService.post(
      "method/stridenex_app.stridenex_app.doctype.short_comment.short_comment.toggle_like",
      payload,
      { headers }
    );
    return response;
  } catch (error) {
    console.error("Error toggling short comment like:", error);
    throw error;
  }
};



/**
 * Fetch student skills snapshot.
 */
export const getStudentSkills = async (studentEmail: string): Promise<any> => {
  try {
    const apiKey = typeof window !== "undefined" ? localStorage.getItem("apiKey") : null;
    const apiSecret = typeof window !== "undefined" ? localStorage.getItem("apiSecret") : null;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey && apiSecret) {
      headers["Authorization"] = `token ${apiKey}:${apiSecret}`;
    }

    const response = await apiService.get(
      "method/stridenex_app.stridenex_app.doctype.student.student.get_student_skills",
      {
        params: { student: studentEmail },
        headers
      }
    );
    return response;
  } catch (error) {
    console.error("Error fetching student skills:", error);
    throw error;
  }
};

/**
 * Fetch student dashboard metrics / stats.
 */
export const getDashboardStats = async (studentEmail: string): Promise<any> => {
  try {
    const apiKey = typeof window !== "undefined" ? localStorage.getItem("apiKey") : null;
    const apiSecret = typeof window !== "undefined" ? localStorage.getItem("apiSecret") : null;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey && apiSecret) {
      headers["Authorization"] = `token ${apiKey}:${apiSecret}`;
    }

    const response = await apiService.get(
      "method/stridenex_app.stridenex_app.doctype.student.student.get_dashboard_stats",
      {
        params: { student: studentEmail },
        headers
      }
    );
    return response;
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
};

/**
 * Fetch all educational tags.
 */
export const getTags = async (): Promise<any> => {
  try {
    const apiKey = typeof window !== "undefined" ? localStorage.getItem("apiKey") : null;
    const apiSecret = typeof window !== "undefined" ? localStorage.getItem("apiSecret") : null;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey && apiSecret) {
      headers["Authorization"] = `token ${apiKey}:${apiSecret}`;
    }

    const response = await apiService.get(
      "method/stridenex_app.stridenex_app.doctype.educational_short.educational_short.get_tags",
      { headers }
    );
    return response;
  } catch (error) {
    console.error("Error fetching tags:", error);
    throw error;
  }
};

/**
 * Create an educational tag.
 */
export const createTag = async (title: string): Promise<any> => {
  try {
    const apiKey = typeof window !== "undefined" ? localStorage.getItem("apiKey") : null;
    const apiSecret = typeof window !== "undefined" ? localStorage.getItem("apiSecret") : null;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey && apiSecret) {
      headers["Authorization"] = `token ${apiKey}:${apiSecret}`;
    }

    const response = await apiService.post(
      "method/stridenex_app.stridenex_app.doctype.educational_short.educational_short.create_tag",
      { title },
      { headers }
    );
    return response;
  } catch (error) {
    console.warn("Error creating tag:", error);
    throw error;
  }
};

/**
 * Fetch learning activity.
 */
export const getLearningActivity = async (studentEmail: string): Promise<any> => {
  try {
    const apiKey = typeof window !== "undefined" ? localStorage.getItem("apiKey") : null;
    const apiSecret = typeof window !== "undefined" ? localStorage.getItem("apiSecret") : null;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey && apiSecret) {
      headers["Authorization"] = `token ${apiKey}:${apiSecret}`;
    }

    const response = await apiService.get(
      "method/stridenex_app.stridenex_app.doctype.student.student.get_learning_activity",
      {
        params: { student: studentEmail },
        headers
      }
    );
    return response;
  } catch (error) {
    console.error("Error fetching learning activity:", error);
    throw error;
  }
};

/**
 * Fetch today's opportunity alerts.
 */
export const getTodaysOpportunityAlerts = async (studentEmail: string): Promise<any> => {
  try {
    const apiKey = typeof window !== "undefined" ? localStorage.getItem("apiKey") : null;
    const apiSecret = typeof window !== "undefined" ? localStorage.getItem("apiSecret") : null;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey && apiSecret) {
      headers["Authorization"] = `token ${apiKey}:${apiSecret}`;
    }

    const response = await apiService.get(
      "method/stridenex_app.stridenex_app.doctype.student.student.get_todays_opportunity_alerts",
      {
        params: { student: studentEmail },
        headers
      }
    );
    return response;
  } catch (error) {
    console.error("Error fetching today's opportunity alerts:", error);
    throw error;
  }
};

export const getJobProfiles = async (studentEmail?: string, employmentType?: string) => {
  try {
    let url = `method/stridenex_app.stridenex_app.doctype.student_job_applications.student_job_applications.get_job_profile_list`;
    const queryParams = [];
    if (studentEmail) queryParams.push(`student=${encodeURIComponent(studentEmail)}`);
    if (employmentType && employmentType !== "All") queryParams.push(`employment_type=${encodeURIComponent(employmentType)}`);
    
    if (queryParams.length > 0) {
      url += `?${queryParams.join("&")}`;
    }
    const response = await apiService.get(url);
    return response;
  } catch (error) {
    console.error("Error fetching job profiles:", error);
    throw error;
  }
};

export const applyForJob = async (formData: FormData) => {
  try {
    const response = await apiService.post(
      "method/stridenex_app.stridenex_app.doctype.student_job_applications.student_job_applications.apply_for_job",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      }
    );
    return response;
  } catch (error) {
    console.error("Error applying for job:", error);
    throw error;
  }
};

/**
 * Create a new playlist.
 */
export const createPlaylist = async (payload: { student: string; playlist_name: string }): Promise<any> => {
  try {
    const apiKey = typeof window !== "undefined" ? localStorage.getItem("apiKey") : null;
    const apiSecret = typeof window !== "undefined" ? localStorage.getItem("apiSecret") : null;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey && apiSecret) {
      headers["Authorization"] = `token ${apiKey}:${apiSecret}`;
    }

    const response = await apiService.post(
      "method/stridenex_app.stridenex_app.doctype.playlist_shorts.playlist_shorts.create_playlist",
      payload,
      { headers }
    );
    return response;
  } catch (error) {
    console.error("Error creating playlist:", error);
    throw error;
  }
};

/**
 * Save educational short to a playlist.
 */
export const saveShortToPlaylist = async (payload: { playlist: string; shorts: string }): Promise<any> => {
  try {
    const apiKey = typeof window !== "undefined" ? localStorage.getItem("apiKey") : null;
    const apiSecret = typeof window !== "undefined" ? localStorage.getItem("apiSecret") : null;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey && apiSecret) {
      headers["Authorization"] = `token ${apiKey}:${apiSecret}`;
    }

    const url = `method/stridenex_app.stridenex_app.doctype.playlist_shorts.playlist_shorts.save_short_to_playlist?playlist=${encodeURIComponent(payload.playlist)}&shorts=${encodeURIComponent(payload.shorts)}`;

    const response = await apiService.post(
      url,
      payload,
      { headers }
    );
    return response;
  } catch (error) {
    console.error("Error saving short to playlist:", error);
    throw error;
  }
};

/**
 * Fetch playlists for a student.
 */
export const getStudentPlaylists = async (studentEmail: string): Promise<any> => {
  try {
    const apiKey = typeof window !== "undefined" ? localStorage.getItem("apiKey") : null;
    const apiSecret = typeof window !== "undefined" ? localStorage.getItem("apiSecret") : null;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey && apiSecret) {
      headers["Authorization"] = `token ${apiKey}:${apiSecret}`;
    }

    const response = await apiService.get(
      "method/stridenex_app.stridenex_app.doctype.playlist_shorts.playlist_shorts.get_student_playlists",
      {
        params: { student: studentEmail },
        headers
      }
    );
    return response;
  } catch (error) {
    console.error("Error fetching student playlists:", error);
    throw error;
  }
};

export const getCampusDriveList = async (params?: { college?: string, student?: string, required_skill?: string }) => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.college) queryParams.append('college', params.college);
    if (params?.student) queryParams.append('student', params.student);
    if (params?.required_skill) queryParams.append('required_skill', params.required_skill);

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";

    const response = await apiService.get(
      `method/stridenex_app.stridenex_app.doctype.college_campus_drives.college_campus_drives.get_campus_drive_list${queryString}`
    );
    return response;
  } catch (error) {
    console.error("Error fetching campus drives:", error);
    throw error;
  }
};

export const applyCampusDrive = async (data: { student: string, drive: string, remarks?: string }) => {
  try {
    const response = await apiService.post(
      "method/stridenex_app.stridenex_app.doctype.college_campus_drives.college_campus_drives.apply_campus_drive",
      data
    );
    return response;
  } catch (error) {
    console.error("Error applying to campus drive:", error);
    throw error;
  }
};

/**
 * Complete a milestone checklist point.
 */
export const completeMilestonePoint = async (data: {
  enrollment: string;
  milestone_title: string;
  point_title: string;
  completed: boolean;
}) => {
  try {
    const response = await apiService.post(
      "method/nexedu.path_finder.api.path_enrollment.complete_milestone_point",
      data
    );
    return response;
  } catch (error) {
    console.error("Error completing milestone point:", error);
    throw error;
  }
};

/**
 * Get skill verification test result.
 */
export const getSkillTestResult = async (skillTestName: string) => {
  try {
    const response = await apiService.get(
      "method/nexedu.api.skill_assessment_ai.get_skill_test_result",
      {
        params: {
          skill_test_name: skillTestName,
          _t: Date.now()
        },
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
          "Expires": "0"
        }
      }
    );
    return response;
  } catch (error) {
    console.error("Error getting skill test result:", error);
    throw error;
  }
};

/**
 * Fetch guidelines/onboarding steps for student.
 */
export const getStudentGuidelines = async (module: string, tab: string | null, studentEmail: string) => {
  try {
    const params: any = {
      module,
      tab: tab || "",
      student: studentEmail
    };

    const response = await apiService.get(
      "method/stridenex_app.stridenex_app.doctype.student_guidelines.student_guidelines.get_guidelines",
      { params }
    );
    return response;
  } catch (error) {
    console.error("Error fetching student guidelines:", error);
    throw error;
  }
};

/**
 * Complete a student guideline/onboarding step.
 */
export const completeStudentGuidelineStep = async (guidelineName: string, studentEmail: string) => {
  try {
    const response = await apiService.post(
      "method/stridenex_app.stridenex_app.doctype.student_guidelines.student_guidelines.complete_onboarding",
      {
        guideline: guidelineName,
        student: studentEmail
      }
    );
    return response;
  } catch (error) {
    console.error("Error completing student guideline step:", error);
    throw error;
  }
};
/**
 * Fetch all completed paths and acquired skills for a student
 */
export const getCompletedPaths = async (studentEmail: string) => {
  try {
    const response = await apiService.get(
      `method/nexedu.path_finder.api.path_enrollment.get_completed_paths?student=${encodeURIComponent(studentEmail)}`
    );
    return response;
  } catch (error) {
    console.error("Error fetching completed paths:", error);
    throw error;
  }
};
