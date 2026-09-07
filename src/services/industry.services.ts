import { apiService as baseApiService } from "./api.services";
import { customAlert } from "@/utils/alert";

const apiService = {
  get: async (url: string, config?: any) => {
    try {
      return await baseApiService.get(url, config);
    } catch (error: any) {
      customAlert(error?.message || "An unexpected error occurred");
      throw error;
    }
  },
  post: async (url: string, data?: any, config?: any) => {
    try {
      return await baseApiService.post(url, data, config);
    } catch (error: any) {
      customAlert(error?.message || "An unexpected error occurred");
      throw error;
    }
  },
  put: async (url: string, data?: any, config?: any) => {
    try {
      return await baseApiService.put(url, data, config);
    } catch (error: any) {
      customAlert(error?.message || "An unexpected error occurred");
      throw error;
    }
  },
  patch: async (url: string, data?: any, config?: any) => {
    try {
      return await baseApiService.patch(url, data, config);
    } catch (error: any) {
      customAlert(error?.message || "An unexpected error occurred");
      throw error;
    }
  },
  delete: async (url: string, config?: any) => {
    try {
      return await baseApiService.delete(url, config);
    } catch (error: any) {
      customAlert(error?.message || "An unexpected error occurred");
      throw error;
    }
  },
};

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

export const getDepartmentsByCourse = async (courses: string) => {
  try {
    const response = await apiService.get(
      `method/stridenex_app.stridenex_app.doctype.college_department.college_department.get_departments_by_course?courses=${encodeURIComponent(courses)}`
    );
    return response;
  } catch (error) {
    console.error("Error fetching departments by course:", error);
    throw error;
  }
};

export const getIndustryByEmail = async (email: string) => {
  try {
    const response = await apiService.get(
      `method/stridenex_app.api_stridenex_app.industry.industry.get_industry_by_name?email=${encodeURIComponent(email)}`
    );
    return response;
  } catch (error) {
    console.error("Error fetching industry by email:", error);
    throw error;
  }
};

export const updateIndustry = async (email: string, companyName: string, data: any) => {
  try {
    const response = await apiService.post(
      `method/stridenex_app.api_stridenex_app.industry.industry.update_industry?company_name=${encodeURIComponent(companyName)}`,
      {
        ...data,
        email: email
      }
    );
    return response;
  } catch (error) {
    console.error("Error updating industry:", error);
    throw error;
  }
};

export const addRequiredRole = async (data: any, industry: string) => {
  try {
    const response = await apiService.post(
      `method/stridenex_app.stridenex_app.doctype.industry_role.industry_role.create_industry_role?industry=${encodeURIComponent(industry)}`,
      data
    );
    return response;
  } catch (error) {
    console.error("Error adding required role:", error);
    throw error;
  }
};

export const updateIndustryRole = async (name: string, data: any) => {
  try {
    const response = await apiService.post(
      `method/stridenex_app.stridenex_app.doctype.industry_role.industry_role.update_industry_role?name=${encodeURIComponent(name)}`,
      data
    );
    return response;
  } catch (error) {
    console.error("Error updating industry role:", error);
    throw error;
  }
};

export const deleteIndustryRole = async (name: string) => {
  try {
    const response = await apiService.post(
      `method/stridenex_app.stridenex_app.doctype.industry_role.industry_role.delete_industry_role?name=${encodeURIComponent(name)}`
    );
    return response;
  } catch (error) {
    console.error("Error deleting industry role:", error);
    throw error;
  }
};

export const getIndustryRoleList = async (industry: string) => {
  try {
    const response = await apiService.get(
      `method/stridenex_app.stridenex_app.doctype.industry_role.industry_role.get_industry_role_list?industry=${encodeURIComponent(industry)}`
    );
    return response;
  } catch (error) {
    console.error("Error fetching industry role list:", error);
    throw error;
  }
};

