import { Menu, Bell, ChevronDown, UserCircle2, X } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import ProfileMenu from "./ProfileMenu";
import { getSession } from "../../utils/session";
import { useLocation, useNavigate } from "react-router-dom";
import { getPageTitle } from "../../utils/pageTitle";
import notificationService from "../../services/notification.service";
import { subscribe } from "../../services/realtime.service";
import { toast } from "react-toastify";
import authService from "../../services/auth.service";
import { getProfileImageUrl } from "../../utils/profileImage";

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

function parseNotificationMetadata(value) {
    if (typeof value === "string") {
        try {
            return JSON.parse(value);
        } catch {
            return {};
        }
    }
    return value && typeof value === "object" ? value : {};
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
    const [profileImage, setProfileImage] = useState(session?.user?.profileImage || "");

    const notificationContainerRef = useRef(null);
    const profileContainerRef = useRef(null);
    const notificationTimerRef = useRef(null);
    const profileTimerRef = useRef(null);

    const location = useLocation();
    const navigate = useNavigate();
    const title = getPageTitle(location.pathname);

    useEffect(() => {
        let active = true;
        const updateProfileImage = async () => {
            try {
                const response = await authService.getProfile();
                if (active) setProfileImage(response?.data?.profileImage || "");
            } catch (error) {
                console.error("Unable to load the profile photo.", error);
            }
        };
        const handleProfileImageUpdate = (event) => {
            setProfileImage(event.detail || "");
        };

        updateProfileImage();
        window.addEventListener("profile-image-updated", handleProfileImageUpdate);
        return () => {
            active = false;
            window.removeEventListener("profile-image-updated", handleProfileImageUpdate);
        };
    }, []);

    const startNotificationTimer = () => {
        if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
        notificationTimerRef.current = setTimeout(() => {
            setNotificationOpen(false);
        }, 10000);
    };

    const clearNotificationTimer = () => {
        if (notificationTimerRef.current) {
            clearTimeout(notificationTimerRef.current);
            notificationTimerRef.current = null;
        }
    };

    const startProfileTimer = () => {
        if (profileTimerRef.current) clearTimeout(profileTimerRef.current);
        profileTimerRef.current = setTimeout(() => {
            setOpen(false);
        }, 10000);
    };

    const clearProfileTimer = () => {
        if (profileTimerRef.current) {
            clearTimeout(profileTimerRef.current);
            profileTimerRef.current = null;
        }
    };

    const toggleNotification = () => {
        setNotificationOpen((prev) => {
            const next = !prev;
            if (next) {
                setOpen(false);
                clearProfileTimer();
                startNotificationTimer();
            } else {
                clearNotificationTimer();
            }
            return next;
        });
    };

    const toggleProfile = () => {
        setOpen((prev) => {
            const next = !prev;
            if (next) {
                setNotificationOpen(false);
                clearNotificationTimer();
                startProfileTimer();
            } else {
                clearProfileTimer();
            }
            return next;
        });
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (notificationContainerRef.current && !notificationContainerRef.current.contains(e.target)) {
                setNotificationOpen(false);
                clearNotificationTimer();
            }
            if (profileContainerRef.current && !profileContainerRef.current.contains(e.target)) {
                setOpen(false);
                clearProfileTimer();
            }
        };
        document.addEventListener("mousedown", handleOutsideClick);
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            clearNotificationTimer();
            clearProfileTimer();
        };
    }, []);

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
            setOpen(false);
            startNotificationTimer();
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
        const metadata = parseNotificationMetadata(notification.metadata);
        const taskId = metadata?.taskId || notification.taskId;
        const projectId = notification.projectOnboardId || metadata?.projectOnboardId;

        try {
            await notificationService.remove(notification.id);
            setNotifications((current) => current.filter((item) => item.id !== notification.id));
            if (!notification.readAt) {
                setUnreadCount((current) => Math.max(0, current - 1));
            }
        } catch (error) {
            console.error("Unable to remove notification.", error);
        }

        if (projectId || taskId) {
            setNotificationOpen(false);
            clearNotificationTimer();
            const params = new URLSearchParams();
            if (projectId) params.set("projectId", String(projectId));
            if (taskId) {
                params.set("taskId", String(taskId));
                params.set("tab", "comments");
            }
            navigate(`/assign-board?${params.toString()}`);
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

    const userDisplayName = session?.user?.firstName
        ? `${session.user.firstName} ${session.user.lastName || ""}`.trim()
        : (session?.user?.email || "User");

    return (
        <header className="sticky top-0 z-30 mx-2 mt-2 flex h-[60px] shrink-0 items-center justify-between gap-2 rounded-2xl border border-white bg-white px-3 shadow-[0_2px_12px_rgba(15,23,42,0.025)] sm:mx-3 sm:mt-3 sm:px-4 lg:mx-[14px] lg:mt-[10px] lg:px-5">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                {!hideSidebarToggle && (
                    <button
                        aria-label="Open navigation"
                        title="Open navigation"
                        className="lg:hidden text-slate-600 hover:text-slate-900"
                        onClick={toggleSidebar}
                    >
                        <Menu size={22} />
                    </button>
                )}
                <h1 className="truncate text-sm font-semibold tracking-tight text-[#211d20] sm:text-[15px]">
                    {title}
                </h1>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
                {/* Notifications Bell */}
                <div ref={notificationContainerRef} className="relative">
                    <button
                        type="button"
                        aria-label="Notifications"
                        onClick={toggleNotification}
                        className="relative flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50"
                    >
                        <Bell size={15} strokeWidth={1.7} />
                        {unreadCount > 0 && (
                            <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-[#a21019] px-1 text-center text-[9px] font-bold leading-4 text-white">
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                        )}
                    </button>
                    {notificationOpen && (
                        <div
                            onMouseEnter={clearNotificationTimer}
                            onMouseLeave={startNotificationTimer}
                            className="absolute right-0 top-12 z-50 w-[min(20rem,calc(100vw-1rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
                        >
                            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                                <p className="font-semibold text-slate-800">Notifications</p>
                                {unreadCount > 0 && <button onClick={markAllNotificationsRead} className="text-xs font-medium text-emerald-600">Mark all read</button>}
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <p className="px-4 py-8 text-center text-sm text-slate-500">No notifications yet.</p>
                                ) : notifications.map((notification) => {
                                    const metadata = parseNotificationMetadata(notification.metadata);
                                    const taskId = metadata.taskId || notification.taskId;
                                    return (
                                        <div
                                            key={notification.id}
                                            className={`flex items-start gap-2 border-b border-slate-100 px-3 py-2 ${notification.readAt ? "bg-white" : "bg-emerald-50/60"}`}
                                        >
                                            <button
                                                onClick={() => markNotificationRead(notification)}
                                                className="min-w-0 flex-1 px-1 py-1 text-left hover:bg-slate-50 rounded"
                                            >
                                                {taskId ? (
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-600">{metadata.category || "Task"}</p>
                                                        <p className="mt-1 text-sm font-semibold text-slate-800">{metadata.taskName || "Task update"}</p>
                                                        <p className="mt-1 text-xs text-slate-600">{notification.message}</p>
                                                        <p className="mt-1 text-xs text-slate-500">Deadline: {metadata.deadline || "Not set"}</p>
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
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile Trigger & Dropdown */}
                <div ref={profileContainerRef} className="relative">
                    <button
                        type="button"
                        onClick={toggleProfile}
                        className="flex items-center gap-1.5 text-slate-700 sm:gap-2"
                    >
                        {profileImage ? (
                            <img
                                src={getProfileImageUrl(profileImage)}
                                alt=""
                                className="h-7 w-7 rounded-full object-cover"
                                onError={() => setProfileImage("")}
                            />
                        ) : (
                            <UserCircle2
                                size={28}
                                strokeWidth={1.5}
                                className="text-slate-600"
                            />
                        )}
                        <div className="hidden max-w-[180px] text-left sm:block">
                            <p className="text-[11px] font-semibold leading-4 text-[#211d20]">
                                <span className="block truncate">{userDisplayName}</span>
                            </p>
                            <p className="text-[9px] leading-3 text-slate-500">
                                {session?.user?.roles?.[0]?.name || "Administrator"}
                            </p>
                        </div>
                        <ChevronDown size={14} className="text-slate-400" />
                    </button>
                    {open && (
                        <ProfileMenu
                            close={() => {
                                setOpen(false);
                                clearProfileTimer();
                            }}
                            onMouseEnter={clearProfileTimer}
                            onMouseLeave={startProfileTimer}
                        />
                    )}
                </div>
            </div>
        </header>
    );
}