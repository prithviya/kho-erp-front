import { request } from "./apiClient";

function buildEmployeeFormData(payload) {
  const formData = new FormData();
  formData.append("jobPosition", payload.jobPosition || "");
  formData.append("fullName", payload.fullName || "");
  formData.append("email", payload.email || "");
  formData.append("phone", payload.phone || "");
  formData.append("dateOfBirth", payload.dateOfBirth || "");
  formData.append("city", payload.city || "");
  formData.append("pinCode", payload.pinCode || "");
  formData.append("gender", payload.gender || "");
  formData.append("portfolioLink", payload.portfolioLink || "");
  formData.append("consent", String(Boolean(payload.consent)));
  formData.append("status", payload.status || "Onboarding");
  formData.append("education", JSON.stringify(payload.education || []));
  formData.append("workExperience", JSON.stringify(payload.workExperience || []));
  formData.append("skills", JSON.stringify(payload.skills || []));
  formData.append("softwareTools", JSON.stringify(payload.softwareTools || []));
  formData.append("languages", JSON.stringify(payload.languages || []));
  formData.append("references", JSON.stringify(payload.references || []));

  if (payload.resume instanceof File) {
    formData.append("resume", payload.resume);
  }

  return formData;
}

const employeeService = {
  list(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/employees${query ? `?${query}` : ""}`);
  },
  getById(id) {
    return request(`/employees/${id}`);
  },
  create(payload) {
    return request("/employees", {
      method: "POST",
      body: buildEmployeeFormData(payload),
    });
  },
  update(id, payload) {
    return request(`/employees/${id}`, {
      method: "PUT",
      body: buildEmployeeFormData(payload),
    });
  },
};

export default employeeService;