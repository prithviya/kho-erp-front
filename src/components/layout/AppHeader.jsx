import { Menu, Bell, ChevronDown, UserCircle2, X } from "lucide-react";
import { useEffect, useState } from "react";
import ProfileMenu from "./ProfileMenu";
import { getSession } from "../../utils/session";
import { useLocation, useNavigate } from "react-router-dom";
import { getPageTitle } from "../../utils/pageTitle";
import notificationService from "../../services/notification.service";
import { subscribe } from "../../services/realtime.service";
import { toast } from "react-toastify";

function playNotificationSound() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(660, now);
    oscillator.frequency.setValueAtTime(880, now + 0.1);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.3);
    oscillator.addEventListener("ended", () => context.close(), { once: true });
}

export default function AppHeader({
    toggleSidebar,
    hideSidebarToggle = false
}) {
    const session = getSession();
    const [open, setOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const location = useLocation();
    const navigate = useNavigate();
    const title = getPageTitle(location.pathname);

    useEffect(() => {
        let mounted = true;
        notificationService.list()
            .then((response) => {
                if (!mounted) return;
                setNotifications(response?.data?.notifications || []);
                setUnreadCount(Number(response?.data?.unreadCount || 0));
            })
            .catch(() => {});

        const unsubscribe = subscribe("notification", (notification) => {
            setNotifications((current) => [notification, ...current].slice(0, 50));
            setUnreadCount((current) => current + 1);
            setNotificationOpen(true);
        });
        const unsubscribeMessage = subscribe("project-message", (payload) => {
            const message = payload?.message;
            if (!message || Number(message.senderId) === Number(session?.user?.id)) return;

            const sender = message.sender
                ? `${message.sender.firstName || ""} ${message.sender.lastName || ""}`.trim() || message.sender.email
                : "A teammate";
            playNotificationSound();
            toast.info(`${sender}: ${message.message}`, {
                toastId: `project-message-${message.id}`,
                autoClose: 5000
            });
        });

        return () => {
            mounted = false;
            unsubscribe();
            unsubscribeMessage();
        };
    }, []);

    const markNotificationRead = async (notification) => {
        if (!notification.readAt) {
            await notificationService.markRead(notification.id).catch(() => {});
            setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item));
            setUnreadCount((current) => Math.max(0, current - 1));
        }
        if (notification.projectOnboardId) {
            setNotificationOpen(false);
            const taskId = notification.metadata?.taskId;
            navigate(`/assign-board?projectId=${notification.projectOnboardId}${taskId ? `&taskId=${taskId}` : "&chat=1"}`);
        }
    };

    const markAllNotificationsRead = async () => {
        await notificationService.markAllRead().catch(() => {});
        setNotifications((current) => current.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
        setUnreadCount(0);
    };

    const clearNotification = async (event, notification) => {
        event.stopPropagation();
        try {
            await notificationService.remove(notification.id);
            setNotifications((current) => current.filter((item) => item.id !== notification.id));
            if (!notification.readAt) {
                setUnreadCount((current) => Math.max(0, current - 1));
            }
        } catch (error) {
            toast.error(error?.message || "Unable to clear notification.");
        }
    };

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
            <div className="flex items-center gap-4">
                {!hideSidebarToggle && (
                    <button
                        aria-label="Open navigation"
                        title="Open navigation"
                        className="lg:hidden"
                        onClick={toggleSidebar}
                    >
                        <Menu size={22} />
                    </button>
                )}
                <h1 className="text-xl font-bold tracking-tight text-slate-800 sm:text-2xl">
                    {title}
                </h1>
            </div>
            <div className="flex items-center gap-5">
                <div className="relative">
                <button
                    aria-label="Notifications"
                    onClick={() => setNotificationOpen((current) => !current)}
                    className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                >
                    <Bell size={21} />
                    {unreadCount > 0 && (
                        <span className="absolute -right-2 -top-2 min-w-5 rounded-full bg-red-500 px-1 text-center text-[10px] font-bold leading-5 text-white">
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                    )}
                </button>
                {notificationOpen && (
                    <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                            <p className="font-semibold text-slate-800">Notifications</p>
                            {unreadCount > 0 && <button onClick={markAllNotificationsRead} className="text-xs font-medium text-emerald-600">Mark all read</button>}
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <p className="px-4 py-8 text-center text-sm text-slate-500">No notifications yet.</p>
                            ) : notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`flex items-start gap-2 border-b border-slate-100 px-3 py-2 ${notification.readAt ? "bg-white" : "bg-emerald-50/60"}`}
                                >
                                    <button
                                        onClick={() => markNotificationRead(notification)}
                                        className="min-w-0 flex-1 px-1 py-1 text-left hover:bg-slate-50"
                                    >
                                        {notification.metadata?.taskId ? (
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-600">{notification.metadata.category || "Task"}</p>
                                                <p className="mt-1 text-sm font-semibold text-slate-800">{notification.metadata.taskName || "Task update"}</p>
                                                <p className="mt-1 text-xs text-slate-600">{notification.message}</p>
                                                <p className="mt-1 text-xs text-slate-500">Deadline: {notification.metadata.deadline || "Not set"}</p>
                                            </div>
                                        ) : <p className="text-sm text-slate-700">{notification.message}</p>}
                                        <p className="mt-1 text-xs text-slate-400">{new Date(notification.createdAt).toLocaleString()}</p>
                                    </button>
                                    <button
                                        type="button"
                                        aria-label="Clear notification"
                                        title="Clear notification"
                                        onClick={(event) => clearNotification(event, notification)}
                                        className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                </div>
                <div className="relative">
                    <button
                        onClick={() => setOpen(!open)}
                        className="flex items-center gap-3"
                    >
                        <UserCircle2
                            size={38}
                            className="text-slate-500"
                        />
                        <div className="hidden md:block text-left">
                            <p className="font-semibold">
                                {session?.user?.firstName || "Super Admin"}
                            </p>
                            <p className="text-xs text-slate-500">
                                {session?.user?.roles?.[0]?.name || "Administrator"}
                            </p>
                        </div>
                        <ChevronDown size={18} />
                    </button>
                    {
                        open &&
                        <ProfileMenu
                            close={() => setOpen(false)}
                        />
                    }
                </div>
            </div>
        </header>
    );
}