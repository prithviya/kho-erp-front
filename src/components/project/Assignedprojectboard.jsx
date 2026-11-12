import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  Search,
  FolderOpen,
  MessageSquare, 
  Calendar, 
  Clock, 
  MoreHorizontal, 
  Filter, 
  ArrowUpDown, 
  Activity, 
  CheckCircle2, 
  User, 
  Paperclip, 
  Image as ImageIcon, 
  X,
  Check,
  MessageCircle,
  UsersRound,
  Send,
  AtSign,
  Bell,
  UserCircle2,
  Play,
  FileText,
  Pencil,
  Download,
  Trash2,
  GripVertical,
  RefreshCw,
  ClipboardCheck,
  ChartNoAxesCombined
} from 'lucide-react';
import { toast } from 'react-toastify';
import taskService from '../../services/task.service';
import projectOnboardService from '../../services/projectOnboard.service';
import userManagementService from '../../services/userManagement.service';
import leadService from '../../services/lead.service';
import projectChatService from '../../services/projectChat.service';
import taskChatService from '../../services/taskChat.service';
import authService from '../../services/auth.service';
import ProjectFileLibrary from './ProjectFileLibrary';
import { subscribe } from '../../services/realtime.service';
import { getCanonicalRoles, getCurrentUser, isSuperAdmin } from '../../utils/auth';
import { getProfileImageUrl } from '../../utils/profileImage';