export const addHiringRound = async (data: any) => {
  try {
    const response = await apiService.post(
      `method/stridenex_app.api_stridenex_app.industry.industry.add_hiring_round`,
      data
    );
    return response;
  } catch (error) {
    console.error("Error adding hiring round:", error);
    throw error;
  }
};

export const deleteHiringRound = async (companyName: string, rowName: string) => {
  try {
    const response = await apiService.post(
      `method/stridenex_app.api_stridenex_app.industry.industry.delete_hiring_round?name=${encodeURIComponent(companyName)}&row_name=${encodeURIComponent(rowName)}`
    );
    return response;
  } catch (error) {
    console.error("Error deleting hiring round:", error);
    throw error;
  }
};

export const updateHiringRound = async (data: any) => {
  try {
    const companyName = data.industry_name || "";
    const rowName = data.row_name || "";
    const response = await apiService.post(
      `method/stridenex_app.api_stridenex_app.industry.industry.update_hiring_round?name=${encodeURIComponent(companyName)}&row_name=${encodeURIComponent(rowName)}`,
      data
    );
    return response;
  } catch (error) {
    console.error("Error updating hiring round:", error);
    throw error;
  }
};

export const createProject = async (data: any) => {
  try {
    const response = await apiService.post(
      `method/stridenex_app.stridenex_app.doctype.industry_project.industry_project.create_project`,
      data
    );
    return response;
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
};

export const getProjectList = async (industry: string) => {
  try {
    const response = await apiService.get(
      `method/stridenex_app.stridenex_app.doctype.industry_project.industry_project.get_project_list?industry=${encodeURIComponent(industry)}`
    );
    return response;
  } catch (error) {
    console.error("Error fetching project list:", error);
    throw error;
  }
};

export const updateProject = async (projectName: string, data: any) => {
  try {
    const response = await apiService.post(
      `method/stridenex_app.stridenex_app.doctype.industry_project.industry_project.update_project?name=${encodeURIComponent(projectName)}`,
      data
    );
    return response;
  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
};

export const deleteProject = async (projectName: string) => {
  try {
    const response = await apiService.post(
      `method/stridenex_app.stridenex_app.doctype.industry_project.industry_project.inactive_project?project_name=${encodeURIComponent(projectName)}`
    );
    return response;
  } catch (error) {
    console.error("Error deleting project:", error);
    throw error;
  }
};

export const createInternship = async (data: any) => {
  try {
    const response = await apiService.post(
      `method/stridenex_app.stridenex_app.doctype.internship.internship.create_internship`,
      data
    );
    return response;
  } catch (error) {
    console.error("Error creating internship:", error);
    throw error;
  }
};

export const updateInternship = async (name: string, data: any) => {
  try {
    const response = await apiService.post(
      `method/stridenex_app.stridenex_app.doctype.internship.internship.update_internship?name=${encodeURIComponent(name)}`,
      data
    );
    return response;
  } catch (error) {
    console.error("Error updating internship:", error);
    throw error;
  }
};

export const getInternshipList = async (industry: string, page: number = 1, page_size: number = 7) => {
  try {
    const response = await apiService.get(
      `method/stridenex_app.stridenex_app.doctype.internship.internship.get_internship_list?industry=${encodeURIComponent(industry)}&page=${page}&page_size=${page_size}`
    );
    return response;
  } catch (error) {
    console.error("Error fetching internship list:", error);
    throw error;
  }
};

export const deleteInternship = async (name: string) => {
  try {
    const response = await apiService.post(
      `method/stridenex_app.stridenex_app.doctype.internship.internship.inactive_internship?name=${encodeURIComponent(name)}`
    );
    return response;
  } catch (error) {
    console.error("Error deleting internship:", error);
    throw error;
  }
};

export const getStudentApplicationList = async (industry: string) => {
  try {
    const response = await apiService.get(
      `method/stridenex_app.stridenex_app.doctype.internship_application.internship_application.get_student_application_list?industry=${encodeURIComponent(industry)}`
    );
    return response;
  } catch (error) {
    console.error("Error fetching student application list:", error);
    throw error;
  }
};

export const getSkillDomain = async (industry: string) => {
  try {
    const response = await apiService.get(
      `method/stridenex_app.stridenex_app.doctype.industry_skill_domain.industry_skill_domain.get_skill_domain?industry=${encodeURIComponent(industry)}`
    );
    return response;
  } catch (error) {
    console.error("Error fetching skill domain:", error);
    throw error;
  }
};

export const createSkillDomain = async (data: any) => {
  try {
    const response = await apiService.post(
      `method/stridenex_app.stridenex_app.doctype.industry_skill_domain.industry_skill_domain.create_skill_domain?industry=${encodeURIComponent(data.industry)}`,
      data
    );
    return response;
  } catch (error) {
    console.error("Error creating skill domain:", error);
    throw error;
  }
};

export const updateSkillDomain = async (name: string, data: any) => {
  try {
    const response = await apiService.post(
      `method/stridenex_app.stridenex_app.doctype.industry_skill_domain.industry_skill_domain.update_skill_domain?name=${encodeURIComponent(name)}`,
      data
    );
    return response;
  } catch (error) {
    console.error("Error updating skill domain:", error);
    throw error;
  }
};

export const deleteSkillDomain = async (name: string) => {
  try {
    const response = await apiService.post(
      `method/stridenex_app.stridenex_app.doctype.industry_skill_domain.industry_skill_domain.delete_skill_domain?name=${encodeURIComponent(name)}`
    );
    return response;
  } catch (error) {
    console.error("Error deleting skill domain:", error);
    throw error;
  }
};

export const getApplicationStatusCount = async (industry: string) => {
  try {
    const response = await apiService.get(
      `method/stridenex_app.stridenex_app.doctype.internship_application.internship_application.get_application_status_count?industry=${encodeURIComponent(industry)}`
    );
    return response;
  } catch (error) {
    console.error("Error fetching application status count:", error);
    throw error;
  }
};

export const getCampusPartnerList = async (industry: string) => {
  try {
    const response = await apiService.get(
      `method/stridenex_app.stridenex_app.doctype.campus_partner.campus_partner.get_campus_partener_list?industry=${encodeURIComponent(industry)}`
    );
    return response;
  } catch (error) {
    console.error("Error fetching campus partner list:", error);
    throw error;
  }
};

export const createCampusPartner = async (data: any) => {
  try {
    const response = await apiService.post(
      `method/stridenex_app.stridenex_app.doctype.campus_partner.campus_partner.create_campus_partener`,
      data
    );
    return response;
  } catch (error) {
    console.error("Error creating campus partner:", error);
    throw error;
  }
};

export const deleteCampusPartner = async (name: string) => {
  try {
    const response = await apiService.post(
      `method/stridenex_app.stridenex_app.doctype.campus_partner.campus_partner.delete_campus_partener?name=${encodeURIComponent(name)}`
    );
    return response;
  } catch (error) {
    console.error("Error deleting campus partner:", error);
    throw error;
  }
};

export const getFindTalentList = async (params: {
  search?: string;
  College?: string;
  current_year?: string;
  skill?: string;
  sort_by?: string;
  page?: number;
  page_size?: number;
}) => {
  try {
    let url = `method/stridenex_app.stridenex_app.doctype.student.student.get_student_list?page=${params.page || 1}&page_size=${params.page_size || 20}`;
    if (params.search) {
      url += `&search=${encodeURIComponent(params.search)}`;
    }
    if (params.College) {
      url += `&College=${encodeURIComponent(params.College)}`;
    }
    if (params.current_year) {
      url += `&current_year=${encodeURIComponent(params.current_year)}`;
    }
    if (params.skill) {
      url += `&skill=${encodeURIComponent(params.skill)}`;
    }
    if (params.sort_by) {
      url += `&sort_by=${encodeURIComponent(params.sort_by)}`;
    }
    const response = await apiService.get(url);
    return response;
  } catch (error) {
    console.error("Error fetching student list:", error);
    throw error;
  }
};

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

export const updateApplicationStatus = async (name: string, status: string) => {
  try {
    const response = await apiService.post(
      `method/stridenex_app.stridenex_app.doctype.student_applications.student_applications.update_application_status`,
      { name, status }
    );
    return response;
  } catch (error) {
    console.error("Error updating application status:", error);
    throw error;
  }
};

export const getProjectApplicationCount = async (industry: string) => {
  try {
    const response = await apiService.get(
      `method/stridenex_app.stridenex_app.doctype.student_project_enrollment.student_project_enrollment.get_application_count_by_industry?industry=${encodeURIComponent(industry)}`
    );
    return response;
  } catch (error) {
    console.error("Error fetching project application count:", error);
    throw error;
  }
};

export const updateProjectApplicationStatus = async (payload: { name: string, industry: string, status: string }) => {
  try {
    const response = await apiService.post(
      `method/stridenex_app.stridenex_app.doctype.student_project_enrollment.student_project_enrollment.update_student_project_enrollment`,
      payload
    );
    return response;
  } catch (error) {
    console.error("Error updating project application status:", error);
    throw error;
  }
};

export const createDomain = async (domain: string) => {
  try {
    const response = await apiService.post(
      `method/stridenex_app.stridenex_app.doctype.sub_domain.sub_domain.create_domain`,
      { domain }
    );
    return response;
  } catch (error) {
    console.error("Error creating domain:", error);
    throw error;
  }
};

export const createSubDomain = async (subDomain: string, domain?: string) => {
  try {
    const response = await apiService.post(
      `method/stridenex_app.stridenex_app.doctype.sub_domain.sub_domain.create_sub_domain`,
      { sub_domain: subDomain, domain }
    );
    return response;
  } catch (error) {
    console.error("Error creating sub-domain:", error);
    throw error;
  }
};

export const createDesignation = async (designation_name: string) => {
  try {
    const response = await apiService.post(
      `method/stridenex_app.stridenex_app.doctype.job_function.job_function.create_designation`,
      { designation_name }
    );
    return response;
  } catch (error) {
    console.error("Error creating designation:", error);
    throw error;
  }
};

export const createSkill = async (skill_name: string) => {
  try {
    const response = await apiService.post(
      `method/stridenex_app.stridenex_app.doctype.student.student.create_skill`,
      { skill_name }
    );
    return response;
  } catch (error) {
    console.error("Error creating skill:", error);
    throw error;
  }
};

export const createSpecialization = async (specialization_name: string) => {
  try {
    const response = await apiService.post(
      `method/stridenex_app.stridenex_app.doctype.specialization.specialization.create_specialization`,
      { specialization_name }
    );
    return response;
  } catch (error) {
    console.error("Error creating specialization:", error);
    throw error;
  }
};

export const generateEmailTemplate = async (industry: string) => {
  try {
    const response = await apiService.post(
      `method/stridenex_app.stridenex_app.doctype.recruitment_outreach_template.recruitment_outreach_template.generate_email_template`,
      { industry }
    );
    return response;
  } catch (error) {
    console.error("Error generating email template:", error);
    throw error;
  }
};

export const getInvitationTemplate = async (industry: string) => {
  try {
    const response = await apiService.post(
      `method/stridenex_app.stridenex_app.doctype.recruitment_outreach_template.recruitment_outreach_template.get_invitation_template`,
      { industry }
    );
    return response;
  } catch (error) {
    console.error("Error getting invitation template:", error);
    throw error;
  }
};

export const createJobProfile = async (data: any) => {
  try {
    const response = await apiService.post(
      `method/stridenex_app.stridenex_app.doctype.industry_job_profile.industry_job_profile.create_job_profile`,
      data
    );
    return response;
  } catch (error) {
    console.error("Error creating job profile:", error);
    throw error;
  }
};

export const updateJobProfile = async (data: any) => {
  try {
    const response = await apiService.post(
      `method/stridenex_app.stridenex_app.doctype.industry_job_profile.industry_job_profile.update_job_profile`,
      data
    );
    return response;
  } catch (error) {
    console.error("Error updating job profile:", error);
    throw error;
  }
};

export const getJobProfiles = async (industry?: string) => {
  try {
    let url = `method/stridenex_app.stridenex_app.doctype.industry_job_profile.industry_job_profile.get_job_profiles`;
    if (industry) {
      url += `?industry=${encodeURIComponent(industry)}`;
    }
    const response = await apiService.get(url);
    return response;
  } catch (error) {
    console.error("Error fetching job profiles:", error);
    throw error;
  }
};

export const uploadFile = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("is_private", "0");
    const response = await apiService.post("method/upload_file", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

export const getApplications = async (params: {
  opportunity_type: string;
  industry: string;
  project?: string;
  proect?: string;
  internship?: string;
  job_profile?: string;
}) => {
  try {
    const response = await apiService.get(
      `method/stridenex_app.stridenex_app.doctype.student_applications.student_applications.get_applications`,
      { params }
    );
    return response;
  } catch (error) {
    console.error("Error fetching applications:", error);
    throw error;
  }
};

export const getAllDropdownData = async (params: {
  opportunity_type: string;
  industry: string;
}) => {
  try {
    const response = await apiService.get(
      `method/stridenex_app.stridenex_app.doctype.student_applications.student_applications.get_all_dropdown_data`,
      { params }
    );
    return response;
  } catch (error) {
    console.error("Error fetching dropdown data:", error);
    throw error;
  }
};

export const getApplicationsCount = async (params: {
  opportunity_type: string;
  industry: string;
  project?: string;
  proect?: string;
  internship?: string;
  job_profile?: string;
}) => {
  try {
    const response = await apiService.get(
      `method/stridenex_app.stridenex_app.doctype.student_applications.student_applications.get_applications_count`,
      { params }
    );
    return response;
  } catch (error) {
    console.error("Error fetching applications count:", error);
    throw error;
  }
};


export interface OfferTemplatePayload {
  template_name: string;
  template_code: string;
  link_ewqm: string;
  select_egwf: string;
  status: string;
  subject: string;
  salutation: string;
  body: string;
  compensation_type: string;
  compensation_amount: number;
  currency: string;
  duration: string;
  effective_from: string;
  effective_to: string;
}

export const createOfferTemplate = async (data: OfferTemplatePayload) => {
  try {
    const response = await apiService.post(
      `method/stridenex_app.stridenex_app.doctype.offer_template.offer_template.create_offer_template`,
      data
    );
    return response;
  } catch (error) {
    console.error("Error creating offer template:", error);
    throw error;
  }
};

export const getOfferTemplates = async (industry?: string) => {
  try {
    let url = `method/stridenex_app.stridenex_app.doctype.offer_template.offer_template.get_offer_templates`;
    if (industry) {
      url += `?link_ewqm=${encodeURIComponent(industry)}`;
    }
    const response = await apiService.get(url);
    return response;
  } catch (error) {
    console.error("Error fetching offer templates:", error);
    throw error;
  }
};
export const updateOfferTemplate = async (data: any) => {
  try {
    const response = await apiService.post(
      `method/stridenex_app.stridenex_app.doctype.offer_template.offer_template.update_offer_template`,
      data
    );
    return response;
  } catch (error) {
    console.error("Error updating offer template:", error);
    throw error;
  }
};

export const deleteOfferTemplate = async (name: string) => {
  try {
    const response = await apiService.post(
      `method/stridenex_app.stridenex_app.doctype.offer_template.offer_template.delete_offer_template`,
      { name }
    );
    return response;
  } catch (error) {
    console.error("Error deleting offer template:", error);
    throw error;
  }
};
