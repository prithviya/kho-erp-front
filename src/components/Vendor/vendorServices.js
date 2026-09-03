export function getVendorServices(vendor = {}) {
    const services = vendor.services || vendor.vendor_services || vendor.vendorServices || [];
    return Array.isArray(services) ? services : [];
}

export function getServiceName(service) {
    return service.service_name || service.name || service.service?.name || service.Service?.name || "Unnamed service";
}

export function getCategoryName(service) {
    return service.category_name || service.categoryName || service.service_category?.name || service.category?.name || service.ServiceCategory?.name || "Uncategorized";
}

export function getServicePrice(service) {
    return service.price ?? service.service_price ?? service.sub_service_price ?? "-";
}