const formatTime12 = (value) => {
  const [hour, minute] = String(value || '').split(':').map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return value;
  return `${String(hour % 12 || 12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
};

function parseIds(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getId(value) {
  return value && typeof value === 'object' ? value.id ?? value.userId ?? value.serviceId : value;
}

function getAttachmentUrl(url) {
  if (!url || /^https?:\/\//i.test(url)) return url;
  const apiOrigin = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');
  return `${apiOrigin}${url}`;
}

function normalizeAttachments(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : parsed && typeof parsed === 'object' ? [parsed] : [];
    } catch {
      return [];
    }
  }
  return value && typeof value === 'object' ? [value] : [];
}

function getTimestampMillis(value) {
  if (!value) return null;
  if (!(value instanceof Date) && typeof value !== 'string' && typeof value !== 'number') return null;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function toDateTimeLocalValue(value) {
  const timestamp = getTimestampMillis(value);
  if (timestamp === null) return '';
  const localDate = new Date(timestamp - new Date(timestamp).getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function sortTaskTimeline(entries) {
  return entries
    .map((entry, index) => ({ entry, index, timestamp: getTimestampMillis(entry.createdAt) }))
    .sort((left, right) => {
      if (left.timestamp === null && right.timestamp === null) return left.index - right.index;
      if (left.timestamp === null) return 1;
      if (right.timestamp === null) return -1;
      return left.timestamp - right.timestamp || left.index - right.index;
    })
    .map((item) => item.entry);
}

function getAttachmentKind(attachment) {
  const mimeType = String(attachment?.mimeType || '').toLowerCase();
  const name = String(attachment?.name || '').toLowerCase();
  if (mimeType.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp)$/i.test(name)) return 'image';
  if (mimeType.startsWith('video/') || /\.(mp4|webm|ogg|mov)$/i.test(name)) return 'video';
  return 'document';
}

function ProfileAvatar({ profileImage, size, className }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [profileImage]);

  if (profileImage && !imageFailed) {
    return (
      <img
        src={getProfileImageUrl(profileImage)}
        alt=""
        className={`shrink-0 rounded-full object-cover ${className || ''}`}
        style={{ width: size, height: size }}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return <UserCircle2 size={size} className={className} />;
}

function Assignedprojectboard() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [currentProfileImage, setCurrentProfileImage] = useState(currentUser?.profileImage || '');
  const superAdmin = isSuperAdmin();
  const isManager = getCanonicalRoles(currentUser).includes('MANAGER');
  const isProjectAdmin = (currentUser?.roles || []).some((role) => (
    [role?.code, role?.name]
      .filter(Boolean)
      .some((value) => ['admin', 'administrator', 'systemadmin'].includes(
        String(value).trim().toLowerCase().replace(/[\s_-]+/g, '')
      ))
  ));

  useEffect(() => {
    let active = true;
    const fetchProfileImage = async () => {
      try {
        const response = await authService.getProfile();
        if (active) setCurrentProfileImage(response?.data?.profileImage || '');
      } catch (error) {
        console.error('Unable to load the profile photo for chat.', error);
      }
    };
    const handleProfileImageUpdate = (event) => {
      setCurrentProfileImage(event.detail || '');
    };

    fetchProfileImage();
    window.addEventListener('profile-image-updated', handleProfileImageUpdate);
    return () => {
      active = false;
      window.removeEventListener('profile-image-updated', handleProfileImageUpdate);
    };
  }, []);

  const getMessageSender = (senderId, sender) => {
    if (Number(senderId) === Number(currentUser?.id)) return 'Me';
    return sender ? `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || sender.email : 'User';
  };
  const normalizeTask = (task) => ({
    ...task,
    status: task.status || 'TODO',
    assignee: task.assignee ? `${task.assignee.firstName || ''} ${task.assignee.lastName || ''}`.trim() : 'Unassigned',
    commentsList: task.commentsList || [],
    commentsCount: task.commentsCount || 0,
    images: task.images || []
  });

  // Master Lists for Employees and Vendors
  const [employeesList, setEmployeesList] = useState([]);
  const extraAssigneeNames = (task) => {
    let extraIds = task?.additionalAssigneeIds;
    if (typeof extraIds === 'string') {
      try { extraIds = JSON.parse(extraIds); } catch { extraIds = []; }
    }
    return (Array.isArray(extraIds) ? extraIds : [])
      .map((id) => employeesList.find((user) => Number(user.id) === Number(id)))
      .filter(Boolean)
      .map((user) => `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email);
  };
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [loading, setLoading] = useState(true);
  const [allTasks, setAllTasks] = useState([]);
  const [myTasksFilter, setMyTasksFilter] = useState('all');
  const [myTasksLoading, setMyTasksLoading] = useState(false);

  // Columns & Tasks State
  const [columns, setColumns] = useState([]);

  // Modal State for Creating/Editing Task
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeColumnId, setActiveColumnId] = useState(null);
  
  // New Task Form Fields
  const [taskName, setTaskName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  
  // Assignment sub-menu state inside modal
  const [assigneeType, setAssigneeType] = useState('employee'); // 'employee' or 'vendor'
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [selectedVendorIds, setSelectedVendorIds] = useState([]);
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);

  // Active Task Detail Drawer State (Chat/Comments view)
  const [activeTask, setActiveTask] = useState(null);
  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const [taskViewTab, setTaskViewTab] = useState('activities');
  const [isRemovingAssignee, setIsRemovingAssignee] = useState(false);
  const [isReassigningTask, setIsReassigningTask] = useState(false);
  const [taskDetailsDraft, setTaskDetailsDraft] = useState({ dueDate: '', priority: 'MEDIUM', reminderAt: '' });
  const [isSavingTaskDetails, setIsSavingTaskDetails] = useState(false);
  const [undoingActivityId, setUndoingActivityId] = useState(null);
  const [taskChatText, setTaskChatText] = useState('');
  const [taskMentionQuery, setTaskMentionQuery] = useState('');
  const [taskMentionActive, setTaskMentionActive] = useState(false);
  const [taskChatMessages, setTaskChatMessages] = useState({});
  const [taskActivities, setTaskActivities] = useState({});
  const [taskUnreadCounts, setTaskUnreadCounts] = useState({});
  const [taskProjectIds, setTaskProjectIds] = useState({});
  const [taskChatAttachments, setTaskChatAttachments] = useState([]);
  const [taskCommentCounts, setTaskCommentCounts] = useState({});
  const seenTaskMessageIds = useRef(new Set());
  const deletedTaskMessageIds = useRef(new Set());
  const bumpTaskCommentCount = (taskId, delta) => {
    setTaskCommentCounts((current) => ({ ...current, [taskId]: (current[taskId] ?? 0) + delta }));
  };
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [isDeletingMessage, setIsDeletingMessage] = useState(false);
  const [editingMessageText, setEditingMessageText] = useState('');
  const [editingRemovedUrls, setEditingRemovedUrls] = useState([]);
  const [editingNewFiles, setEditingNewFiles] = useState([]);
  const [isDraggingEdit, setIsDraggingEdit] = useState(false);
  const [isDraggingChat, setIsDraggingChat] = useState(false);
  const [newTaskFiles, setNewTaskFiles] = useState([]);
  const [isDraggingNewTask, setIsDraggingNewTask] = useState(false);
  const [attachmentViewer, setAttachmentViewer] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const isDraggingTaskRef = useRef(false);
  const [commentText, setCommentText] = useState('');
  const [commentImage, setCommentImage] = useState(null);
  const [showProjectChat, setShowProjectChat] = useState(false);
  const [projectWorkspaceView, setProjectWorkspaceView] = useState('board');
  const [showProjectMembers, setShowProjectMembers] = useState(false);
  const [projectChatText, setProjectChatText] = useState('');
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionActive, setMentionActive] = useState(false);
  const [chatMessages, setChatMessages] = useState({});
  const [projectUnreadCounts, setProjectUnreadCounts] = useState({});
  const [projectLastMessageAt, setProjectLastMessageAt] = useState({});
  const [unreadMentionCount, setUnreadMentionCount] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedProjectId = searchParams.get('projectId');
  const requestedTaskId = searchParams.get('taskId');
  const hasInitializedProjectSelection = useRef(false);

  // Open Task Details & Communication Chat Drawer
  const openTaskDetails = (task, colId, tab) => {
    const updatedTask = { ...task, columnId: colId };
    setTaskViewTab(tab);
    setTaskDetailsDraft({
      dueDate: task.dueDate || '',
      priority: String(task.priority || 'MEDIUM').toUpperCase(),
      reminderAt: toDateTimeLocalValue(task.reminderAt)
    });
    setTaskUnreadCounts((current) => ({ ...current, [task.id]: 0 }));
    taskChatAttachments.forEach(({ preview }) => preview && URL.revokeObjectURL(preview));
    setTaskChatAttachments([]);
    setActiveTask(updatedTask);
    return updatedTask;
  };

  useEffect(() => {
    if (requestedTaskId) {
      const openTaskWithComments = (task) => {
        const normalized = normalizeTask(task);
        const projectId = normalized.projectOnboardId || normalized.project?.id || requestedProjectId;
        if (projectId) setSelectedProjectId(String(projectId));
        setProjectWorkspaceView('board');
        setShowProjectChat(false);
        openTaskDetails(normalized, normalized.serviceId, 'comments');
        setSearchParams({}, { replace: true });
      };

      const task = allTasks.find((item) => String(item.id) === String(requestedTaskId));
      if (task) {
        openTaskWithComments(task);
        return;
      }

      let active = true;
      taskService.getTaskById(requestedTaskId)
        .then((response) => {
          if (!active) return;
          const loadedTask = response?.data;
          if (loadedTask) {
            openTaskWithComments(loadedTask);
          }
        })
        .catch(() => {});

      return () => {
        active = false;
      };
    }

    if (!projects.length) return;

    if (requestedProjectId) {
      const project = projects.find((item) => String(item.id) === String(requestedProjectId));
      if (project) {
        setSelectedProjectId(String(project.id));
        setProjectWorkspaceView('board');
      }
    }

    if (searchParams.get('chat') === '1') {
      setShowProjectChat(true);
      if (requestedProjectId) {
        setProjectUnreadCounts((current) => ({ ...current, [requestedProjectId]: 0 }));
      }
    }

    if (requestedProjectId || searchParams.get('chat')) {
      setSearchParams({}, { replace: true });
    }
  }, [allTasks, projects, searchParams, setSearchParams, requestedProjectId, requestedTaskId]);

  useEffect(() => {
    if (!selectedProjectId) return;
    let mounted = true;
    projectChatService.list(selectedProjectId)
      .then((response) => {
        if (!mounted) return;
        const messages = (response?.data || []).map((item) => ({
          id: item.id,
          senderId: item.senderId,
          sender: item.sender ? `${item.sender.firstName || ''} ${item.sender.lastName || ''}`.trim() || item.sender.email : 'User',
          text: item.message,
          time: new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          mentionedUserIds: item.mentionedUserIds || []
        }));
        setChatMessages((current) => ({ ...current, [selectedProjectId]: messages }));
        const lastMessage = response?.data?.[response.data.length - 1];
        if (lastMessage?.createdAt) {
          setProjectLastMessageAt((current) => ({ ...current, [selectedProjectId]: lastMessage.createdAt }));
        }
      })
      .catch((error) => toast.error(error.message || 'Failed to load project chat.'));
    return () => { mounted = false; };
  }, [selectedProjectId]);

  useEffect(() => {
    return subscribe('project-message', (payload) => {
      if (!payload?.projectId || !payload?.message) return;
      const projectId = String(payload.projectId);
      const item = payload.message;
      const message = {
        id: item.id,
        senderId: item.senderId,
        sender: item.sender ? `${item.sender.firstName || ''} ${item.sender.lastName || ''}`.trim() || item.sender.email : 'User',
        text: item.message,
        time: new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mentionedUserIds: item.mentionedUserIds || []
      };
      setChatMessages((current) => {
        const existing = current[projectId] || [];
        if (existing.some((entry) => Number(entry.id) === Number(message.id))) return current;
        return { ...current, [projectId]: [...existing, message] };
      });
      setProjectLastMessageAt((current) => ({ ...current, [projectId]: item.createdAt || new Date().toISOString() }));
      if (projectId !== String(selectedProjectId) || !showProjectChat) {
        setProjectUnreadCounts((current) => ({ ...current, [projectId]: (current[projectId] || 0) + 1 }));
      }
    });
  }, [selectedProjectId, showProjectChat]);

  useEffect(() => {
    if (!activeTask?.id) return undefined;
    let mounted = true;
    taskChatService.list(activeTask.id)
      .then((response) => {
        if (!mounted) return;
        const messages = (response?.data || []).map((item) => ({
          id: item.id,
          senderId: item.senderId,
          sender: getMessageSender(item.senderId, item.sender),
          text: item.message,
          time: new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          createdAt: item.createdAt,
          editedAt: item.editedAt || null,
          mentionedUserIds: item.mentionedUserIds || [],
          attachments: normalizeAttachments(item.attachments)
        }));
        setTaskChatMessages((current) => {
          const existing = current[activeTask.id] || [];
          const mergedMessages = [...messages];
          existing.forEach((message) => {
            if (!mergedMessages.some((entry) => Number(entry.id) === Number(message.id))) {
              mergedMessages.push(message);
            }
          });
          return { ...current, [activeTask.id]: mergedMessages };
        });
        setTaskProjectIds((current) => ({ ...current, [activeTask.id]: activeTask.projectOnboardId }));
      })
      .catch((error) => toast.error(error.message || 'Failed to load task chat.'));
    return () => { mounted = false; };
  }, [activeTask?.id]);

  useEffect(() => {
    if (!activeTask?.id) return undefined;
    let mounted = true;
    taskService.getActivities(activeTask.id)
      .then((response) => {
        if (mounted) {
          setTaskActivities((current) => {
            const existing = current[activeTask.id] || [];
            const activities = [...(response?.data || [])];
            existing.forEach((activity) => {
              if (!activities.some((entry) => Number(entry.id) === Number(activity.id))) {
                activities.push(activity);
              }
            });
            const sortedActivities = sortTaskTimeline(activities);
            return { ...current, [activeTask.id]: sortedActivities };
          });
        }
      })
      .catch((error) => toast.error(error.message || 'Failed to load task activity.'));
    return () => { mounted = false; };
  }, [activeTask?.id]);

  useEffect(() => subscribe('task-message', (payload) => {
    if (!payload?.taskId || !payload?.message) return;
    const taskId = String(payload.taskId);
    const item = payload.message;
    const message = {
      id: item.id,
      senderId: item.senderId,
      sender: getMessageSender(item.senderId, item.sender),
      text: item.message,
      time: new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: item.createdAt,
      editedAt: item.editedAt || null,
      mentionedUserIds: item.mentionedUserIds || [],
      attachments: normalizeAttachments(item.attachments)
    };
    setTaskProjectIds((current) => ({ ...current, [taskId]: payload.projectOnboardId || current[taskId] }));
    setTaskChatMessages((current) => {
      const existing = current[taskId] || [];
      if (existing.some((entry) => Number(entry.id) === Number(message.id))) return current;
      return { ...current, [taskId]: [...existing, message] };
    });
    if (!seenTaskMessageIds.current.has(item.id)) {
      seenTaskMessageIds.current.add(item.id);
      bumpTaskCommentCount(taskId, 1);
    }
    if (Number(item.senderId) !== Number(currentUser?.id) && Number(activeTask?.id) !== Number(payload.taskId)) {
      setTaskUnreadCounts((current) => ({ ...current, [taskId]: (current[taskId] || 0) + 1 }));
    }
  }), [activeTask?.id, currentUser?.id]);

  useEffect(() => subscribe('task-message-updated', (payload) => {
    if (!payload?.taskId || !payload?.message) return;
    const taskId = String(payload.taskId);
    const item = payload.message;
    setTaskChatMessages((current) => ({
      ...current,
      [taskId]: (current[taskId] || []).map((entry) => (Number(entry.id) === Number(item.id)
        ? { ...entry, text: item.message, editedAt: item.editedAt || new Date().toISOString(), attachments: normalizeAttachments(item.attachments) }
        : entry))
    }));
  }), []);

  useEffect(() => subscribe('task-message-deleted', (payload) => {
    if (!payload?.taskId || !payload?.messageId) return;
    const taskId = String(payload.taskId);
    if (deletedTaskMessageIds.current.has(payload.messageId)) return;
    deletedTaskMessageIds.current.add(payload.messageId);
    seenTaskMessageIds.current.delete(payload.messageId);
    setTaskChatMessages((current) => ({
      ...current,
      [taskId]: (current[taskId] || []).filter((entry) => Number(entry.id) !== Number(payload.messageId))
    }));
    bumpTaskCommentCount(taskId, -1);
  }), []);

  useEffect(() => subscribe('task-activity', (payload) => {
    if (!payload?.taskId || !payload?.activity) return;
    const taskId = String(payload.taskId);
    const activity = payload.activity;
    setTaskActivities((current) => {
      const existing = current[taskId] || [];
      if (existing.some((entry) => Number(entry.id) === Number(activity.id))) return current;
      return {
        ...current,
        [taskId]: sortTaskTimeline([...existing, activity])
      };
    });
  }), []);

  useEffect(() => subscribe('task-reordered', (payload) => {
    if (!payload?.projectOnboardId || !Array.isArray(payload?.taskOrders)) return;
    if (String(payload.projectOnboardId) !== String(selectedProjectId)) return;

    setColumns((current) => {
      const orderMap = new Map(payload.taskOrders.map((o) => [Number(o.id), { sortOrder: o.sortOrder, serviceId: o.serviceId }]));
      return current.map((col) => {
        const matchingTasks = col.tasks.map((t) => {
          const orderInfo = orderMap.get(Number(t.id));
          return orderInfo ? { ...t, sortOrder: orderInfo.sortOrder, serviceId: orderInfo.serviceId ?? t.serviceId } : t;
        });
        matchingTasks.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        return { ...col, tasks: matchingTasks };
      });
    });
  }), [selectedProjectId]);

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([taskService.getTasks(), projectOnboardService.list(), userManagementService.getDirectory(), leadService.getCategoriesWithServices()])
      .then(([taskResult, projectResult, userResult, serviceResult]) => {
        if (!mounted) return;

        const records = taskResult.status === 'fulfilled' ? taskResult.value?.data || [] : [];
        setAllTasks(records.map(normalizeTask));
        const taskProjects = [...new Map(
          records
            .map((task) => task.project)
            .filter(Boolean)
            .map((project) => [Number(project.id), project])
        ).values()];
        const availableProjects = projectResult.status === 'fulfilled'
          ? projectResult.value?.data || []
          : taskProjects;
        const visibleTaskProjectIds = new Set(records.map((task) => Number(task.projectOnboardId)));
        const assignedProjects = superAdmin || isManager || isProjectAdmin
          ? availableProjects
          : availableProjects.filter((project) => visibleTaskProjectIds.has(Number(project.id))
            || parseIds(project.spocIds).some((id) => Number(getId(id)) === Number(currentUser?.id))
            || parseIds(project.projectManagerIds).some((id) => Number(getId(id)) === Number(currentUser?.id))
            || (project.reportingHeadId && Number(project.reportingHeadId) === Number(currentUser?.id)));

        setProjects(assignedProjects);
        if (!hasInitializedProjectSelection.current) {
          hasInitializedProjectSelection.current = true;
          const initialProject = assignedProjects.find((project) => String(project.id) === String(requestedProjectId))
            || assignedProjects[0];
          if (initialProject) {
            setSelectedProjectId(String(initialProject.id));
            setProjectWorkspaceView('board');
          }
        }
        if (userResult.status === 'fulfilled') {
          setEmployeesList((userResult.value?.data || []).filter((user) => user.isActive !== false));
        }
        const catalog = serviceResult.status === 'fulfilled' ? serviceResult.value?.data || [] : [];
        const services = catalog.flatMap((category) => category.services || category.Services || []);
        const selectedProject = assignedProjects.find((project) => String(project.id) === String(selectedProjectId));
        const requiredServiceIds = selectedProject
          ? parseIds(selectedProject.serviceIds)
          : assignedProjects.flatMap((project) => parseIds(project.serviceIds));
        const requiredServices = requiredServiceIds.map((value) => {
          const id = getId(value);
          return services.find((service) => Number(service.id) === Number(id) || String(service.name).toLowerCase() === String(id).toLowerCase()) || (typeof value === 'object' ? value : { id, name: `Service #${id}` });
        }).filter((service, index, list) => service && list.findIndex((item) => String(item.id) === String(service.id)) === index);
        const serviceColumns = requiredServices.map((service, index) => ({
          id: String(service.id),
          title: service.name,
          headerColor: ['bg-emerald-400', 'bg-amber-400', 'bg-rose-400', 'bg-blue-400', 'bg-purple-400'][index % 5],
          tasks: records.filter((task) => (!selectedProjectId || Number(task.projectOnboardId) === Number(selectedProjectId)) && Number(task.serviceId) === Number(service.id)).map(normalizeTask)
        }));
        setColumns(serviceColumns);

        if (taskResult.status === 'rejected') {
          toast.error(taskResult.reason?.message || 'Failed to load assigned tasks.');
        }
        if (projectResult.status === 'rejected' && taskResult.status === 'fulfilled' && (superAdmin || isManager)) {
          toast.info('Showing projects from your assigned tasks.');
        }
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [currentUser?.id, requestedProjectId, selectedProjectId, superAdmin, isManager]);

  const selectedProject = useMemo(
    () => projects.find((project) => String(project.id) === String(selectedProjectId)),
    [projects, selectedProjectId]
  );

  const selectedProjectPeople = useMemo(() => {
    const findUsers = (ids, resolvedUsers = []) => {
      const parsed = parseIds(ids).map(getId).map(Number).filter(Boolean);
      const existingUsers = Array.isArray(resolvedUsers) ? resolvedUsers.filter(Boolean) : (resolvedUsers ? [resolvedUsers] : []);
      const combined = [
        ...existingUsers,
        ...parsed.map((id) => employeesList.find((user) => Number(user.id) === Number(id))).filter(Boolean)
      ];
      return combined.filter((user, index, list) => user?.id && list.findIndex((item) => Number(item.id) === Number(user.id)) === index);
    };
    const projectTasks = columns.flatMap((column) => column.tasks);
    const assigned = projectTasks
      .map((task) => task.assignee)
      .filter((name, index, names) => name && name !== 'Unassigned' && names.indexOf(name) === index);

    const reportingHeadIds = [
      ...parseIds(selectedProject?.projectManagerIds),
      ...parseIds(selectedProject?.reportingHeadIds),
      ...(selectedProject?.reportingHeadId ? [selectedProject.reportingHeadId] : [])
    ];
    const initialReportingHeadUsers = [
      ...(Array.isArray(selectedProject?.reportingHeadUsers) ? selectedProject.reportingHeadUsers : []),
      ...(selectedProject?.reportingHeadUser ? [selectedProject.reportingHeadUser] : [])
    ];

    return {
      spocs: findUsers(selectedProject?.spocIds, selectedProject?.spocUsers),
      reportingHeads: findUsers(reportingHeadIds, initialReportingHeadUsers),
      assigned
    };
  }, [columns, employeesList, selectedProject]);

  const isSelectedProjectSpoc = Boolean(selectedProject && parseIds(selectedProject.spocIds)
    .some((id) => Number(getId(id)) === Number(currentUser?.id)));
  const isSelectedProjectReportingHead = Boolean(selectedProject && (
    parseIds(selectedProject.projectManagerIds).some((id) => Number(getId(id)) === Number(currentUser?.id))
    || parseIds(selectedProject.reportingHeadIds).some((id) => Number(getId(id)) === Number(currentUser?.id))
    || Number(selectedProject.reportingHeadId) === Number(currentUser?.id)
    || selectedProjectPeople.reportingHeads.some((rh) => Number(rh.id) === Number(currentUser?.id))
  ));
  const canReorderTasks = Boolean(selectedProject && (
    superAdmin || isManager || isSelectedProjectSpoc || isSelectedProjectReportingHead
  ));
  const canCreateTasks = superAdmin || isManager || isSelectedProjectSpoc;
  const canDeleteTask = (task) => {
    if (currentUser?.canDelete === false) return false;
    if (superAdmin) return true;
    const userId = Number(currentUser?.id);
    const project = task.project || selectedProject;
    const projectReportingHeadIds = [
      ...parseIds(project?.projectManagerIds),
      ...parseIds(project?.reportingHeadIds),
      ...(project?.reportingHeadId ? [project.reportingHeadId] : [])
    ].map(getId).map(Number).filter(Boolean);

    return Number(task.reportingHeadId) === userId
      || projectReportingHeadIds.includes(userId)
      || parseIds(project?.spocIds).some((id) => Number(getId(id)) === userId);
  };
  const canManageActiveTask = Boolean(activeTask && (superAdmin || (isManager
    && (Number(activeTask.reportingHeadId) === Number(currentUser?.id)
      || Number(activeTask.createdBy) === Number(currentUser?.id)
      || selectedProjectPeople.reportingHeads.some((rh) => Number(rh.id) === Number(currentUser?.id))))));
  const canEditTaskDetails = Boolean(activeTask && (
    superAdmin || isManager || Number(activeTask.createdBy) === Number(currentUser?.id)
  ));
  const spocProjects = useMemo(
    () => projects.filter((project) => parseIds(project.spocIds).some((id) => Number(getId(id)) === Number(currentUser?.id))),
    [currentUser?.id, projects]
  );
  const assignedProjects = useMemo(
    () => projects.filter((project) => !spocProjects.some((spocProject) => Number(spocProject.id) === Number(project.id))),
    [projects, spocProjects]
  );

  const sortProjects = (items) => [...items].sort((left, right) => {
    const unreadDifference = (combinedProjectUnreadCounts[right.id] || 0) - (combinedProjectUnreadCounts[left.id] || 0);
    if (unreadDifference) return unreadDifference;
    return new Date(projectLastMessageAt[right.id] || 0) - new Date(projectLastMessageAt[left.id] || 0);
  });
  const combinedProjectUnreadCounts = useMemo(() => {
    const counts = { ...projectUnreadCounts };
    Object.entries(taskUnreadCounts).forEach(([taskId, count]) => {
      const projectId = taskProjectIds[taskId];
      if (projectId) counts[projectId] = (counts[projectId] || 0) + count;
    });
    return counts;
  }, [projectUnreadCounts, taskProjectIds, taskUnreadCounts]);
  const unreadProjects = useMemo(
    () => sortProjects(projects.filter((project) => combinedProjectUnreadCounts[project.id] > 0)),
    [projects, projectLastMessageAt, combinedProjectUnreadCounts]
  );
  const unreadProjectIds = useMemo(() => new Set(unreadProjects.map((project) => Number(project.id))), [unreadProjects]);
  const sortedSpocProjects = useMemo(() => sortProjects(spocProjects.filter((project) => !unreadProjectIds.has(Number(project.id)))), [spocProjects, unreadProjectIds, projectLastMessageAt, combinedProjectUnreadCounts]);
  const sortedAssignedProjects = useMemo(() => sortProjects(assignedProjects.filter((project) => !unreadProjectIds.has(Number(project.id)))), [assignedProjects, unreadProjectIds, projectLastMessageAt, combinedProjectUnreadCounts]);

  const openProjectChat = (projectId = selectedProjectId) => {
    setSelectedProjectId(String(projectId));
    setProjectWorkspaceView('board');
    setShowProjectChat(true);
    setProjectUnreadCounts((current) => ({ ...current, [projectId]: 0 }));
  };

  const projectAssignees = useMemo(() => {
    if (selectedProject?.assignedUsers?.length) return selectedProject.assignedUsers;
    const assignedIds = new Set(parseIds(selectedProject?.assignedToIds).map(getId).map((id) => Number(id)));
    return employeesList.filter((employee) => assignedIds.has(Number(employee.id)));
  }, [employeesList, selectedProject]);

  const projectAssignedPeople = useMemo(() => [
    ...projectAssignees
      .filter((person) => !(person.roles || []).some((role) => /super.?admin/i.test(`${role.code || ''} ${role.name || ''}`)))
      .map((person) => ({ ...person, personType: 'Employee' })),
    ...(selectedProject?.assignedVendorUsers || []).map((vendor) => ({ ...vendor, personType: 'Vendor' }))
  ], [projectAssignees, selectedProject]);

  const projectMembers = useMemo(() => {
    const people = [
      ...selectedProjectPeople.spocs.map((person) => ({ ...person, memberRole: 'SPOC' })),
      ...selectedProjectPeople.reportingHeads.map((person) => ({ ...person, memberRole: 'Reporting Head' })),
      ...projectAssignedPeople.map((person) => ({ ...person, memberRole: person.personType || 'Employee' }))
    ];
    return people.filter((person, index, list) => person?.id && list.findIndex((item) => Number(item.id) === Number(person.id)) === index);
  }, [projectAssignedPeople, selectedProjectPeople]);

  const taskMentionOptions = projectMembers.filter((member) => {
    const name = `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.fullName || member.email || '';
    return !taskMentionQuery || name.toLowerCase().includes(taskMentionQuery.toLowerCase());
  });

  const insertTaskMention = (member) => {
    const name = `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.fullName || member.email;
    setTaskChatText((current) => current.replace(/@[\w ]*$/, `@${name} `));
    setTaskMentionQuery('');
    setTaskMentionActive(false);
  };

  const handleTaskChatSubmit = () => {
    if (!activeTask?.id || (!taskChatText.trim() && !taskChatAttachments.length)) return;
    const mentionedUserIds = projectMembers
      .filter((member) => {
        const name = `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.fullName || member.email || '';
        return taskChatText.includes(`@${name}`);
      })
      .map((member) => Number(member.id));
    const formData = new FormData();
    formData.append('message', taskChatText.trim());
    formData.append('mentionedUserIds', JSON.stringify(mentionedUserIds));
    taskChatAttachments.forEach(({ file }) => formData.append('attachments', file));
    taskChatService.send(activeTask.id, formData)
      .then((response) => {
        const item = response?.data;
        if (!item?.id) throw new Error('The server did not return the saved task message.');
        setTaskChatMessages((current) => {
          const existing = current[activeTask.id] || [];
          if (existing.some((entry) => Number(entry.id) === Number(item.id))) return current;
          const message = {
            id: item.id,
            senderId: item.senderId || currentUser?.id,
            sender: getMessageSender(item.senderId || currentUser?.id, item.sender),
            text: item.message || taskChatText.trim(),
            time: item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            createdAt: item.createdAt || new Date().toISOString(),
            mentionedUserIds: item.mentionedUserIds || mentionedUserIds,
            attachments: normalizeAttachments(item.attachments)
          };
          return { ...current, [activeTask.id]: [...existing, message] };
        });
        setTaskChatText('');
        taskChatAttachments.forEach(({ preview }) => preview && URL.revokeObjectURL(preview));
        setTaskChatAttachments([]);
        setTaskMentionQuery('');
        setTaskMentionActive(false);
      })
      .catch((error) => toast.error(error.message || 'Failed to send task message.'));
  };

  const handleTaskAttachmentChange = (event) => {
    const files = Array.from(event.target.files || []).map((file) => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }));
    setTaskChatAttachments((current) => {
      const next = [...current, ...files];
      next.slice(5).forEach(({ preview }) => preview && URL.revokeObjectURL(preview));
      return next.slice(0, 5);
    });
    event.target.value = '';
  };

  const removeTaskAttachment = (index) => {
    setTaskChatAttachments((current) => {
      const removed = current[index];
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return current.filter((_item, itemIndex) => itemIndex !== index);
    });
  };

  const activeProjectMessages = chatMessages[selectedProjectId] || [
    { id: 'sample-system', sender: 'System', text: 'Project chat started for this team.', time: '09:58 AM', system: true },
    { id: 'sample-welcome', sender: 'Gopi Kannan', text: 'Welcome to the project discussion. Share updates here.', time: '10:02 AM' }
  ];

  const mentionOptions = projectMembers.filter((member) => {
    const name = `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.fullName || member.email || '';
    return !mentionQuery || name.toLowerCase().includes(mentionQuery.toLowerCase());
  });

  const insertMention = (member) => {
    const name = `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.fullName || member.email;
    setProjectChatText((current) => current.replace(/@[\w ]*$/, `@${name} `));
    setMentionQuery('');
    setMentionActive(false);
  };

  const handleProjectChatSubmit = () => {
    if (!selectedProjectId || !projectChatText.trim()) return;
    const mentionedUserIds = projectMembers
      .filter((member) => {
        const name = `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.fullName || member.email || '';
        return projectChatText.includes(`@${name}`);
      })
      .map((member) => Number(member.id));
    projectChatService.send(selectedProjectId, { message: projectChatText.trim(), mentionedUserIds })
      .then((response) => {
        const item = response?.data;
        const message = {
          id: item?.id || Date.now(),
          senderId: item?.senderId || currentUser?.id,
          sender: item?.sender ? `${item.sender.firstName || ''} ${item.sender.lastName || ''}`.trim() || item.sender.email : `${currentUser?.firstName || 'You'} ${currentUser?.lastName || ''}`.trim(),
          text: item?.message || projectChatText.trim(),
          time: item?.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          mentionedUserIds
        };
        setChatMessages((current) => ({ ...current, [selectedProjectId]: [...activeProjectMessages, message] }));
        setProjectChatText('');
        setMentionQuery('');
        setMentionActive(false);
      })
      .catch((error) => toast.error(error.message || 'Failed to send project message.'));
  };

  // Open modal to add a task
  const handleOpenAddModal = (columnId) => {
    setActiveColumnId(columnId);
    setTaskName('');
    setProjectId(selectedProjectId);
    setDueDate('');
    setDueTime('');
    setNewTaskFiles([]);
    setAssigneeType('employee');
    setSelectedAssigneeIds([]);
    setSelectedEmployeeIds([]);
    setSelectedVendorIds([]);
    setIsModalOpen(true);
  };

  // Handle file/image selection for task creation
  const addNewTaskFiles = (fileList) => {
    const incoming = Array.from(fileList || []);
    const tooBig = incoming.filter((file) => file.size > 5 * 1024 * 1024);
    if (tooBig.length) toast.error('Files larger than 5MB were skipped.');
    setNewTaskFiles((current) => [...current, ...incoming.filter((file) => file.size <= 5 * 1024 * 1024)].slice(0, 5));
  };

  const addChatFiles = (fileList) => {
    const files = Array.from(fileList || []).map((file) => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }));
    setTaskChatAttachments((current) => {
      const next = [...current, ...files];
      next.slice(5).forEach(({ preview }) => preview && URL.revokeObjectURL(preview));
      return next.slice(0, 5);
    });
  };

  const startEditingMessage = (message) => {
    setEditingMessageId(message.id);
    setEditingMessageText(message.text || '');
    setEditingRemovedUrls([]);
    setEditingNewFiles([]);
  };

  const cancelEditingMessage = () => {
    setEditingMessageId(null);
    setEditingMessageText('');
    setEditingRemovedUrls([]);
    setEditingNewFiles([]);
  };

  const addEditingFiles = (fileList, message) => {
    const incoming = Array.from(fileList || []);
    if (incoming.some((file) => file.size > 5 * 1024 * 1024)) toast.error('Files larger than 5MB were skipped.');
    const valid = incoming.filter((file) => file.size <= 5 * 1024 * 1024);
    const keptCount = normalizeAttachments(message.attachments).filter((item) => !editingRemovedUrls.includes(item.url)).length;
    setEditingNewFiles((current) => [...current, ...valid].slice(0, Math.max(5 - keptCount, 0)));
  };

  const downloadAttachment = async (attachment) => {
    try {
      const response = await fetch(attachment.url);
      if (!response.ok) throw new Error('Download failed');
      const blobUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = attachment.name || 'download';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(attachment.url, '_blank', 'noopener');
    }
  };

  const handleSaveEditedMessage = async (message) => {
    const text = editingMessageText.trim();
    const keptCount = normalizeAttachments(message.attachments).filter((item) => !editingRemovedUrls.includes(item.url)).length;
    if (!text && !keptCount && !editingNewFiles.length) return;
    try {
      const formData = new FormData();
      formData.append('message', text);
      formData.append('removedUrls', JSON.stringify(editingRemovedUrls));
      editingNewFiles.forEach((file) => formData.append('attachments', file));
      const response = await taskChatService.update(activeTask.id, message.id, formData);
      const item = response?.data || {};
      setTaskChatMessages((current) => ({
        ...current,
        [activeTask.id]: (current[activeTask.id] || []).map((entry) => (Number(entry.id) === Number(message.id)
          ? { ...entry, text, editedAt: item.editedAt || new Date().toISOString(), attachments: normalizeAttachments(item.attachments ?? entry.attachments) }
          : entry))
      }));
      cancelEditingMessage();
    } catch (error) {
      toast.error(error.message || 'Failed to edit comment.');
    }
  };

  const handleDeleteMessage = async (message) => {
    setIsDeletingMessage(true);
    try {
      await taskChatService.remove(activeTask.id, message.id);
      deletedTaskMessageIds.current.add(message.id);
      setTaskChatMessages((current) => ({
        ...current,
        [activeTask.id]: (current[activeTask.id] || []).filter((entry) => Number(entry.id) !== Number(message.id))
      }));
      setMessageToDelete(null);
    } catch (error) {
      toast.error(error.message || 'Failed to delete comment.');
    } finally {
      setIsDeletingMessage(false);
    }
  };

  // Save New Task
  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!taskName.trim()) return;
    if (!projectId || (!selectedEmployeeIds.length && !selectedVendorIds.length)) return;
    try {
      const [primaryId, ...extraIds] = selectedEmployeeIds;
      const created = await Promise.all([
        ...(primaryId ? [taskService.createTask({
          projectOnboardId: Number(projectId), serviceId: Number(activeColumnId), title: taskName.trim(), assignedToId: Number(primaryId),
          additionalAssigneeIds: extraIds.map(Number), dueDate: dueDate || null, dueTime: dueDate ? (dueTime || null) : null
        })] : []),
        ...selectedVendorIds.map((assignedVendorId) => taskService.createTask({
          projectOnboardId: Number(projectId), serviceId: Number(activeColumnId), title: taskName.trim(), assignedVendorId: Number(assignedVendorId), dueDate: dueDate || null, dueTime: dueDate ? (dueTime || null) : null
        }))
      ]);
      if (newTaskFiles.length) {
        const results = await Promise.allSettled(created.map((response) => {
          const newId = response?.data?.id;
          if (!newId) return Promise.resolve();
          const formData = new FormData();
          formData.append('message', '');
          formData.append('mentionedUserIds', JSON.stringify([]));
          newTaskFiles.forEach((file) => formData.append('attachments', file));
          return taskChatService.send(newId, formData);
        }));
        if (results.some((result) => result.status === 'rejected')) toast.error('Task created, but some files failed to upload.');
      }
      const assigneeCount = (selectedEmployeeIds.length ? 1 : 0) + selectedVendorIds.length;
      toast.success(`${assigneeCount} task${assigneeCount > 1 ? 's' : ''} created.`);
      setIsModalOpen(false);
      const response = await taskService.getTasks();
      const records = response?.data || [];
      setColumns((previous) => previous.map((column) => ({ ...column, tasks: records.filter((task) => (!selectedProjectId || Number(task.projectOnboardId) === Number(selectedProjectId)) && Number(task.serviceId) === Number(column.id)).map(normalizeTask) })));
    } catch (error) {
      toast.error(error.message || 'Failed to create task.');
    }
  };


  const handleOpenTaskDetails = (task, colId) => {
    if (isDraggingTaskRef.current) return;
    const updatedTask = openTaskDetails(task, colId, 'activities');
    if (updatedTask.status === 'TODO') {
      void handleStatusChange('IN_PROGRESS', updatedTask);
    }
  };

  const handleOpenMyTask = (task) => {
    const projectId = task.projectOnboardId || task.project?.id;
    if (projectId) setSelectedProjectId(String(projectId));
    setProjectWorkspaceView('board');
    setShowProjectChat(false);
    openTaskDetails(task, task.serviceId, 'comments');
  };

  const handleDragStart = (e, task, columnId, index) => {
    if (!canReorderTasks) return;
    isDraggingTaskRef.current = true;
    setDraggedItem({ task, sourceColumnId: columnId, sourceIndex: index });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(task.id));
  };

  const handleDragOverTask = (e, targetTask, targetColumnId) => {
    if (!canReorderTasks || !draggedItem) return;
    e.preventDefault();
    e.stopPropagation();
    if (draggedItem.task.id === targetTask.id) {
      setDropTarget(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const position = offsetY < rect.height / 2 ? 'before' : 'after';
    setDropTarget({ targetTaskId: targetTask.id, targetColumnId, position });
  };

  const handleDragOverColumn = (e, targetColumnId) => {
    if (!canReorderTasks || !draggedItem) return;
    e.preventDefault();
    setDropTarget((prev) => (prev?.targetColumnId === targetColumnId && prev?.targetTaskId ? prev : { targetColumnId, targetTaskId: null, position: 'end' }));
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDropTarget(null);
    }
  };

  const handleDrop = async (e, targetColumnId) => {
    if (!canReorderTasks || !draggedItem) return;
    e.preventDefault();
    e.stopPropagation();

    const { task: movingTask, sourceColumnId } = draggedItem;
    const finalDropTarget = dropTarget;

    setDraggedItem(null);
    setDropTarget(null);
    setTimeout(() => { isDraggingTaskRef.current = false; }, 150);

    if (finalDropTarget?.targetTaskId === movingTask.id) return;

    setColumns((previousColumns) => {
      const sourceCol = previousColumns.find((col) => col.id === sourceColumnId);
      const targetCol = previousColumns.find((col) => col.id === targetColumnId);
      if (!sourceCol || !targetCol) return previousColumns;

      const sourceTasks = sourceCol.tasks.filter((t) => t.id !== movingTask.id);
      const updatedMovingTask = {
        ...movingTask,
        serviceId: Number(targetColumnId)
      };

      let targetTasks = sourceColumnId === targetColumnId ? [...sourceTasks] : [...targetCol.tasks];

      if (finalDropTarget?.targetTaskId) {
        const targetIndex = targetTasks.findIndex((t) => t.id === finalDropTarget.targetTaskId);
        if (targetIndex !== -1) {
          const insertIndex = finalDropTarget.position === 'before' ? targetIndex : targetIndex + 1;
          targetTasks.splice(insertIndex, 0, updatedMovingTask);
        } else {
          targetTasks.push(updatedMovingTask);
        }
      } else {
        targetTasks.push(updatedMovingTask);
      }

      targetTasks = targetTasks.map((t, idx) => ({ ...t, sortOrder: idx }));

      const nextColumns = previousColumns.map((col) => {
        if (col.id === sourceColumnId && sourceColumnId === targetColumnId) {
          return { ...col, tasks: targetTasks };
        }
        if (col.id === sourceColumnId) {
          return { ...col, tasks: sourceTasks.map((t, idx) => ({ ...t, sortOrder: idx })) };
        }
        if (col.id === targetColumnId) {
          return { ...col, tasks: targetTasks };
        }
        return col;
      });

      const taskOrders = targetTasks.map((t, index) => ({
        id: t.id,
        sortOrder: index,
        serviceId: Number(targetColumnId)
      }));

      if (selectedProjectId) {
        taskService.reorderTasks({
          projectOnboardId: Number(selectedProjectId),
          taskOrders
        }).catch((err) => {
          toast.error(err.message || 'Failed to update task order.');
          setColumns(previousColumns);
        });
      }

      return nextColumns;
    });
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDropTarget(null);
    setTimeout(() => { isDraggingTaskRef.current = false; }, 150);
  };

  const handleDeleteTask = async (event, task) => {
    event.stopPropagation();
    if (deletingTaskId !== null) return;
    if (!window.confirm(`Delete task "${task.title}"? This action cannot be undone.`)) return;

    setDeletingTaskId(task.id);
    try {
      await taskService.deleteTask(task.id);
      setColumns((previous) => previous.map((column) => ({
        ...column,
        tasks: column.tasks.filter((item) => Number(item.id) !== Number(task.id))
      })));
      setActiveTask((current) => Number(current?.id) === Number(task.id) ? null : current);
      toast.success('Task deleted.');
    } catch (error) {
      toast.error(error.message || 'Failed to delete task.');
    } finally {
      setDeletingTaskId(null);
    }
  };

  // Post a comment with text/image inside task chat
  const handlePostComment = () => {
    if (!commentText.trim() && !commentImage) return;

    const newComment = {
      id: Date.now(),
      sender: 'SPOC / User',
      text: commentText,
      image: commentImage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedCommentsList = [...activeTask.commentsList, newComment];
    const updatedTask = { 
      ...activeTask, 
      commentsList: updatedCommentsList, 
      commentsCount: updatedCommentsList.length 
    };

    setActiveTask(updatedTask);
    setCommentText('');
    setCommentImage(null);

    // Update main columns state
    setColumns(columns.map(col => {
      if (col.id === activeTask.columnId) {
        return {
          ...col,
          tasks: col.tasks.map(t => t.id === updatedTask.id ? updatedTask : t)
        };
      }
      return col;
    }));
  };

  // Change Task Status (SPOC can set to Completed, etc.)
  const handleStatusChange = async (newStatus, taskToUpdate = activeTask) => {
    if (!taskToUpdate || taskToUpdate.status === newStatus) return;
    const updatedTask = { ...taskToUpdate, status: newStatus };
    setActiveTask((current) => current?.id === updatedTask.id ? updatedTask : current);
    try {
      await taskService.updateStatus(taskToUpdate.id, newStatus);
      setColumns((previous) => previous.map((col) => col.id === taskToUpdate.columnId
        ? { ...col, tasks: col.tasks.map((task) => task.id === updatedTask.id ? updatedTask : task) }
        : col));
    } catch (error) {
      setActiveTask((current) => current?.id === taskToUpdate.id
        ? { ...current, status: taskToUpdate.status }
        : current);
      toast.error(error.message || 'Failed to update task status.');
      return;
    }
    try {
      const response = await taskService.getActivities(taskToUpdate.id);
      setTaskActivities((current) => {
        const existing = current[taskToUpdate.id] || [];
        const activities = [...(response?.data || [])];
        existing.forEach((activity) => {
          if (!activities.some((entry) => Number(entry.id) === Number(activity.id))) activities.push(activity);
        });
        return { ...current, [taskToUpdate.id]: sortTaskTimeline(activities) };
      });
    } catch (error) {
      toast.error(error.message || 'Failed to refresh task activity.');
    }
  };

  const handleSaveTaskDetails = async () => {
    if (!activeTask?.id || !canEditTaskDetails || isSavingTaskDetails) return;
    const reminderAt = taskDetailsDraft.reminderAt
      ? new Date(taskDetailsDraft.reminderAt).toISOString()
      : null;
    setIsSavingTaskDetails(true);
    try {
      await taskService.updateTask(activeTask.id, {
        dueDate: taskDetailsDraft.dueDate || null,
        priority: taskDetailsDraft.priority,
        reminderAt
      });
      const updatedTask = {
        ...activeTask,
        dueDate: taskDetailsDraft.dueDate || null,
        priority: taskDetailsDraft.priority,
        reminderAt
      };
      setActiveTask((current) => current?.id === updatedTask.id ? updatedTask : current);
      setColumns((previous) => previous.map((column) => column.id === activeTask.columnId
        ? { ...column, tasks: column.tasks.map((task) => task.id === updatedTask.id ? updatedTask : task) }
        : column));
      toast.success('Task details updated.');

      try {
        const response = await taskService.getActivities(activeTask.id);
        setTaskActivities((current) => {
          const existing = current[activeTask.id] || [];
          const activities = [...(response?.data || [])];
          existing.forEach((activity) => {
            if (!activities.some((entry) => Number(entry.id) === Number(activity.id))) activities.push(activity);
          });
          return { ...current, [activeTask.id]: sortTaskTimeline(activities) };
        });
      } catch (error) {
        toast.error(error.message || 'Task details updated, but failed to refresh task activity.');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update task details.');
    } finally {
      setIsSavingTaskDetails(false);
    }
  };

  const handleRemoveTaskAssignee = async () => {
    if (!activeTask?.id || !activeTask.assignedToId || !canManageActiveTask || isRemovingAssignee) return;
    setIsRemovingAssignee(true);
    try {
      await taskService.updateTask(activeTask.id, { assignedToId: null });
    } catch (error) {
      toast.error(error.message || 'Failed to remove task assignee.');
      setIsRemovingAssignee(false);
      return;
    }

    const updatedTask = { ...activeTask, assignedToId: null, assignee: 'Unassigned' };
    setActiveTask((current) => current?.id === updatedTask.id ? updatedTask : current);
    setColumns((previous) => previous.map((column) => column.id === activeTask.columnId
      ? { ...column, tasks: column.tasks.map((task) => task.id === updatedTask.id ? updatedTask : task) }
      : column));

    try {
      const response = await taskService.getActivities(activeTask.id);
      setTaskActivities((current) => {
        const existing = current[activeTask.id] || [];
        const activities = [...(response?.data || [])];
        existing.forEach((activity) => {
          if (!activities.some((entry) => Number(entry.id) === Number(activity.id))) {
            activities.push(activity);
          }
        });
        return { ...current, [activeTask.id]: sortTaskTimeline(activities) };
      });
    } catch (error) {
      toast.error(error.message || 'Failed to refresh task activity.');
    } finally {
      setIsRemovingAssignee(false);
    }
  };

  const handleReassignTaskAssignee = async (event) => {
    const assigneeId = Number(event.target.value);
    if (!activeTask?.id || !assigneeId || !canManageActiveTask || isReassigningTask) return;
    setIsReassigningTask(true);
    try {
      await taskService.updateTask(activeTask.id, { assignedToId: assigneeId });
    } catch (error) {
      toast.error(error.message || 'Failed to reassign task.');
      setIsReassigningTask(false);
      return;
    }

    const assignee = projectMembers.find((member) => Number(member.id) === assigneeId);
    const assigneeName = assignee
      ? `${assignee.firstName || ''} ${assignee.lastName || ''}`.trim() || assignee.fullName || assignee.email
      : 'Unknown user';
    const updatedTask = { ...activeTask, assignedToId: assigneeId, assignee: assigneeName };
    setActiveTask((current) => current?.id === updatedTask.id ? updatedTask : current);
    setColumns((previous) => previous.map((column) => column.id === activeTask.columnId
      ? { ...column, tasks: column.tasks.map((task) => task.id === updatedTask.id ? updatedTask : task) }
      : column));

    try {
      const response = await taskService.getActivities(activeTask.id);
      setTaskActivities((current) => {
        const existing = current[activeTask.id] || [];
        const activities = [...(response?.data || [])];
        existing.forEach((entry) => {
          if (!activities.some((item) => Number(item.id) === Number(entry.id))) activities.push(entry);
        });
        return { ...current, [activeTask.id]: sortTaskTimeline(activities) };
      });
    } catch (error) {
      toast.error(error.message || 'Task reassigned, but failed to refresh task activity.');
    } finally {
      setIsReassigningTask(false);
    }
  };

  const handleUndoAssigneeRemoval = async (activity, assigneeId) => {
    if (!activeTask?.id || !canManageActiveTask || undoingActivityId !== null) return;
    setUndoingActivityId(activity.id);
    try {
      await taskService.updateTask(activeTask.id, { assignedToId: assigneeId });
    } catch (error) {
      toast.error(error.message || 'Failed to restore the task assignee.');
      setUndoingActivityId(null);
      return;
    }

    const assignee = employeesList.find((employee) => Number(employee.id) === Number(assigneeId));
    const assigneeName = assignee
      ? `${assignee.firstName || ''} ${assignee.lastName || ''}`.trim() || assignee.email
      : activity.newValue;
    const updatedTask = { ...activeTask, assignedToId: assigneeId, assignee: assigneeName };
    setActiveTask((current) => current?.id === updatedTask.id ? updatedTask : current);
    setColumns((previous) => previous.map((column) => column.id === activeTask.columnId
      ? { ...column, tasks: column.tasks.map((task) => task.id === updatedTask.id ? updatedTask : task) }
      : column));

    try {
      const response = await taskService.getActivities(activeTask.id);
      setTaskActivities((current) => {
        const existing = current[activeTask.id] || [];
        const activities = [...(response?.data || [])];
        existing.forEach((entry) => {
          if (!activities.some((item) => Number(item.id) === Number(entry.id))) activities.push(entry);
        });
        return { ...current, [activeTask.id]: sortTaskTimeline(activities) };
      });
    } catch (error) {
      toast.error(error.message || 'Assignee restored, but failed to refresh task activity.');
    } finally {
      setUndoingActivityId(null);
    }
  };

  // Helper to check if task is overdue
  const isOverdue = (dueDate, dueTime) => {
    if (!dueDate) return false;
    const dueDateTime = new Date(`${dueDate}T${dueTime || '23:59'}`);
    return new Date() > dueDateTime;
  };
  const loadMyTasks = async () => {
    try {
      setMyTasksLoading(true);
      const response = await taskService.getTasks();
      setAllTasks((response?.data || []).map(normalizeTask));
    } catch (error) {
      toast.error(error.message || 'Failed to load your tasks.');
    } finally {
      setMyTasksLoading(false);
    }
  };
  const todayDate = new Date();
  const todayKey = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;
  const taskBucket = (task) => {
    if (task.status === 'COMPLETED') return 'completed';
    if (!task.dueDate) return 'unscheduled';
    const dueDateKey = String(task.dueDate).slice(0, 10);
    if (dueDateKey < todayKey || isOverdue(task.dueDate, task.dueTime)) return 'overdue';
    if (dueDateKey === todayKey) return 'today';
    return 'upcoming';
  };
  const myTaskBuckets = allTasks.map((task) => ({ ...task, bucket: taskBucket(task) }));
  const myTaskFilters = [
    { key: 'all', label: 'All' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'today', label: 'Today' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'completed', label: 'Completed' }
  ];
  const myTaskCounts = myTaskBuckets.reduce((counts, task) => {
    counts.all += 1;
    if (counts[task.bucket] !== undefined) counts[task.bucket] += 1;
    return counts;
  }, { all: 0, overdue: 0, today: 0, upcoming: 0, completed: 0 });
  const visibleMyTasks = myTaskBuckets
    .filter((task) => myTasksFilter === 'all' || task.bucket === myTasksFilter)
    .sort((left, right) => {
      const leftDate = left.dueDate ? String(left.dueDate).slice(0, 10) : '9999-12-31';
      const rightDate = right.dueDate ? String(right.dueDate).slice(0, 10) : '9999-12-31';
      return leftDate.localeCompare(rightDate) || String(left.title || '').localeCompare(String(right.title || ''));
    });
  const formatTaskDate = (value) => {
    if (!value) return 'No due date';
    const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
    return Number.isNaN(date.getTime())
      ? 'No due date'
      : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const activeTaskMessages = activeTask
    ? taskChatMessages[activeTask.id] ?? activeTask.commentsList
    : [];
  const activeTaskActivities = activeTask ? taskActivities[activeTask.id] || [] : [];
  const activeTaskTimeline = sortTaskTimeline([
    ...activeTaskActivities.map((activity) => ({ type: 'activity', id: `activity-${activity.id}`, createdAt: activity.createdAt, data: activity })),
    ...activeTaskMessages.map((message) => ({ type: 'message', id: `message-${message.id}`, createdAt: message.createdAt, data: message }))
  ]);
  const taskDetailsChanged = Boolean(activeTask && (
    taskDetailsDraft.dueDate !== (activeTask.dueDate || '')
    || taskDetailsDraft.priority !== String(activeTask.priority || 'MEDIUM').toUpperCase()
    || taskDetailsDraft.reminderAt !== toDateTimeLocalValue(activeTask.reminderAt)
  ));

  return (
    <div className="assign-board-page flex h-full min-h-0 flex-col overflow-x-hidden bg-[#f5f7f5] font-sans text-slate-800">
      
      
      {/* Assigned Projects + Kanban Board Workspace */}
      <div className="assign-board-workspace flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        <aside aria-label="Project workspace" className="assign-board-projects w-full shrink-0 border-b border-slate-200 p-3 sm:p-4 md:w-56 md:border-b-0 md:border-r lg:ml-[14px] lg:my-[10px] lg:rounded-2xl">
          <div className="assign-board-workspace-heading mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em]">Workspace</p>
              <h2 className="text-base font-bold">My Projects</h2>
            </div>
            <span className="assign-board-project-count rounded-full px-2.5 py-1 text-xs font-semibold">{projects.length}</span>
          </div>
          <div className="assign-board-project-list flex gap-2 overflow-x-auto pb-1 md:block md:max-h-[calc(100vh-150px)] md:space-y-2 md:overflow-y-auto md:pb-0">
            <button
              type="button"
              onClick={() => { setSelectedProjectId(''); setProjectWorkspaceView('board'); }}
              className={`assign-board-all-projects flex min-w-44 items-center justify-between rounded-lg border px-3 py-3 text-left text-sm font-semibold transition md:w-full ${projectWorkspaceView === 'board' && !selectedProjectId ? 'is-selected' : ''}`}
            >
              <span className="flex min-w-0 items-center gap-2"><Search size={15} className="shrink-0" />All assigned projects</span>
            </button>
            <button
              type="button"
              onClick={() => { setProjectWorkspaceView('myTasks'); setShowProjectChat(false); void loadMyTasks(); }}
              aria-current={projectWorkspaceView === 'myTasks' ? 'page' : undefined}
              className={`assign-board-my-tasks mt-2 flex min-w-44 items-center gap-3 rounded-lg border px-3 py-3 text-left text-sm font-semibold transition md:w-full ${projectWorkspaceView === 'myTasks' ? 'is-selected' : ''}`}
            >
              <ClipboardCheck size={17} /> My Tasks
            </button>
            {!!unreadProjects.length && <p className="assign-board-list-label mt-4 px-1 text-[10px] font-bold uppercase tracking-[0.16em]">New messages</p>}
            {unreadProjects.map((project) => (
              <button
                type="button"
                key={`unread-${project.id}`}
                onClick={() => { setSelectedProjectId(String(project.id)); setProjectWorkspaceView('board'); }}
                className={`assign-board-project-card min-w-44 rounded-lg border px-3 py-3 text-left transition md:w-full ${projectWorkspaceView === 'board' && String(selectedProjectId) === String(project.id) ? 'is-selected' : ''}`}
              >
                <span className="flex items-center gap-2">
                  <span className="block min-w-0 flex-1 truncate text-sm font-semibold">{project.projectName}</span>
                  <span className="assign-board-unread inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold">{combinedProjectUnreadCounts[project.id]}</span>
                </span>
                <span className="mt-0.5 block truncate text-xs opacity-70">{project.companyName}</span>
              </button>
            ))}
            {!!spocProjects.length && <p className="assign-board-list-label mt-4 px-1 text-[10px] font-bold uppercase tracking-[0.16em]">SPOC Projects</p>}
            {sortedSpocProjects.map((project) => (
              <button
                type="button"
                key={project.id}
                onClick={() => { setSelectedProjectId(String(project.id)); setProjectWorkspaceView('board'); }}
                className={`assign-board-project-card min-w-44 rounded-lg border px-3 py-3 text-left transition md:w-full ${projectWorkspaceView === 'board' && String(selectedProjectId) === String(project.id) ? 'is-selected' : ''}`}
              >
                <span className="flex items-center gap-2">
                  <span className="block min-w-0 flex-1 truncate text-sm font-semibold">{project.projectName}</span>
                  {!!combinedProjectUnreadCounts[project.id] && <span className="assign-board-unread inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold">{combinedProjectUnreadCounts[project.id]}</span>}
                </span>
                <span className="mt-0.5 block truncate text-xs opacity-70">{project.companyName}</span>
              </button>
            ))}
            {!!assignedProjects.length && <p className="assign-board-list-label mt-4 px-1 text-[10px] font-bold uppercase tracking-[0.16em]">Assigned Projects</p>}
            {sortedAssignedProjects.map((project) => (
              <button
                type="button"
                key={project.id}
                onClick={() => { setSelectedProjectId(String(project.id)); setProjectWorkspaceView('board'); }}
                className={`assign-board-project-card min-w-44 rounded-lg border px-3 py-3 text-left transition md:w-full ${projectWorkspaceView === 'board' && String(selectedProjectId) === String(project.id) ? 'is-selected' : ''}`}
              >
                <span className="flex items-center gap-2">
                  <span className="block min-w-0 flex-1 truncate text-sm font-semibold">{project.projectName}</span>
                  {!!combinedProjectUnreadCounts[project.id] && <span className="assign-board-unread inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold">{combinedProjectUnreadCounts[project.id]}</span>}
                </span>
                <span className="mt-0.5 block truncate text-xs opacity-70">{project.companyName}</span>
              </button>
            ))}
            {selectedProject && (
              <button
                type="button"
                onClick={() => { setProjectWorkspaceView('library'); setShowProjectChat(false); }}
                aria-current={projectWorkspaceView === 'library' ? 'page' : undefined}
                className={`assign-board-project-action mt-2 flex min-w-44 items-center gap-2 rounded-lg border px-3 py-3 text-left text-sm font-semibold transition md:w-full ${projectWorkspaceView === 'library' ? 'is-selected' : ''}`}
              >
                <FolderOpen size={16} /> Library
              </button>
            )}
            {/* {selectedProject && (
              <button
                type="button"
                onClick={() => navigate(`/project-task-report?projectId=${encodeURIComponent(selectedProject.id)}`)}
                className="assign-board-project-action mt-2 flex min-w-44 items-center gap-2 rounded-lg border px-3 py-3 text-left text-sm font-semibold transition md:w-full"
              >
                <ChartNoAxesCombined size={16} /> Report
              </button>
            )} */}
            {!loading && !projects.length && <p className="assign-board-empty-projects min-w-56 rounded-lg p-3 text-xs md:min-w-0">No currently assigned projects.</p>}
          </div>
        </aside>

        <div className="assign-board-content flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#f4f5f9] p-3 sm:p-6 bottom-0 md:bottom-auto md:top-0">
        {selectedProject && projectWorkspaceView === 'library' ? (
          <ProjectFileLibrary key={selectedProject.id} projectId={selectedProject.id} projectName={selectedProject.projectName} />
        ) : (
        <>
        {projectWorkspaceView === 'myTasks' ? (
          <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] sm:p-5">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-4 border-b border-slate-100 px-1 pb-4">
              <div>
                <span className="inline-flex rounded-full bg-[#a90919] px-4 py-2 text-[10px] font-bold tracking-[0.2em] text-white shadow-sm">TASK MANAGEMENT</span>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">My Tasks</h2>
                <p className="mt-1 text-sm text-slate-500">Tasks across all your assigned projects.</p>
              </div>
              <button
                type="button"
                onClick={() => void loadMyTasks()}
                disabled={myTasksLoading}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw size={17} className={myTasksLoading ? 'animate-spin' : ''} />
                {myTasksLoading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
            <div className="mb-4 flex gap-2 overflow-x-auto border-b border-slate-100 px-1 pb-4">
              {myTaskFilters.map((filter) => (
                <button
                  type="button"
                  key={filter.key}
                  onClick={() => setMyTasksFilter(filter.key)}
                  aria-pressed={myTasksFilter === filter.key}
                  className={`whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition ${myTasksFilter === filter.key ? 'bg-[#a90919] text-white shadow-sm' : 'bg-[#f1f2f6] text-slate-600 hover:bg-slate-200'}`}
                >
                  {filter.label}<span className={`ml-2 inline-flex min-w-5 justify-center rounded-full px-1 ${myTasksFilter === filter.key ? 'bg-white/15 text-white' : 'bg-white text-slate-600'}`}>{myTaskCounts[filter.key]}</span>
                </button>
              ))}
            </div>
            <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-slate-200 shadow-sm">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead className="sticky top-0 z-10 bg-[#18090c] text-xs uppercase tracking-wide text-white">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Task</th>
                    <th className="px-5 py-4 font-semibold">Project</th>
                    <th className="px-5 py-4 font-semibold">Due date</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myTasksLoading && !allTasks.length ? (
                    <tr><td colSpan="4" className="px-4 py-12 text-center text-slate-500">Loading tasks…</td></tr>
                  ) : visibleMyTasks.length ? visibleMyTasks.map((task) => {
                    const project = task.project || projects.find((item) => Number(item.id) === Number(task.projectOnboardId));
                    const statusStyle = {
                      TODO: 'bg-slate-100 text-slate-700',
                      IN_PROGRESS: 'bg-rose-50 text-[#b4232f]',
                      REVIEW: 'bg-amber-50 text-amber-700',
                      COMPLETED: 'bg-emerald-50 text-emerald-700'
                    }[task.status] || 'bg-slate-100 text-slate-700';
                    return (
                      <tr
                        key={task.id}
                        onClick={() => handleOpenMyTask(task)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            handleOpenMyTask(task);
                          }
                        }}
                        tabIndex={0}
                        className="cursor-pointer border-b border-slate-100 transition hover:bg-rose-50/30 focus:bg-rose-50/30 focus:outline-none"
                      >
                        <td className="px-5 py-4 font-semibold text-slate-800">{task.title || 'Untitled task'}</td>
                        <td className="px-5 py-4 text-slate-600">{project?.projectName || 'Unknown project'}</td>
                        <td className="px-5 py-4 text-slate-700">
                          {formatTaskDate(task.dueDate)}
                          {task.dueTime && <span className="ml-1.5 text-xs text-slate-400">{formatTime12(task.dueTime)}</span>}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold uppercase ${statusStyle}`}>
                            {task.status?.replaceAll('_', ' ') || 'TODO'}
                          </span>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan="4" className="px-4 py-12 text-center text-slate-500">No tasks in this view.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
        <>
        {selectedProject && (
          <div className="assign-board-project-summary mb-5 shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
            <div className="assign-board-project-summary-grid">
            <div className="assign-board-project-identity">
                
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">Selected project</p>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">{selectedProject.projectName}</h2>
                <p className="text-xs text-slate-500">{selectedProject.companyName}</p>
              </div>
              <div className="assign-board-summary-reporting text-xs">
                <p className="font-semibold uppercase tracking-wide text-slate-400">Reporting Head</p>
                <p className="mt-1 text-gray-700">{selectedProjectPeople.reportingHeads.map((user) => `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.fullName || user.email).join(', ') || 'Not assigned'}</p>
              </div>
              <div className="assign-board-summary-spoc text-xs">
                <p className="font-semibold uppercase tracking-wide text-slate-400">SPOC</p>
                <p className="mt-1 text-gray-700">{selectedProjectPeople.spocs.map((user) => `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.fullName || user.email).join(', ') || 'Not assigned'}</p>
              </div>
              <div className="assign-board-summary-assigned text-xs">
                <p className="font-semibold uppercase tracking-wide text-slate-400">Assigned to</p>
                <p className="mt-1 text-gray-700">
                  {projectAssignedPeople
                    .map((person) => {
                      const name = person.personType === 'Vendor'
                        ? person.vendor_name || person.vendor_company_name || person.vendor_email
                        : `${person.firstName || ''} ${person.lastName || ''}`.trim() || person.fullName || person.email;
                      return name ? `${name} (${person.personType})` : '';
                    })
                    .filter(Boolean)
                    .join(', ') || 'Not assigned'}
                </p>
              </div>
              <div className="assign-board-summary-actions flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowProjectMembers(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
                >
                  <UsersRound size={15} /> Members
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto pb-3">
        <div className="assign-board-columns grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {columns.map((col) => (
            <div key={col.id} data-tone={col.headerColor.replace('bg-', '').replace(/-\d+$/, '')} className="assign-board-column flex min-w-0 max-h-[calc(100vh-12rem)] w-full flex-col rounded-2xl border border-slate-200 bg-slate-100/80 shadow-sm" >
              
              {/* Column Header */}
              <div className="assign-board-column-header flex items-center justify-between rounded-t-2xl border-b border-slate-200 bg-white p-3.5">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${col.headerColor}`}></div>
                  <span className="text-sm font-bold">{col.title}</span>
                </div>
                <div className="assign-board-column-tools flex items-center gap-2">
                  {canCreateTasks && selectedProject && (
                    <button
                      onClick={() => handleOpenAddModal(col.id)}
                      className="assign-board-add-task rounded-full p-1.5"
                      title="Create task"
                    >
                      <Plus size={14} />
                    </button>
                  )}
                  <span className="assign-board-column-count rounded-full px-2.5 py-1 text-xs font-bold">
                    {col.tasks.length}
                  </span>
                </div>
              </div>

              {/* Column Content Area */}
              <div
                onDragOver={(e) => handleDragOverColumn(e, col.id)}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`p-3 flex-1 overflow-y-auto space-y-3 transition-colors ${
                  canReorderTasks && dropTarget?.targetColumnId === col.id && !dropTarget?.targetTaskId
                    ? 'bg-indigo-50/50 ring-2 ring-inset ring-indigo-300/60 rounded-b-2xl'
                    : ''
                }`}
              >
                
                {/* Task Cards */}
                {col.tasks.length > 0 ? (
                  col.tasks.map((task, taskIndex) => {
                    const overdue = isOverdue(task.dueDate, task.dueTime) && task.status !== 'COMPLETED';
                    const isCompleted = task.status === 'COMPLETED';
                    const isDragged = draggedItem?.task?.id === task.id;
                    const isTargetBefore = dropTarget?.targetTaskId === task.id && dropTarget?.position === 'before';
                    const isTargetAfter = dropTarget?.targetTaskId === task.id && dropTarget?.position === 'after';

                    return (
                      <div 
                        key={task.id} 
                        draggable={canReorderTasks}
                        onDragStart={(e) => handleDragStart(e, task, col.id, taskIndex)}
                        onDragOver={(e) => handleDragOverTask(e, task, col.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, col.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => handleOpenTaskDetails(task, col.id)}
                        className={`assign-board-task-card space-y-2 rounded-xl border bg-white p-3.5 shadow-[0_3px_10px_rgba(15,23,42,0.04)] transition-all ${
                          canReorderTasks ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                        } ${
                          isDragged
                            ? 'opacity-40 border-dashed border-indigo-400 bg-indigo-50/40 scale-[0.98]'
                            : 'hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md border-slate-200'
                        } ${
                          isTargetBefore ? 'border-t-4 !border-t-indigo-600 shadow-[0_-3px_8px_rgba(79,70,229,0.25)]' : ''
                        } ${
                          isTargetAfter ? 'border-b-4 !border-b-indigo-600 shadow-[0_3px_8px_rgba(79,70,229,0.25)]' : ''
                        }`}
                      >
                        <div className="flex justify-between overflow-hidden">
                          <div className="flex items-start gap-1.5 min-w-0 flex-1 pr-2">
                            {canReorderTasks && (
                              <span
                                className="mt-0.5 text-slate-300 hover:text-slate-600 shrink-0 cursor-grab active:cursor-grabbing"
                                title="Drag to reorder"
                              >
                                <GripVertical size={14} />
                              </span>
                            )}
                            <h4 className={`assign-board-task-title text-sm font-bold leading-5 break-words ${isCompleted ? 'line-through text-gray-400' : ''}`}>
                              {task.title}
                            </h4>
                          </div>
                          <div className="assign-board-task-actions flex items-center gap-1.5 shrink-0">
                            {canDeleteTask(task) && (
                              <button
                                type="button"
                                title="Delete task"
                                aria-label={`Delete task ${task.title}`}
                                disabled={deletingTaskId === task.id}
                                onClick={(event) => handleDeleteTask(event, task)}
                                className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                            {taskUnreadCounts[task.id] > 0 && <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{taskUnreadCounts[task.id]}</span>}
                            <span className="assign-board-comment-count inline-flex items-center gap-1 text-[10px]">
                              <MessageSquare size={12} />
                              {taskChatMessages[task.id]?.length ?? Math.max((task.commentsCount || 0) + (taskCommentCounts[task.id] || 0), 0)}
                            </span>
                          </div>
                        </div>
                        {!selectedProject && task.project?.projectName && (
                          <p className="truncate text-[11px] text-slate-400">{task.project.projectName}</p>
                        )}

                        {/* Task Thumbnail if uploaded */}
                        {task.images && task.images.length > 0 && (
                          <div className="h-20 w-full bg-gray-100 rounded overflow-hidden">
                            <img src={task.images[0]} alt="task attachment" className="w-full h-full object-cover" />
                          </div>
                        )}

                        <div className="assign-board-task-meta flex items-center justify-start gap-2 text-xs pt-1">
                          {(() => {
                            if (task.assignee === 'Unassigned') {
                              return <span className="assign-board-assignee rounded-full px-2 py-0.5 text-[10px] font-semibold">Unassigned</span>;
                            }
                            const names = [task.assignee, ...extraAssigneeNames(task)].map((name) => name.split(' ')[0]);
                            const chipClass = 'assign-board-assignee rounded-full px-2 py-0.5 text-[10px] font-semibold';
                            if (names.length <= 2) {
                              return names.map((name, index) => <span key={`${name}-${index}`} className={chipClass}>{name}</span>);
                            }
                            return <span className={`${chipClass} cursor-default`} title={names.join(', ')}>{names.length} assignees</span>;
                          })()}

                          {task.dueDate && (
                            <span                             className={`assign-board-due-date flex items-center space-x-1 px-1.5 py-0.5 rounded font-medium ${
                              overdue ? 'bg-red-100 text-red-600 border border-red-200' : 'bg-orange-50 text-orange-600'
                            }`}>
                              <Calendar size={12} />
                              <span>{task.dueDate} {task.dueTime && `@ ${formatTime12(task.dueTime)}`}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
                    <CheckCircle2 size={24} className="mb-2 text-gray-300" />
                    <p className="font-semibold text-gray-600 text-sm">No Tasks</p>
                    {canCreateTasks && <p className="text-[11px] text-gray-400 mt-1">Click + to add new Tasks.</p>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        </div>
        </>
        )}
        </>
        )}
        </div>
      </div>

      {/* --- MODAL: CREATE TASK WITH ASSIGN EMPLOYEE/VENDOR & DATE/TIME/IMAGE --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-4">
          <div className="max-h-[92vh] w-full max-w-md space-y-4 overflow-y-auto rounded-t-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">Workspace action</p>
                <h2 className="mt-1 text-base font-bold text-slate-900">Create New Task</h2>
              </div>
              <button title="Close" aria-label="Close" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4 text-sm">
              {/* Task Name */}
              <div>
                <label className="block text-gray-600 font-medium mb-1">Task Name</label>
                <input 
                  type="text" 
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  placeholder="Enter task name..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  required
                />
              </div>

              {/* Project and multi-assignee selector */}
              <div>
                <label className="block text-gray-600 font-medium mb-1">Project</label>
                <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100" required>
                  <option value="">Select project</option>
                  {selectedProject && <option value={selectedProject.id}>{selectedProject.projectName} - {selectedProject.companyName}</option>}
                </select>
              </div>

              <div className="relative">
                <label className="block text-gray-600 font-medium mb-1">Assigned To</label>
                <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-slate-300 bg-white p-2">
                  {projectAssignedPeople.map((person) => {
                    const isVendor = person.personType === 'Vendor';
                    const personId = isVendor ? person.vendorId : person.id;
                    const name = isVendor
                      ? person.vendor_name || person.vendor_company_name || person.vendor_email
                      : `${person.firstName || ''} ${person.lastName || ''}`.trim() || person.fullName || person.email;
                    const selected = isVendor ? selectedVendorIds.includes(personId) : selectedEmployeeIds.includes(personId);
                    return <label key={`${person.personType}-${personId}`} className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs ${selected ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50 text-gray-700'}`}>
                      <input type="checkbox" checked={selected} onChange={() => (isVendor
                        ? setSelectedVendorIds((current) => selected ? current.filter((id) => id !== personId) : [...current, personId])
                        : setSelectedEmployeeIds((current) => selected ? current.filter((id) => id !== personId) : [...current, personId]))} />
                      <User size={14} />
                      <span>{name} <span className="text-[10px] text-gray-400">({person.personType})</span></span>
                    </label>;
                  })}
                  {!projectAssignedPeople.length && <p className="p-2 text-xs text-gray-400">No assigned people found for this project.</p>}
                </div>
                {(selectedEmployeeIds.length + selectedVendorIds.length) > 0 && <p className="mt-1 text-[10px] text-indigo-600">{selectedEmployeeIds.length + selectedVendorIds.length} assignee(s) selected</p>}
              </div>

              {/* Due Date & Due Time */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Due Date</label>
                  <input 
                    type="date" 
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Due Time</label>
                  <div className="flex gap-1">
                    {(() => {
                      const [h24, min] = (dueTime || '').split(':');
                      const hasTime = Boolean(dueTime);
                      const hour24 = Number(h24);
                      const period = hour24 >= 12 ? 'PM' : 'AM';
                      const hour12 = hasTime ? String(hour24 % 12 || 12) : '';
                      const update = (nextHour12, nextMin, nextPeriod) => {
                        if (!nextHour12) { setDueTime(''); return; }
                        let hour = Number(nextHour12) % 12;
                        if (nextPeriod === 'PM') hour += 12;
                        setDueTime(`${String(hour).padStart(2, '0')}:${nextMin || '00'}`);
                      };
                      const selectClass = 'w-full border rounded px-2 py-2 text-xs';
                      return (
                        <>
                          <select aria-label="Hour" value={hour12} onChange={(e) => update(e.target.value, min, period)} className={selectClass}>
                            <option value="">--</option>
                            {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={String(i + 1)}>{String(i + 1).padStart(2, '0')}</option>)}
                          </select>
                          <select aria-label="Minute" value={hasTime ? min : ''} disabled={!hasTime} onChange={(e) => update(hour12, e.target.value, period)} className={selectClass}>
                            {!hasTime && <option value="">--</option>}
                            {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map((m) => <option key={m} value={m}>{m}</option>)}
                          </select>
                          <select aria-label="AM or PM" value={period} disabled={!hasTime} onChange={(e) => update(hour12, min, e.target.value)} className={selectClass}>
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                          </select>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-gray-600 font-medium mb-1">Attachments</label>
                <label
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingNewTask(true); }}
                  onDragLeave={() => setIsDraggingNewTask(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDraggingNewTask(false); addNewTaskFiles(e.dataTransfer.files); }}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed px-3 py-4 text-center text-xs ${isDraggingNewTask ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                >
                  Drag &amp; drop files here, or click to browse (max 5, 5MB each)
                  <input type="file" multiple className="hidden" onChange={(e) => { addNewTaskFiles(e.target.files); e.target.value = ''; }} />
                </label>
                {!!newTaskFiles.length && <ul className="mt-2 space-y-1">
                  {newTaskFiles.map((file, index) => (
                    <li key={`${file.name}-${index}`} className="flex items-center justify-between rounded bg-gray-50 px-2 py-1 text-[11px] text-gray-600">
                      <span className="truncate">{file.name}</span>
                      <button type="button" title="Remove file" onClick={() => setNewTaskFiles((current) => current.filter((_f, i) => i !== index))} className="ml-2 text-red-500 hover:text-red-700">✕</button>
                    </li>
                  ))}
                </ul>}
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded text-xs font-semibold hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 text-white rounded text-xs font-semibold hover:bg-indigo-700"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showProjectChat && selectedProject && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/35 backdrop-blur-[2px]">
          <div className="flex h-full w-full max-w-lg flex-col border-l border-slate-200 bg-[#f7f7fa] shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8f1018]">Project conversation</p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">{selectedProject.projectName}</h2>
                <p className="text-xs text-slate-500">{projectMembers.length} project members</p>
              </div>
              <button type="button" onClick={() => setShowProjectChat(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close project chat" title="Close project chat">
                <X size={19} />
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400"><MessageCircle size={14} /> Project Chat</div>
              {activeProjectMessages.map((message) => (
                (() => {
                  const isOwnMessage = Number(message.senderId) === Number(currentUser?.id);
                  if (message.system) {
                    return <div key={message.id} className="rounded-xl border border-rose-100 bg-rose-50 p-3.5 text-center shadow-sm"><p className="text-sm leading-6 text-[#780c13]">{message.text}</p></div>;
                  }
                  return (
                    <div key={message.id} className={`flex items-end gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                      {!isOwnMessage && <UserCircle2 size={28} className="shrink-0 text-[#9c1018]" />}
                      <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 shadow-sm ${isOwnMessage ? 'rounded-br-md bg-[#8f1018] text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-700'}`}>
                        <div className="flex items-center justify-between gap-4 text-[11px]">
                          <span className={`font-semibold ${isOwnMessage ? 'text-rose-50' : 'text-[#8f1018]'}`}>{isOwnMessage ? 'You' : message.sender}</span>
                          <span className={isOwnMessage ? 'text-emerald-100' : 'text-slate-400'}>{message.time}</span>
                        </div>
                        <p className="mt-1.5 text-sm leading-6">{message.text}</p>
                      </div>
                      {isOwnMessage && <ProfileAvatar profileImage={currentProfileImage} size={100} className="text-[#9c1018]" />}
                    </div>
                  );
                })()
              ))}
            </div>
            <div className="relative border-t border-slate-200 bg-white p-4">
              {mentionActive && mentionOptions.length > 0 && (
                <div className="absolute bottom-full left-4 right-4 mb-2 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                  {mentionOptions.map((member) => {
                    const name = `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.fullName || member.email;
                    return <button type="button" key={member.id} onClick={() => insertMention(member)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-rose-50"><UserCircle2 size={17} className="text-[#9c1018]" /><span>{name}</span><span className="ml-auto text-[10px] text-slate-400">{member.memberRole}</span></button>;
                  })}
                </div>
              )}
              <textarea
                rows="3"
                value={projectChatText}
                onChange={(event) => {
                  const value = event.target.value;
                  setProjectChatText(value);
                  const match = value.match(/@([\w ]*)$/);
                  setMentionQuery(match ? match[1] : '');
                  setMentionActive(Boolean(match));
                }}
                placeholder="Write a project update or use @ to mention someone..."
                className="w-full resize-none rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-[#9c1018] focus:ring-2 focus:ring-rose-100"
              />
              <div className="mt-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-slate-400"><AtSign size={15} /> Mention a member</span>
                <button type="button" onClick={handleProjectChatSubmit} className="inline-flex items-center gap-1.5 rounded-lg bg-[#8f1018] px-4 py-2 text-xs font-semibold text-white hover:bg-[#780c13]"><Send size={14} /> Send</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProjectMembers && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">Access list</p><h2 className="mt-1 text-lg font-bold text-slate-900">Project Members</h2></div><button type="button" title="Close" aria-label="Close" onClick={() => setShowProjectMembers(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button></div>
            <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">{projectMembers.map((member) => { const name = `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.fullName || member.email; return <div key={member.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"><UserCircle2 size={28} className="text-emerald-600" /><div><p className="text-sm font-semibold text-slate-800">{name}</p><p className="text-xs text-slate-500">{member.memberRole}</p></div></div>; })}</div>
          </div>
        </div>
      )}

      {/* --- TASK DETAILS & CHAT DRAWER (Communication & Comments View) --- */}
      {activeTask && (
        <div
          onClick={() => setActiveTask(null)}
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-[2px]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex h-dvh w-full max-w-5xl flex-col border-l border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3">
              <div className="flex items-center gap-2">
                <select
                  value={activeTask.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={!canCreateTasks}
                  className="rounded-md bg-[#8f1018] px-3 py-2 text-xs font-semibold text-white outline-none"
                >
                  <option value="TODO">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="REVIEW">Review</option>
                  <option value="COMPLETED">Completed</option>
                </select>
                <button type="button" className="rounded-md border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" title="Mark task complete">
                  <Check size={17} />
                </button>
                <div className="flex items-center gap-2 border-l border-slate-200 pl-3 text-xs text-slate-500">
                  <UsersRound size={18} className="text-amber-500" />
                  <span>Assigned to<br /><strong className="text-slate-800">{[activeTask.assignee || 'Unassigned', ...extraAssigneeNames(activeTask)].join(', ')}</strong></span>
                  {canManageActiveTask && <select
                    value=""
                    onChange={handleReassignTaskAssignee}
                    disabled={isReassigningTask || isRemovingAssignee}
                    className="max-w-28 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 outline-none hover:border-rose-300 focus:border-[#9c1018] disabled:cursor-wait disabled:opacity-50"
                    aria-label="Reassign task"
                    title="Reassign task"
                  >
                    <option value="" disabled>{isReassigningTask ? 'Saving…' : 'Reassign'}</option>
                    {projectMembers
                      .filter((member) => member.memberRole !== 'Vendor'
                        && member.isActive !== false
                        && Number(member.id) !== Number(activeTask.assignedToId))
                      .map((member) => {
                        const name = `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.fullName || member.email || `User ${member.id}`;
                        return <option key={member.id} value={member.id}>{name}</option>;
                      })}
                  </select>}
                  {activeTask.assignedToId && canManageActiveTask && <button
                    type="button"
                    onClick={handleRemoveTaskAssignee}
                    disabled={isRemovingAssignee}
                    className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-wait disabled:opacity-50"
                    title="Remove assignee"
                    aria-label="Remove assignee"
                  ><X size={14} /></button>}
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <button type="button" onClick={() => setActiveTask(null)} className="rounded-md p-2 hover:bg-slate-100" aria-label="Close task details" title="Close task details"><X size={19} /></button>
              </div>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(0,1fr)_250px]">
              <div className="flex min-h-0 flex-col border-r border-slate-200">
                <div className="border-b border-slate-200 px-7 pb-4 pt-7">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Task</p>
                  <h2 className={`max-w-2xl text-2xl font-medium leading-tight text-slate-900 ${activeTask.status === 'COMPLETED' ? 'line-through text-slate-400' : ''}`}>{activeTask.title}</h2>
                  {isOverdue(activeTask.dueDate, activeTask.dueTime) && activeTask.status !== 'COMPLETED' && <p className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600"><Clock size={14} /> Task is overdue</p>}
                </div>

                <div className="flex items-center gap-5 border-b border-slate-200 px-7 pt-4">
                  {['activities', 'comments'].map((tab) => <button key={tab} type="button" onClick={() => setTaskViewTab(tab)} className={`border-b-2 pb-3 text-sm font-medium capitalize ${taskViewTab === tab ? 'border-[#9c1018] text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>{tab}</button>)}
                  <span className="ml-auto pb-3 text-xs text-slate-400">{taskViewTab === 'activities' ? activeTaskActivities.length + activeTaskMessages.length : activeTaskMessages.length} updates</span>
                </div>

                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-white px-7 py-5">
                  {(taskViewTab === 'activities'
                    ? activeTaskTimeline
                    : activeTaskMessages.map((message) => ({ type: 'message', id: `message-${message.id}`, data: message }))
                  ).map((entry) => {
                    if (entry.type === 'activity') {
                      const activity = entry.data;
                      const actorName = activity.actorName
                        || `${activity.actor?.firstName || ''} ${activity.actor?.lastName || ''}`.trim()
                        || 'A user';
                      const activityTimestamp = getTimestampMillis(activity.createdAt);
                      const formatActivityValue = (value, isDateTime = false) => {
                        if (!value || value === 'Not set') return 'Not set';
                        if (!isDateTime) return value;
                        const timestamp = getTimestampMillis(value);
                        return timestamp === null
                          ? value
                          : new Date(timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
                      };
                      const activityText = activity.action === 'TASK_CREATED'
                        ? <>has created the Task <strong className="font-semibold text-slate-700">{activity.newValue}</strong>.</>
                        : activity.action === 'DUE_DATE_SET'
                          ? <>has set the Task due date to <strong className="font-semibold text-slate-700">{activity.newValue}</strong>.</>
                          : activity.action === 'STATUS_CHANGED'
                        ? <>has changed the Task status from <strong className="font-semibold text-slate-700">{activity.previousValue}</strong> to <strong className="font-semibold text-slate-700">{activity.newValue}</strong>.</>
                        : activity.action === 'ASSIGNEE_REMOVED'
                          ? <>has removed the assignee <strong className="font-semibold text-[#8f1018]">{activity.newValue}</strong> from this Task.</>
                          : activity.action === 'DUE_DATE_CHANGED'
                            ? <>has rescheduled the Task due date from <strong className="font-semibold text-slate-700">{activity.previousValue}</strong> to <strong className="font-semibold text-slate-700">{activity.newValue}</strong>.</>
                            : activity.action === 'PRIORITY_CHANGED'
                              ? <>has changed the Task priority from <strong className="font-semibold text-slate-700">{activity.previousValue}</strong> to <strong className="font-semibold text-slate-700">{activity.newValue}</strong>.</>
                              : activity.action === 'REMINDER_CHANGED'
                                ? <>has changed the Task reminder from <strong className="font-semibold text-slate-700">{formatActivityValue(activity.previousValue, true)}</strong> to <strong className="font-semibold text-slate-700">{formatActivityValue(activity.newValue, true)}</strong>.</>
                                : <>has assigned the Task to <strong className="font-semibold text-[#8f1018]">{activity.newValue}</strong>.</>;
                      const matchingAssignees = activity.action === 'ASSIGNEE_REMOVED'
                        ? employeesList.filter((employee) =>
                          `${employee.firstName || ''} ${employee.lastName || ''}`.trim().toLowerCase()
                            === String(activity.newValue || '').trim().toLowerCase())
                        : [];
                      const undoAssigneeId = Number(activity.previousAssigneeId)
                        || (matchingAssignees.length === 1 ? matchingAssignees[0].id : null);
                      return (
                        <div key={entry.id} className="flex items-start gap-3 border-b border-slate-100 pb-4">
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-50 text-[#8f1018]">
                            {activity.action === 'STATUS_CHANGED' ? <CheckCircle2 size={17} />
                              : activity.action === 'TASK_CREATED' ? <Plus size={17} />
                              : activity.action === 'DUE_DATE_CHANGED' || activity.action === 'DUE_DATE_SET' ? <Calendar size={17} />
                                : activity.action === 'REMINDER_CHANGED' ? <Bell size={17} />
                                  : activity.action === 'PRIORITY_CHANGED' ? <Activity size={17} />
                                    : <UsersRound size={17} />}
                          </span>
                          <div className="min-w-0 pt-1">
                            <p className="text-sm leading-6 text-slate-600">
                              <strong className="font-semibold text-[#8f1018]">{actorName}</strong> {activityText}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-400">
                              {activityTimestamp !== null
                                ? new Date(activityTimestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
                                : ''}
                            </p>
                            {activity.action === 'ASSIGNEE_REMOVED' && !activeTask.assignedToId && canManageActiveTask && undoAssigneeId && <button
                              type="button"
                              onClick={() => handleUndoAssigneeRemoval(activity, Number(undoAssigneeId))}
                              disabled={undoingActivityId !== null}
                              className="mt-1 text-xs font-medium text-[#8f1018] hover:text-[#780c13] disabled:cursor-wait disabled:opacity-50"
                            >{Number(undoingActivityId) === Number(activity.id) ? 'Undoing…' : 'Undo'}</button>}
                          </div>
                        </div>
                      );
                    }
                    const comm = entry.data;
                    const isOwnMessage = Number(comm.senderId) === Number(currentUser?.id);
                    const attachments = normalizeAttachments(comm.attachments);
                    return (
                    <div key={entry.id} className={`flex gap-3 pb-4 ${isOwnMessage ? 'flex-row-reverse justify-start' : 'justify-start'}`}>
                      {isOwnMessage
                        ? <ProfileAvatar profileImage={currentProfileImage} size={65} className="mt-1 text-[#9c1018]" />
                        : <UserCircle2 size={30} className="mt-1 shrink-0 text-slate-400" />}
                      <div className={`min-w-0 max-w-[78%] rounded-2xl border px-3.5 py-2.5 shadow-sm ${isOwnMessage ? 'border-rose-100 bg-rose-50' : 'border-slate-200 bg-white'}`}>
                        <div className={`flex flex-wrap items-baseline gap-3 ${isOwnMessage ? 'justify-end' : 'justify-between'}`}>
                          <p className="text-sm font-semibold text-[#8f1018]">{comm.sender}</p>
                          <p className="text-[11px] text-slate-400">{comm.time}</p>
                        </div>
                        {editingMessageId === comm.id ? (
                          <div
                            className={`mt-2 rounded-lg ${isDraggingEdit ? 'ring-2 ring-rose-300' : ''}`}
                            onDragOver={(e) => { e.preventDefault(); setIsDraggingEdit(true); }}
                            onDragLeave={() => setIsDraggingEdit(false)}
                            onDrop={(e) => { e.preventDefault(); setIsDraggingEdit(false); addEditingFiles(e.dataTransfer.files, comm); }}
                          >
                            <textarea value={editingMessageText} onChange={(e) => setEditingMessageText(e.target.value)} rows={2} className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {attachments.filter((item) => !editingRemovedUrls.includes(item.url)).map((item) => (
                                <span key={item.url} className="flex items-center gap-1 rounded bg-white px-2 py-1 text-[11px] text-slate-600 ring-1 ring-slate-200">
                                  <span className="max-w-[140px] truncate">{item.name}</span>
                                  <button type="button" title="Remove file" onClick={() => setEditingRemovedUrls((current) => [...current, item.url])} className="text-red-500 hover:text-red-700"><X size={12} /></button>
                                </span>
                              ))}
                              {editingNewFiles.map((file, index) => (
                                <span key={`${file.name}-${index}`} className="flex items-center gap-1 rounded bg-rose-50 px-2 py-1 text-[11px] text-[#8f1018] ring-1 ring-rose-100">
                                  <span className="max-w-[140px] truncate">{file.name}</span>
                                  <button type="button" title="Remove file" onClick={() => setEditingNewFiles((current) => current.filter((_f, i) => i !== index))} className="text-red-500 hover:text-red-700"><X size={12} /></button>
                                </span>
                              ))}
                            </div>
                            <label title="Drag and drop files here or click to browse" className={`mt-2 flex cursor-pointer items-center justify-center gap-1 rounded-lg border-2 border-dashed px-2 py-2 text-[11px] ${isDraggingEdit ? 'border-rose-400 bg-rose-50 text-[#8f1018]' : 'border-slate-300 text-slate-500 hover:bg-white'}`}>
                              <Paperclip size={12} /> Drag &amp; drop files here, or click to browse
                              <input type="file" multiple className="hidden" onChange={(e) => { addEditingFiles(e.target.files, comm); e.target.value = ''; }} />
                            </label>
                            <div className="mt-1 flex justify-end gap-2 text-xs">
                              <button type="button" title="Cancel editing" onClick={cancelEditingMessage} className="text-slate-500 hover:text-slate-700">Cancel</button>
                              <button type="button" title="Save edited comment" onClick={() => handleSaveEditedMessage(comm)} className="font-medium text-[#8f1018] hover:text-[#780c13]">Save</button>
                            </div>
                          </div>
                        ) : comm.text && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{comm.text}{comm.editedAt && <span className="ml-1 text-[10px] text-slate-400">(edited)</span>}</p>}
                        {comm.image && <div className="mt-3 max-w-sm overflow-hidden rounded-lg border border-slate-200"><img src={comm.image} alt="comment attachment" className="max-h-64 w-full object-cover" /></div>}
                        {editingMessageId !== comm.id && !!attachments.length && <div className="mt-3 flex flex-wrap gap-2">
                          {attachments.map((attachment) => {
                            const kind = getAttachmentKind(attachment);
                            const url = getAttachmentUrl(attachment.url);
                            if (kind === 'image') {
                              return <button type="button" key={attachment.url} onClick={() => setAttachmentViewer({ ...attachment, kind, url })} className="block max-w-xs overflow-hidden rounded-lg border border-slate-200 text-left">
                                <img src={url} alt={attachment.name || 'Task attachment'} className="max-h-64 w-full object-cover" />
                              </button>;
                            }
                            if (kind === 'video') {
                              return <button type="button" key={attachment.url} onClick={() => setAttachmentViewer({ ...attachment, kind, url })} className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-[#8f1018] hover:bg-rose-50">
                                <Play size={15} fill="currentColor" /> {attachment.name || 'Play video'}
                              </button>;
                            }
                            return <button type="button" key={attachment.url} onClick={() => setAttachmentViewer({ ...attachment, kind, url })} className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-[#8f1018] hover:bg-rose-50">
                              <FileText size={15} /> {attachment.name || 'Preview document'}
                            </button>;
                          })}
                        </div>}
                        {isOwnMessage && editingMessageId !== comm.id && <div className="mt-2 flex justify-end gap-2">
                          {comm.createdAt && Date.now() - new Date(comm.createdAt).getTime() <= 15 * 60 * 1000 && (
                            <button type="button" title="Edit comment (available for 15 minutes)" aria-label="Edit comment" onClick={() => startEditingMessage(comm)} className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-[#8f1018]"><Pencil size={14} /></button>
                          )}
                          <button type="button" title="Delete your comment" aria-label="Delete comment" onClick={() => setMessageToDelete(comm)} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></button>
                        </div>}
                      </div>
                    </div>
                    );
                  })}
                  {taskViewTab === 'activities' && !activeTaskTimeline.length && <div className="py-16 text-center text-sm text-slate-400">No activity recorded yet.</div>}
                  {taskViewTab === 'comments' && !activeTaskMessages.length && <div className="py-16 text-center text-sm text-slate-400">No comments yet. Start the task conversation below.</div>}
                </div>

                <div
                  className={`border-t border-slate-200 px-5 py-4 ${isDraggingChat ? 'bg-rose-50 ring-2 ring-inset ring-rose-300' : 'bg-slate-50'}`}
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingChat(true); }}
                  onDragLeave={() => setIsDraggingChat(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDraggingChat(false); addChatFiles(e.dataTransfer.files); }}
                >
                  {taskMentionActive && taskMentionOptions.length > 0 && (
                    <div className="relative mb-2 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                      {taskMentionOptions.map((member) => {
                        const name = `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.fullName || member.email;
                        const displayName = Number(member.id) === Number(currentUser?.id) ? 'Me' : name;
                        return <button type="button" key={member.id} onClick={() => insertTaskMention(member)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-rose-50"><UserCircle2 size={17} className="text-[#9c1018]" /><span>{displayName}</span><span className="ml-auto text-[10px] text-slate-400">{member.memberRole}</span></button>;
                      })}
                    </div>
                  )}
                  {!!taskChatAttachments.length && <div className="mb-3 flex flex-wrap gap-2">
                    {taskChatAttachments.map(({ file, preview }, index) => (
                      <div key={`${file.name}-${index}`} className="relative rounded-lg border border-slate-200 bg-white p-1">
                        {preview ? <img src={preview} alt={file.name} className="h-16 w-16 rounded object-cover" /> : <span className="block max-w-32 px-2 py-4 text-[10px] text-slate-600">{file.name}</span>}
                        <button type="button" onClick={() => removeTaskAttachment(index)} className="absolute -right-2 -top-2 rounded-full bg-slate-700 p-0.5 text-white" aria-label={`Remove ${file.name}`} title={`Remove ${file.name}`}><X size={12} /></button>
                      </div>
                    ))}
                  </div>}
                  <textarea
                    rows="3"
                    value={taskChatText}
                    onChange={(event) => {
                      const value = event.target.value;
                      setTaskChatText(value);
                      const match = value.match(/@([\w ]*)$/);
                      setTaskMentionQuery(match ? match[1] : '');
                      setTaskMentionActive(Boolean(match));
                    }}
                    placeholder="Write a task update or use @ to mention someone..."
                    className="w-full resize-none rounded-lg border border-slate-300 bg-white p-3 text-sm outline-none focus:border-[#9c1018] focus:ring-2 focus:ring-rose-100"
                  />
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-400 hover:text-[#8f1018]">
                        <Paperclip size={15} /> Attach
                        <input type="file" multiple onChange={handleTaskAttachmentChange} className="hidden" />
                      </label>
                      <span className="flex items-center gap-1.5 text-xs text-slate-400"><AtSign size={15} /> Mention a member</span>
                    </div>
                    <button type="button" onClick={handleTaskChatSubmit} className="rounded-md bg-[#8f1018] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#780c13]">Send Message</button>
                  </div>
                </div>
              </div>

              <aside className="hidden space-y-6 overflow-y-auto bg-slate-50/70 px-5 py-6 md:block">
                <div className="space-y-5 text-sm">
                  <div><p className="text-xs text-slate-500">Start date</p><p className="mt-1 font-medium text-slate-800">{activeTask.createdAt ? new Date(activeTask.createdAt).toLocaleDateString() : 'Not set'}</p></div>
                  <label className="block">
                    <span className="text-xs text-slate-500">Due on</span>
                    <input
                      type="date"
                      value={taskDetailsDraft.dueDate}
                      onChange={(event) => setTaskDetailsDraft((current) => ({ ...current, dueDate: event.target.value }))}
                      disabled={!canEditTaskDetails || isSavingTaskDetails}
                      className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm font-medium text-slate-800 outline-none focus:border-[#9c1018] disabled:border-transparent disabled:bg-transparent disabled:px-0 disabled:py-0"
                    />
                    {!taskDetailsDraft.dueDate && <span className="mt-1 block text-xs text-slate-500">Not set</span>}
                  </label>
                  <label className="block">
                    <span className="text-xs text-slate-500">Reminder</span>
                    <input
                      type="datetime-local"
                      value={taskDetailsDraft.reminderAt}
                      onChange={(event) => setTaskDetailsDraft((current) => ({ ...current, reminderAt: event.target.value }))}
                      disabled={!canEditTaskDetails || isSavingTaskDetails}
                      className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm font-medium text-slate-800 outline-none focus:border-[#9c1018] disabled:border-transparent disabled:bg-transparent disabled:px-0 disabled:py-0"
                    />
                    {!taskDetailsDraft.reminderAt && <span className="mt-1 block text-xs text-slate-500">Not set</span>}
                  </label>
                  <label className="block">
                    <span className="text-xs text-slate-500">Priority</span>
                    <select
                      value={taskDetailsDraft.priority}
                      onChange={(event) => setTaskDetailsDraft((current) => ({ ...current, priority: event.target.value }))}
                      disabled={!canEditTaskDetails || isSavingTaskDetails}
                      className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm font-medium text-slate-800 outline-none focus:border-[#9c1018] disabled:border-transparent disabled:bg-transparent disabled:px-0 disabled:py-0"
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                    </select>
                  </label>
                  {canEditTaskDetails && taskDetailsChanged && <button
                    type="button"
                    onClick={handleSaveTaskDetails}
                    disabled={isSavingTaskDetails}
                    className="w-full rounded-md bg-[#8f1018] px-3 py-2 text-xs font-semibold text-white hover:bg-[#780c13] disabled:cursor-wait disabled:opacity-60"
                  >{isSavingTaskDetails ? 'Saving…' : 'Save changes'}</button>}
                  <div><p className="text-xs text-slate-500">Category</p><p className="mt-1 font-medium text-slate-800">{activeTask.service?.name || 'Uncategorized'}</p></div>
                </div>
                <div className="border-t border-slate-200 pt-5">
                  <p className="text-sm font-semibold text-slate-700">About the Task</p>
                  <dl className="mt-4 space-y-3 text-xs">
                    <div><dt className="text-slate-400">Project</dt><dd className="mt-1 text-slate-700">{selectedProject?.projectName || 'Not set'}</dd></div>
                    <div><dt className="text-slate-400">Assigned to</dt><dd className="mt-1 text-slate-700">{[activeTask.assignee || 'Unassigned', ...extraAssigneeNames(activeTask)].join(', ')}</dd></div>
                    <div><dt className="text-slate-400">Created by</dt><dd className="mt-1 text-slate-700">{activeTask.creator ? `${activeTask.creator.firstName || ''} ${activeTask.creator.lastName || ''}`.trim() : 'Not available'}</dd></div>
                  </dl>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}

      {messageToDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4" onClick={() => !isDeletingMessage && setMessageToDelete(null)}>
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600"><Trash2 size={18} /></span>
              <h3 className="text-base font-semibold text-slate-800">Delete comment?</h3>
            </div>
            <p className="mt-3 text-sm text-slate-500">This comment will be permanently removed from the task. This action cannot be undone.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" title="Keep the comment" disabled={isDeletingMessage} onClick={() => setMessageToDelete(null)} className="rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200">Cancel</button>
              <button type="button" title="Delete the comment" disabled={isDeletingMessage} onClick={() => handleDeleteMessage(messageToDelete)} className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60">{isDeletingMessage ? 'Deleting…' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
      {attachmentViewer && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-label={`Preview ${attachmentViewer.name || 'attachment'}`} onClick={() => setAttachmentViewer(null)}>
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <p className="truncate text-sm font-semibold text-slate-800">{attachmentViewer.name || 'Attachment preview'}</p>
              <button type="button" onClick={() => setAttachmentViewer(null)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="Close attachment preview" title="Close preview"><X size={18} /></button>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-slate-100 p-4">
              {attachmentViewer.kind === 'image' && <img src={attachmentViewer.url} alt={attachmentViewer.name || 'Attachment'} className="max-h-[75vh] max-w-full object-contain" />}
              {attachmentViewer.kind === 'video' && <video src={attachmentViewer.url} controls autoPlay className="max-h-[75vh] max-w-full" />}
              {attachmentViewer.kind === 'document' && <iframe src={attachmentViewer.url} title={attachmentViewer.name || 'Document preview'} className="h-[75vh] w-full rounded border border-slate-200 bg-white" />}
            </div>
            <div className="flex items-center justify-end gap-4 border-t border-slate-200 px-4 py-3">
              <button type="button" title="Download this file" onClick={() => downloadAttachment(attachmentViewer)} className="flex items-center gap-1 text-xs font-semibold text-[#8f1018] hover:text-[#780c13]"><Download size={14} /> Download</button>
              <a href={attachmentViewer.url} target="_blank" rel="noreferrer" title="Open file in a new browser tab" className="text-xs font-semibold text-[#8f1018] hover:text-[#780c13]">Open in new tab</a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Assignedprojectboard;