import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Cake,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MessageCircle,
  PartyPopper,
  Sparkles,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";
import { toast } from "react-toastify";
import commonWallService from "../services/commonWall.service";
import { publishAnnouncementCount } from "../utils/commonWallEvents";
import { getProfileImageUrl } from "../utils/profileImage";

const EMPTY_MESSAGES = {
  tasks: "No tasks scheduled for today.",
  groups: "You are not a member of any chat groups yet.",
  openings: "No active job openings at the moment.",
  birthdays: "There aren't any birthday celebrations today.",
  anniversaries: "There aren't any work anniversary celebrations today.",
  newHires: "Employees who recently joined your organization will be listed here.",
};

function dateLabel(value, options = { month: "short", day: "numeric" }) {
  if (!value) return "";
  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, day)));
}

function initials(name = "") {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "K";
}

function Avatar({ name, src, className = "h-10 w-10" }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = getProfileImageUrl(src);

  if (imageUrl && !imageFailed) {
    return (
      <img
        src={imageUrl}
        alt=""
        className={`${className} shrink-0 rounded-full object-cover`}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <span className={`${className} inline-flex shrink-0 items-center justify-center rounded-full bg-[#9c1018]/10 text-xs font-bold text-[#9c1018]`}>
      {initials(name)}
    </span>
  );
}

function IconAction({ label, onClick, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-[#9c1018] focus:outline-none focus:ring-2 focus:ring-[#9c1018]/30"
    >
      {children}
    </button>
  );
}

function WallCard({ title, icon: Icon, onViewAll, onContact, children }) {
  return (
    <section className="relative flex h-[360px] min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex min-h-[58px] items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <h2 className="flex min-w-0 items-center gap-2 truncate text-sm font-semibold text-slate-800">
          {Icon && <Icon size={17} className="shrink-0 text-[#9c1018]" />}
          <span className="truncate">{title}</span>
        </h2>
        <div className="flex shrink-0 items-center gap-1">
          {onViewAll && (
            <IconAction label={`View all ${title}`} onClick={onViewAll}>
              <ArrowUpRight size={17} />
            </IconAction>
          )}
          {onContact && (
            <button type="button" onClick={onContact} className="rounded-lg px-2 py-1 text-xs font-semibold text-[#9c1018] hover:bg-[#9c1018]/5">
              Contact Operations Team
            </button>
          )}
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
    </section>
  );
}

function EmptyState({ icon: Icon, children }) {
  return (
    <div className="flex h-full min-h-40 flex-col items-center justify-center px-4 text-center text-sm text-slate-500">
      {Icon && <Icon size={28} className="mb-3 text-slate-300" />}
      <p>{children}</p>
    </div>
  );
}

export default function CommonWall() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState({
    today: "",
    tasks: [],
    groups: [],
    openings: [],
    birthdays: [],
    anniversaries: [],
    newHires: [],
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await commonWallService.getOverview();
      const payload = response?.data;
      const listKeys = ["tasks", "groups", "openings", "birthdays", "anniversaries", "newHires"];
      if (!response?.success || !payload || listKeys.some((key) => !Array.isArray(payload[key]))) {
        throw new Error("The Common Wall response is incomplete.");
      }

      setOverview({
        today: payload.today,
        tasks: payload.tasks,
        groups: payload.groups,
        openings: payload.openings,
        birthdays: payload.birthdays,
        anniversaries: payload.anniversaries,
        newHires: payload.newHires,
      });
      publishAnnouncementCount(Number(payload.announcementCount || 0));
    } catch (error) {
      setLoadError(error.message || "Unable to load Common Wall data.");
      toast.error(error.message || "Unable to load Common Wall data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const today = overview.today || "";
  const wishEmployee = (person) => {
    toast.success(`Happy birthday, ${person.fullName}!`);
  };

  const eventLabel = (occurrence) => {
    if (occurrence === today) return "Today";
    const occurrenceTime = Date.parse(`${occurrence}T00:00:00Z`);
    const todayTime = Date.parse(`${today}T00:00:00Z`);
    if (occurrenceTime < todayTime) return "Yesterday";
    return "Tomorrow";
  };

  return (
    <main className="min-h-full bg-[#f4f5f9] p-3 sm:p-4 lg:p-6">
      <div className="mx-auto max-w-[1600px]">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="inline-flex rounded-full bg-[#9c1018] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">KHO SOCIAL</span>
            <h1 className="mt-2 text-xl font-semibold text-[#171317] sm:text-2xl">Common Wall</h1>
            <p className="mt-1 text-sm text-slate-500">Team updates, today&apos;s work, and celebrations.</p>
          </div>
          <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm">
            <CalendarDays size={15} className="text-[#9c1018]" />
            {today ? dateLabel(today, { weekday: "long", month: "short", day: "numeric", year: "numeric" }) : ""}
          </p>
        </header>

        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500" role="status">
            Loading Common Wall data…
          </div>
        )}
        {loadError && (
          <div className="rounded-xl border border-red-200 bg-white p-5 text-sm text-slate-700" role="alert">
            <p>{loadError}</p>
            <button type="button" onClick={loadOverview} className="mt-3 rounded-lg bg-[#9c1018] px-3 py-2 text-xs font-semibold text-white hover:bg-[#7d0d15]">
              Retry
            </button>
          </div>
        )}

        {!loading && !loadError && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <WallCard title="Today's Tasks" icon={CheckCircle2} onViewAll={() => navigate("/assign-board")}>
            {overview.tasks.length ? (
              <ul className="divide-y divide-slate-100">
                {overview.tasks.map((task) => (
                  <li key={task.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${task.status === "COMPLETED" ? "bg-emerald-500" : task.status === "IN_PROGRESS" ? "bg-amber-500" : "bg-slate-300"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-medium text-slate-800">{task.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        {task.dueTime && <span className="inline-flex items-center gap-1"><Clock3 size={12} />{task.dueTime}</span>}
                        <span className="rounded-full bg-slate-100 px-2 py-0.5">{String(task.status || "TODO").replaceAll("_", " ")}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : <EmptyState icon={CheckCircle2}>{EMPTY_MESSAGES.tasks}</EmptyState>}
          </WallCard>

          <WallCard title="My Groups" icon={MessageCircle} onViewAll={() => navigate("/group-chat")}>
            {overview.groups.length ? (
              <ul className="space-y-1">
                {overview.groups.map((group) => (
                  <li key={group.id}>
                    <button type="button" onClick={() => navigate(`/group-chat?groupId=${encodeURIComponent(group.id)}`)} className="flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#9c1018]/25">
                      <Avatar name={group.name} src={group.profileImage} className="h-11 w-11" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-800">{group.name}</span>
                        <span className="mt-0.5 block truncate text-xs text-slate-500">Created by {group.creatorName}</span>
                      </span>
                      <span className="shrink-0 text-[11px] text-slate-400">{group.memberCount} members</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : <EmptyState icon={Users}>{EMPTY_MESSAGES.groups}</EmptyState>}
          </WallCard>

          <WallCard
            title="Hiring Job Openings"
            icon={BriefcaseBusiness}
            onContact={() => toast.info("Please contact the Operations team for hiring requests.")}
          >
            {overview.openings.length ? (
              <ul className="divide-y divide-slate-100">
                {overview.openings.map((opening) => (
                  <li key={opening.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-semibold text-slate-800">{opening.jobTitle}</p>
                      <p className="mt-1 text-xs text-slate-500">{opening.department}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                      {opening.openingCount} {opening.openingCount === 1 ? "Opening" : "Openings"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : <EmptyState icon={BriefcaseBusiness}>{EMPTY_MESSAGES.openings}</EmptyState>}
          </WallCard>

          <WallCard title="Birthday Buddies" icon={Cake}>
            <div className="pointer-events-none absolute inset-x-8 top-[68px] flex justify-between text-[#9c1018]/20">
              <Sparkles size={16} /><PartyPopper size={16} /><Sparkles size={16} />
            </div>
            {overview.birthdays.length ? (
              <ul className="space-y-2 pt-3">
                {overview.birthdays.map((person) => (
                  <li key={person.id} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white/90 p-2.5">
                    <Avatar name={person.fullName} src={person.avatar} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-800">{person.fullName}</span>
                      <span className="block truncate text-xs text-slate-500">{person.designation} · {eventLabel(person.occurrenceDate)}</span>
                    </span>
                    <button type="button" onClick={() => wishEmployee(person)} className="rounded-lg border border-[#9c1018]/20 px-2.5 py-1.5 text-xs font-semibold text-[#9c1018] hover:bg-[#9c1018]/5">Wish</button>
                  </li>
                ))}
              </ul>
            ) : <EmptyState icon={Cake}>{EMPTY_MESSAGES.birthdays}</EmptyState>}
            <div className="pointer-events-none absolute inset-x-8 bottom-5 flex justify-between text-[#9c1018]/20">
              <PartyPopper size={16} /><Sparkles size={16} /><PartyPopper size={16} />
            </div>
          </WallCard>

          <WallCard title="Work Anniversary" icon={Trophy}>
            <div className="pointer-events-none absolute inset-x-8 top-[68px] flex justify-between text-[#9c1018]/20">
              <Sparkles size={16} /><PartyPopper size={16} /><Sparkles size={16} />
            </div>
            {overview.anniversaries.length ? (
              <ul className="space-y-2 pt-3">
                {overview.anniversaries.map((person) => (
                  <li key={person.id} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white/90 p-2.5">
                    <Avatar name={person.fullName} src={person.avatar} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-800">{person.fullName}</span>
                      <span className="block truncate text-xs text-slate-500">{person.designation} · {eventLabel(person.occurrenceDate)}</span>
                    </span>
                    <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">{person.yearsCompleted} {person.yearsCompleted === 1 ? "Year" : "Years"}</span>
                  </li>
                ))}
              </ul>
            ) : <EmptyState icon={Trophy}>{EMPTY_MESSAGES.anniversaries}</EmptyState>}
            <div className="pointer-events-none absolute inset-x-8 bottom-5 flex justify-between text-[#9c1018]/20">
              <PartyPopper size={16} /><Sparkles size={16} /><PartyPopper size={16} />
            </div>
          </WallCard>

          <WallCard title="New Hires" icon={UserRound}>
            {overview.newHires.length ? (
              <ul className="divide-y divide-slate-100">
                {overview.newHires.map((person) => (
                  <li key={person.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <Avatar name={person.fullName} src={person.avatar} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-800">{person.fullName}</span>
                      <span className="block truncate text-xs text-slate-500">{person.designation}</span>
                    </span>
                    <span className="shrink-0 text-right text-[11px] text-slate-400">Joining<br />{dateLabel(person.joiningDate)}</span>
                  </li>
                ))}
              </ul>
            ) : <EmptyState icon={UserRound}>{EMPTY_MESSAGES.newHires}</EmptyState>}
          </WallCard>
        </div>
        )}
      </div>
    </main>
  );
}
