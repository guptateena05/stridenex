import { apiService } from "./api.services";

export interface College {
    name: string;
    college_name: string;
    status: string;
    registration_number: string;
    approved_status: string;
    college_code: string | null;
    university: string | null;
    college_type: string | null;
    website: string | null;
    is_active: number;
    country: string | null;
    state: string | null;
    district: string | null;
    city: string | null;
    taluka: string | null;
    approved_status_workflow: string | null;
    tahsil: string | null;
}

export interface CreateStudentPayload {
  first_name: string;
  last_name: string;
  mobile_no: string;
  email_id: string;
  stream: string;
  courses_type: Array<{ course_type: string }>;
  college: string;
  course: string;
  department: string;
  academic_year: string;
  semester: string;
  current_year?: string;
  date_of_birth: string;
  skill: Array<{ skill: string }>;
  career_interest: Array<{ career_interest: string }>;
  github?: string;
  linkedin?: string;
  resume?: File | null;
  other_college?: string;
}

export interface OtpResponse {
    message: string;
    data?: string;
}

export interface EmailOtpResponse {
    message: {
        status: string;
        message: string;
    };
}

export interface OtpVerification {
    message: string;
    data: {
        success: boolean
    }
}

// Send mobile OTP
export const sendMobileOTP = async (mobileNo: string, email: string): Promise<OtpResponse> => {
    try {
        const response = await apiService.get(
            `method/stridenex_app.api_stridenex_app.app.send_mobile_otp`,
            {
                params: {
                    mobile_no: mobileNo,
                    email: email
                }
            }
        );
        return response;
    } catch (error) {
        console.error("Error sending mobile OTP:", error);
        throw error;
    }
};

// Verify mobile OTP
export const verifyMobileOTP = async (mobileNo: string, otp: string, email: string): Promise<any> => {
    try {
        const response = await apiService.get(
            `method/stridenex_app.api_stridenex_app.app.validate_mobile_otp?mobile_no=${encodeURIComponent(mobileNo)}&otp=${encodeURIComponent(otp)}&email=${encodeURIComponent(email)}`
        );
        return response;
    } catch (error) {
        console.error("Error verifying mobile OTP:", error);
        throw error;
    }
};

// ============ NEW EMAIL OTP APIS ============

// Send email OTP
export const sendEmailOTP = async (email: string): Promise<EmailOtpResponse> => {
    try {
        const response = await apiService.get(
            `method/stridenex_app.api_stridenex_app.app.send_email_otp?email=${encodeURIComponent(email)}`
        );
        return response;
    } catch (error) {
        console.error("Error sending email OTP:", error);
        throw error;
    }
};

// Verify email OTP
export const verifyEmailOTP = async (email: string, otp: string): Promise<any> => {
    try {
        const response = await apiService.get(
            `method/stridenex_app.api_stridenex_app.app.validate_email_otp?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`
        );
        return response;
    } catch (error) {
        console.error("Error verifying email OTP:", error);
        throw error;
    }
};

export const createStudent = async (payload: CreateStudentPayload) => {
  try {
      // Create FormData for file upload
      const formData = new FormData();

      // Append all fields to FormData
      Object.keys(payload).forEach(key => {
        const value = payload[key as keyof CreateStudentPayload];
        
        if (key === 'resume' && value instanceof File) {
          // Append file separately
          formData.append('resume', value);
        } else if (key === 'courses_type' || key === 'skill' || key === 'career_interest') {
          // Append arrays as JSON strings
          formData.append(key, JSON.stringify(value));
        } else if (value !== null && value !== undefined) {
          // Append other fields
          formData.append(key, String(value));
        }
      });

      for (let pair of formData.entries()) {}

      const response = await apiService.post(
        `method/stridenex_app.api_stridenex_app.student.student.create_student`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response;
  } catch (error) {
    console.error("Error creating student:", error);
    throw error;
  }
};
