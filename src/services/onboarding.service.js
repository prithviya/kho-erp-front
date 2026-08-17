import { request } from "./apiClient";

const onboardingService ={
   create(payload) {
    console.log('payload: ',payload);
    
        return request("/cif-personals", {
            method: "POST",
            body: JSON.stringify({
                
                fullName: payload.fullName,
                email: payload.email,
                phoneNumber: payload.phoneNumber,
                DOB: payload.DOB,
                address: payload.address,
                city: payload.city,
                state: payload.address,
                pinCode: payload.pinCode,
                gender: payload.gender,
                maritalStatus: payload. maritalStatus,
                portfolioLink: payload.portfolioLink,
                resume: payload.resume,
                
                appliedPosition : payload. appliedPosition,
                status: payload.status,
            }),
        });
    },
    
}

export default onboardingService;