import { request, requestBlob } from "./apiClient";

const onboardingDocumentService = {
  list() {
    return request("/onboarding-documents");
  },
  archive(documents, all = false) {
    return requestBlob("/onboarding-documents/archive", {
      method: "POST",
      body: JSON.stringify(all ? { all: true } : { documents }),
    });
  },
};

export default onboardingDocumentService;
