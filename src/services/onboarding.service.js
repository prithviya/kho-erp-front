import { request } from "./apiClient";

const onboardingService ={
   create(payload) {
        return request("/cif-personals", {
            method: "POST",
            body: JSON.stringify({
                name: payload.name
            }),
        });
    },
}

export default onboardingService;