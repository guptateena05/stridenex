const fs = require('fs');
const file = 'src/services/student.services.ts';
let code = fs.readFileSync(file, 'utf8');

const importRegex = /export const enrollStudentPath = async \(/;
const newFunction = `/**
 * Get career path quota status.
 */
export const getCareerPathQuotaStatus = async (studentEmail: string) => {
  try {
    const response = await apiService.get(
      \`method/nexedu.path_finder.app_api.get_career_path_quota_status?student=\${encodeURIComponent(studentEmail)}\`
    );
    return response;
  } catch (error) {
    console.error("Error fetching career path quota status:", error);
    throw error;
  }
};

`;

code = code.replace(importRegex, newFunction + 'export const enrollStudentPath = async (');
fs.writeFileSync(file, code);
