import menu from "../components/sidebar/menu";
export const getPageTitle = (pathname) => {
    if (pathname === "/task-schedule") {
        return "Task Schedule List";
    }

    for (const section of menu) {
        const page = section.items.find(item => item.path === pathname);
        if (page) {
            return page.title || page.name;
        }
    }
    return "Kho ERP";
};