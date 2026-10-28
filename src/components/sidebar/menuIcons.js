import {
    BarChart3, Bell, Briefcase, Calendar, ClipboardList, FileText, Folder, Globe,
    LayoutDashboard, Link2, Mail, Package, Settings, ShieldCheck, ShoppingCart,
    Star, Truck, Users, Wallet
} from "lucide-react";

// Icons administrators can pick for dynamic menus (stored by name in modules.icon).
export const MENU_ICONS = {
    BarChart3, Bell, Briefcase, Calendar, ClipboardList, FileText, Folder, Globe,
    LayoutDashboard, Link2, Mail, Package, Settings, ShieldCheck, ShoppingCart,
    Star, Truck, Users, Wallet
};

export const getMenuIcon = (name) => MENU_ICONS[name] || Link2;
