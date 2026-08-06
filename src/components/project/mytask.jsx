import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, FolderKanban, ClipboardList, Calendar, Users,
  Building2, FileText, MessageSquare, Upload, CheckSquare, Settings,
  ChevronRight, Plus, Search, Bell, User, LogOut,
  Clock, CheckCircle, AlertCircle, PlayCircle, FileCheck, CalendarDays,
  Send, Paperclip, Image as ImageIcon, Video, File, MessageCircle,
  Activity, GitBranch, UserCheck, Eye, Pencil, Trash2, Filter,
  X, Menu, Home, Briefcase, Star, TrendingUp,
  ArrowRight, Circle, Check, AlertTriangle, MoreVertical,
  AtSign, UserPlus, BellRing, BadgeCheck, Flag, CalendarClock,
  UserX, UserCheck as UserCheckIcon, Clock as ClockIcon,
  Gift, Award, Zap, Shield, Crown, Users as UsersIcon
} from 'lucide-react';

const TaskBoard = () => {
  // User Roles
  const [currentUser, setCurrentUser] = useState({
    id: 2,
    name: 'Geetha',
    role: 'Content Writer',
    department: 'Content',
    isSuperAdmin: false,
    isAdmin: false,
    isManager: false
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [showOverdueModal, setShowOverdueModal] = useState(false);
  const [selectedOverdueTask, setSelectedOverdueTask] = useState(null);
  const [overdueReason, setOverdueReason] = useState('');
  const [overdueNote, setOverdueNote] = useState('');
  const [showTeamNotifications, setShowTeamNotifications] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [showExtraWorkModal, setShowExtraWorkModal] = useState(false);
  const [selectedExtraWorkTask, setSelectedExtraWorkTask] = useState(null);
  const [extraWorkReason, setExtraWorkReason] = useState('');
  const [extraWorkDetails, setExtraWorkDetails] = useState('');
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [selectedUserRole, setSelectedUserRole] = useState('');

  // Team members with roles
  const teamMembers = [
    { id: 1, name: 'Gokul', role: 'Project Manager', email: 'gokul@company.com', department: 'Management', isAdmin: false, isManager: true, isSuperAdmin: false },
    { id: 2, name: 'Geetha', role: 'Content Writer', email: 'geetha@company.com', department: 'Content', isAdmin: false, isManager: false, isSuperAdmin: false },
    { id: 3, name: 'Arjun', role: 'Video Editor', email: 'arjun@company.com', department: 'Design', isAdmin: false, isManager: false, isSuperAdmin: false },
    { id: 4, name: 'Sathish', role: 'Manager', email: 'sathish@company.com', department: 'Management', isAdmin: true, isManager: true, isSuperAdmin: false },
    { id: 5, name: 'Designer', role: 'Graphic Designer', email: 'designer@company.com', department: 'Design', isAdmin: false, isManager: false, isSuperAdmin: false },
    { id: 6, name: 'Priya', role: 'Content Writer', email: 'priya@company.com', department: 'Content', isAdmin: false, isManager: false, isSuperAdmin: false },
    { id: 7, name: 'Karthik', role: 'Senior Designer', email: 'karthik@company.com', department: 'Design', isAdmin: false, isManager: false, isSuperAdmin: false },
    { id: 8, name: 'Admin', role: 'System Admin', email: 'admin@company.com', department: 'Management', isAdmin: true, isManager: true, isSuperAdmin: true },
  ];

  // Projects Data with enhanced structure
  const [projects, setProjects] = useState([
    {
      id: 1,
      name: 'Purnaya',
      client: 'Purnaya Wellness',
      color: 'blue',
      deliverables: ['Posters', 'Reels', 'Blogs'],
      tasks: [
        {
          id: 1,
          name: 'Poster 1 - Wellness Campaign',
          type: 'poster',
          priority: 'High',
          dueDate: '2026-08-06',
          dueDateDisplay: 'Today 5 PM',
          status: 'content_writing',
          assignee: 'Geetha',
          stage: 1,
          week: 32,
          year: 2026,
          createdBy: 'Gokul',
          createdOn: '2026-08-01',
          assignedOn: '2026-08-01',
          comments: [],
          activity: [],
          statusUpdates: [],
          overdueRequested: false,
          overdueReason: '',
          overdueApproved: false,
          overdueApprovedBy: '',
          completionNote: '',
          completedBy: '',
          completedOn: '',
          reviewNotes: [],
          isExtraWork: false,
          extraWorkReason: '',
          extraWorkApproved: false,
          extraWorkApprovedBy: '',
          extraWorkRequestedBy: '',
          extraWorkRequestedOn: '',
          deliverables: ['Poster Design'],
          isDeliverable: true,
        },
        {
          id: 2,
          name: 'Poster 2 - Product Launch',
          type: 'poster',
          priority: 'Medium',
          dueDate: '2026-08-08',
          dueDateDisplay: 'Tomorrow',
          status: 'pending',
          assignee: 'Priya',
          stage: 0,
          week: 32,
          year: 2026,
          createdBy: 'Gokul',
          createdOn: '2026-08-01',
          assignedOn: '2026-08-01',
          comments: [],
          activity: [],
          statusUpdates: [],
          overdueRequested: false,
          completionNote: '',
          completedBy: '',
          completedOn: '',
          reviewNotes: [],
          isExtraWork: false,
          extraWorkReason: '',
          extraWorkApproved: false,
          deliverables: ['Poster Design'],
          isDeliverable: true,
        },
        {
          id: 3,
          name: 'Reel 1 - Social Media',
          type: 'reel',
          priority: 'High',
          dueDate: '2026-08-06',
          dueDateDisplay: 'Today 5 PM',
          status: 'video_editing',
          assignee: 'Arjun',
          stage: 2,
          week: 32,
          year: 2026,
          createdBy: 'Gokul',
          createdOn: '2026-08-01',
          assignedOn: '2026-08-01',
          comments: [],
          activity: [],
          statusUpdates: [],
          overdueRequested: false,
          completionNote: '',
          completedBy: '',
          completedOn: '',
          reviewNotes: [],
          isExtraWork: false,
          extraWorkReason: '',
          extraWorkApproved: false,
          deliverables: ['Reel Editing', 'Thumbnail Design'],
          isDeliverable: true,
        },
        {
          id: 4,
          name: 'Poster 3 - Brand Identity',
          type: 'poster',
          priority: 'High',
          dueDate: '2026-08-07',
          dueDateDisplay: 'Tomorrow',
          status: 'design',
          assignee: 'Designer',
          stage: 2,
          week: 32,
          year: 2026,
          createdBy: 'Gokul',
          createdOn: '2026-08-01',
          assignedOn: '2026-08-01',
          comments: [],
          activity: [],
          statusUpdates: [],
          overdueRequested: false,
          completionNote: '',
          completedBy: '',
          completedOn: '',
          reviewNotes: [],
          isExtraWork: false,
          extraWorkReason: '',
          extraWorkApproved: false,
          deliverables: ['Poster Design'],
          isDeliverable: true,
        },
        {
          id: 5,
          name: 'Blog Post - Wellness Tips',
          type: 'blog',
          priority: 'Medium',
          dueDate: '2026-08-10',
          dueDateDisplay: '4 Days',
          status: 'content_writing',
          assignee: 'Geetha',
          stage: 1,
          week: 32,
          year: 2026,
          createdBy: 'Gokul',
          createdOn: '2026-08-01',
          assignedOn: '2026-08-01',
          comments: [],
          activity: [],
          statusUpdates: [],
          overdueRequested: false,
          completionNote: '',
          completedBy: '',
          completedOn: '',
          reviewNotes: [],
          isExtraWork: false,
          extraWorkReason: '',
          extraWorkApproved: false,
          deliverables: ['Blog Writing'],
          isDeliverable: true,
        },
      ]
    },
    {
      id: 2,
      name: 'EasyForm2290',
      client: 'EasyForm2290',
      color: 'green',
      deliverables: ['Posters', 'Social Media Graphics'],
      tasks: [
        {
          id: 6,
          name: 'Poster - Tax Season Campaign',
          type: 'poster',
          priority: 'High',
          dueDate: '2026-08-07',
          dueDateDisplay: 'Tomorrow',
          status: 'design',
          assignee: 'Karthik',
          stage: 2,
          week: 32,
          year: 2026,
          createdBy: 'Gokul',
          createdOn: '2026-08-01',
          assignedOn: '2026-08-01',
          comments: [],
          activity: [],
          statusUpdates: [],
          overdueRequested: false,
          completionNote: '',
          completedBy: '',
          completedOn: '',
          reviewNotes: [],
          isExtraWork: false,
          extraWorkReason: '',
          extraWorkApproved: false,
          deliverables: ['Poster Design', 'Social Media Graphics'],
          isDeliverable: true,
        },
      ]
    },
    {
      id: 3,
      name: 'Extra Work - Urgent',
      client: 'Internal',
      color: 'orange',
      deliverables: ['Miscellaneous'],
      tasks: [
        {
          id: 7,
          name: 'Emergency Banner Design',
          type: 'poster',
          priority: 'High',
          dueDate: '2026-08-06',
          dueDateDisplay: 'Today 3 PM',
          status: 'design',
          assignee: 'Designer',
          stage: 2,
          week: 32,
          year: 2026,
          createdBy: 'Admin',
          createdOn: '2026-08-06',
          assignedOn: '2026-08-06',
          comments: [],
          activity: [],
          statusUpdates: [],
          overdueRequested: false,
          completionNote: '',
          completedBy: '',
          completedOn: '',
          reviewNotes: [],
          isExtraWork: true,
          extraWorkReason: 'Urgent client request - Branding',
          extraWorkApproved: true,
          extraWorkApprovedBy: 'Admin',
          extraWorkRequestedBy: 'Sathish',
          extraWorkRequestedOn: '2026-08-06',
          deliverables: ['Banner Design'],
          isDeliverable: true,
        },
      ]
    }
  ]);

  // Notifications
  const [notifications, setNotifications] = useState([
    { id: 1, message: '📢 Team Notification: Geetha completed Poster 1', time: '10:30 AM', read: false, type: 'team', targetRoles: ['all'] },
    { id: 2, message: 'Gokul assigned Poster 2 to Priya', time: '10:00 AM', read: false, type: 'assignment', targetRoles: ['all'] },
    { id: 3, message: '🔴 Admin added Extra Work: Emergency Banner Design', time: '09:30 AM', read: false, type: 'extra_work', targetRoles: ['admin', 'superadmin'] },
  ]);

  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState('all');

  // Workflow Stages
  const workflowStages = [
    { id: 0, label: '📝 Pending', color: 'gray' },
    { id: 1, label: '✍️ Content Writing', color: 'blue' },
    { id: 2, label: '🎨 Design', color: 'purple' },
    { id: 3, label: '👀 Review', color: 'yellow' },
    { id: 4, label: '✅ Approved', color: 'green' },
    { id: 5, label: '📅 Scheduled', color: 'indigo' },
    { id: 6, label: '🚀 Published', color: 'emerald' },
  ];

  const statusMap = {
    'pending': 0,
    'content_writing': 1,
    'content_completed': 1,
    'design': 2,
    'design_completed': 2,
    'video_editing': 2,
    'review': 3,
    'changes_requested': 3,
    'approved': 4,
    'scheduled': 5,
    'published': 6,
    'completed': 6,
  };

  const getStageIndex = (status) => statusMap[status] || 0;

  // Get current week number
  const getWeekNumber = (date) => {
    const d = new Date(date);
    const startDate = new Date(d.getFullYear(), 0, 1);
    const days = Math.floor((d - startDate) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startDate.getDay() + 1) / 7);
  };

  // Get tasks for selected project
  const getTasksForProject = () => {
    if (selectedProject === 'all') {
      return projects.flatMap(p => p.tasks);
    }
    const project = projects.find(p => p.id === parseInt(selectedProject));
    return project ? project.tasks : [];
  };

  const tasks = getTasksForProject();

  // Check overdue tasks
  const getOverdueTasks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return tasks.filter(task => {
      if (task.status === 'completed' || task.status === 'published') return false;
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today && !task.overdueApproved;
    });
  };

  // Get extra work tasks
  const getExtraWorkTasks = () => {
    return projects.flatMap(p => p.tasks).filter(t => t.isExtraWork);
  };

  // Group tasks by workflow stage
  const getTasksByStage = () => {
    const grouped = {};
    workflowStages.forEach(stage => {
      grouped[stage.id] = tasks.filter(t => getStageIndex(t.status) === stage.id);
    });
    return grouped;
  };

  const tasksByStage = getTasksByStage();
  const overdueTasks = getOverdueTasks();
  const extraWorkTasks = getExtraWorkTasks();

  // Weekly assignment view
  const getWeeklyTasks = () => {
    const currentWeek = getWeekNumber(new Date());
    return tasks.filter(task => task.week === currentWeek);
  };

  // Get counts
  const getCounts = () => {
    const allTasks = projects.flatMap(p => p.tasks);
    return {
      total: allTasks.length,
      pending: allTasks.filter(t => getStageIndex(t.status) === 0).length,
      inProgress: allTasks.filter(t => getStageIndex(t.status) === 1 || getStageIndex(t.status) === 2).length,
      review: allTasks.filter(t => getStageIndex(t.status) === 3).length,
      completed: allTasks.filter(t => getStageIndex(t.status) >= 4).length,
      overdue: getOverdueTasks().length,
      thisWeek: getWeeklyTasks().length,
      extraWork: extraWorkTasks.length,
      deliverables: allTasks.filter(t => t.isDeliverable).length,
    };
  };

  const counts = getCounts();

  // Get tasks by assignee for weekly view
  const getTasksByAssignee = () => {
    const weeklyTasks = getWeeklyTasks();
    const grouped = {};
    teamMembers.forEach(member => {
      grouped[member.name] = weeklyTasks.filter(t => t.assignee === member.name);
    });
    return grouped;
  };

  // Function to check if user has access based on role
  const hasRoleAccess = (requiredRoles) => {
    if (!requiredRoles) return true;
    if (requiredRoles.includes('all')) return true;
    if (currentUser.isSuperAdmin && requiredRoles.includes('superadmin')) return true;
    if (currentUser.isAdmin && requiredRoles.includes('admin')) return true;
    if (currentUser.isManager && requiredRoles.includes('manager')) return true;
    return false;
  };

  // Filter notifications based on user role
  const getFilteredNotifications = () => {
    let filtered = notifications;
    if (notificationFilter === 'all') {
      return filtered;
    }
    return filtered.filter(n => {
      if (!n.targetRoles) return true;
      if (n.targetRoles.includes('all')) return true;
      if (currentUser.isSuperAdmin && n.targetRoles.includes('superadmin')) return true;
      if (currentUser.isAdmin && n.targetRoles.includes('admin')) return true;
      if (currentUser.isManager && n.targetRoles.includes('manager')) return true;
      return false;
    });
  };

  // Handle extra work request
  const handleExtraWorkRequest = (task) => {
    setSelectedExtraWorkTask(task);
    setExtraWorkReason('');
    setExtraWorkDetails('');
    setShowExtraWorkModal(true);
  };

  // Submit extra work for approval
  const submitExtraWork = () => {
    if (!extraWorkReason.trim()) {
      alert('Please provide a reason for extra work.');
      return;
    }

    const updatedProjects = projects.map(project => ({
      ...project,
      tasks: project.tasks.map(task => {
        if (task.id === selectedExtraWorkTask.id) {
          // Notify Super Admin and Admin
          const adminMessage = {
            id: Date.now() + Math.random(),
            message: `🔴 Extra Work Request: "${task.name}" - ${extraWorkReason}. Requested by ${currentUser.name}`,
            time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            read: false,
            taskId: task.id,
            taskName: task.name,
            type: 'extra_work_request',
            targetRoles: ['admin', 'superadmin']
          };
          setNotifications(prev => [adminMessage, ...prev]);

          // Also notify all team members
          const teamMessage = {
            id: Date.now() + Math.random(),
            message: `📢 ${currentUser.name} added Extra Work: "${task.name}" - ${extraWorkReason}`,
            time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            read: false,
            taskId: task.id,
            taskName: task.name,
            type: 'extra_work_team',
            targetRoles: ['all']
          };
          setNotifications(prev => [teamMessage, ...prev]);

          return {
            ...task,
            isExtraWork: true,
            extraWorkReason: extraWorkReason,
            extraWorkDetails: extraWorkDetails,
            extraWorkRequestedBy: currentUser.name,
            extraWorkRequestedOn: new Date().toISOString(),
            extraWorkApproved: false,
            activity: [...(task.activity || []), {
              action: `🔴 Extra Work requested: "${extraWorkReason}" ${extraWorkDetails ? `Details: ${extraWorkDetails}` : ''}`,
              time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
              user: currentUser.name
            }]
          };
        }
        return task;
      })
    }));

    setProjects(updatedProjects);
    setShowExtraWorkModal(false);
    setSelectedExtraWorkTask(null);
    alert('✅ Extra Work request submitted for Admin/Super Admin approval.');
  };

  // Approve extra work (Admin/Super Admin)
  const approveExtraWork = (taskId) => {
    const updatedProjects = projects.map(project => ({
      ...project,
      tasks: project.tasks.map(task => {
        if (task.id === taskId) {
          setNotifications(prev => [{
            id: Date.now() + Math.random(),
            message: `✅ Extra Work approved for "${task.name}" by ${currentUser.name}`,
            time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            read: false,
            taskId: task.id,
            taskName: task.name,
            type: 'extra_work_approved',
            targetRoles: ['all']
          }, ...prev]);

          return {
            ...task,
            extraWorkApproved: true,
            extraWorkApprovedBy: currentUser.name,
            extraWorkApprovedOn: new Date().toISOString(),
            activity: [...(task.activity || []), {
              action: `✅ Extra Work approved by ${currentUser.name}`,
              time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
              user: currentUser.name
            }]
          };
        }
        return task;
      })
    }));

    setProjects(updatedProjects);
    alert('✅ Extra Work approved successfully!');
  };

  // Reject extra work (Admin/Super Admin)
  const rejectExtraWork = (taskId, reason) => {
    const updatedProjects = projects.map(project => ({
      ...project,
      tasks: project.tasks.map(task => {
        if (task.id === taskId) {
          setNotifications(prev => [{
            id: Date.now() + Math.random(),
            message: `❌ Extra Work rejected for "${task.name}" by ${currentUser.name}. Reason: ${reason || 'Not specified'}`,
            time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            read: false,
            taskId: task.id,
            taskName: task.name,
            type: 'extra_work_rejected',
            targetRoles: ['all']
          }, ...prev]);

          return {
            ...task,
            isExtraWork: false,
            extraWorkApproved: false,
            activity: [...(task.activity || []), {
              action: `❌ Extra Work rejected by ${currentUser.name}. Reason: ${reason || 'Not specified'}`,
              time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
              user: currentUser.name
            }]
          };
        }
        return task;
      })
    }));

    setProjects(updatedProjects);
    alert('❌ Extra Work rejected.');
  };

  // Handle overdue request
  const handleOverdueRequest = (task) => {
    setSelectedOverdueTask(task);
    setOverdueReason('');
    setOverdueNote('');
    setShowOverdueModal(true);
  };

  // Submit overdue reason for approval
  const submitOverdueReason = () => {
    if (!overdueReason.trim()) {
      alert('Please provide a reason for the delay.');
      return;
    }

    const updatedProjects = projects.map(project => ({
      ...project,
      tasks: project.tasks.map(task => {
        if (task.id === selectedOverdueTask.id) {
          setPendingApprovals(prev => [...prev, {
            id: Date.now(),
            taskId: task.id,
            taskName: task.name,
            reason: overdueReason,
            note: overdueNote,
            requestedBy: currentUser.name,
            requestedOn: new Date().toISOString(),
            status: 'pending',
            type: 'overdue_extension'
          }]);

          setNotifications(prev => [{
            id: Date.now() + Math.random(),
            message: `⏰ ${currentUser.name} requested deadline extension for "${task.name}". Reason: ${overdueReason}`,
            time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            read: false,
            taskId: task.id,
            taskName: task.name,
            type: 'overdue_request',
            targetRoles: ['manager', 'admin', 'superadmin']
          }, ...prev]);

          return {
            ...task,
            overdueRequested: true,
            overdueReason: overdueReason,
            overdueNote: overdueNote,
            overdueRequestedOn: new Date().toISOString(),
            activity: [...(task.activity || []), {
              action: `📢 Overdue extension requested: "${overdueReason}" ${overdueNote ? `Note: ${overdueNote}` : ''}`,
              time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
              user: currentUser.name
            }]
          };
        }
        return task;
      })
    }));

    setProjects(updatedProjects);
    setShowOverdueModal(false);
    setSelectedOverdueTask(null);
    alert('✅ Overdue reason submitted for manager approval.');
  };

  // Approve overdue extension
  const approveOverdueExtension = (taskId) => {
    const updatedProjects = projects.map(project => ({
      ...project,
      tasks: project.tasks.map(task => {
        if (task.id === taskId) {
          const newDueDate = new Date();
          newDueDate.setDate(newDueDate.getDate() + 2);
          
          setPendingApprovals(prev => prev.filter(p => p.taskId !== taskId));

          setNotifications(prev => [{
            id: Date.now() + Math.random(),
            message: `✅ Overdue extension approved by ${currentUser.name} for "${task.name}"`,
            time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            read: false,
            taskId: task.id,
            taskName: task.name,
            type: 'overdue_approved',
            targetRoles: ['all']
          }, ...prev]);

          return {
            ...task,
            overdueApproved: true,
            overdueApprovedBy: currentUser.name,
            overdueApprovedOn: new Date().toISOString(),
            dueDate: newDueDate.toISOString().split('T')[0],
            dueDateDisplay: 'Extended to ' + newDueDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
            activity: [...(task.activity || []), {
              action: `✅ Overdue extension approved by ${currentUser.name}. New deadline: ${newDueDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`,
              time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
              user: currentUser.name
            }]
          };
        }
        return task;
      })
    }));

    setProjects(updatedProjects);
    alert('✅ Deadline extension approved.');
  };

  // Reject overdue extension
  const rejectOverdueExtension = (taskId) => {
    const updatedProjects = projects.map(project => ({
      ...project,
      tasks: project.tasks.map(task => {
        if (task.id === taskId) {
          setPendingApprovals(prev => prev.filter(p => p.taskId !== taskId));
          
          setNotifications(prev => [{
            id: Date.now() + Math.random(),
            message: `❌ Overdue extension rejected by ${currentUser.name} for "${task.name}"`,
            time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            read: false,
            taskId: task.id,
            taskName: task.name,
            type: 'overdue_rejected',
            targetRoles: ['all']
          }, ...prev]);

          return {
            ...task,
            overdueRequested: false,
            activity: [...(task.activity || []), {
              action: `❌ Overdue extension rejected by ${currentUser.name}`,
              time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
              user: currentUser.name
            }]
          };
        }
        return task;
      })
    }));

    setProjects(updatedProjects);
    alert('❌ Overdue extension rejected.');
  };

  // Handle poster workflow - Content Writer to Designer
  const assignPosterToDesigner = (taskId) => {
    const updatedProjects = projects.map(project => ({
      ...project,
      tasks: project.tasks.map(task => {
        if (task.id === taskId && task.type === 'poster') {
          setNotifications(prev => [{
            id: Date.now() + Math.random(),
            message: `📋 Content completed for "${task.name}". Assigned to Designer for design.`,
            time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            read: false,
            taskId: task.id,
            taskName: task.name,
            type: 'assignment',
            targetRoles: ['all']
          }, ...prev]);

          return {
            ...task,
            status: 'design',
            assignee: 'Designer',
            stage: 2,
            activity: [...(task.activity || []), {
              action: `📋 Content completed → Assigned to Designer`,
              time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
              user: task.assignee
            }]
          };
        }
        return task;
      })
    }));

    setProjects(updatedProjects);
  };

  // Handle poster review - Designer to Content Writer for review
  const submitPosterForReview = (taskId) => {
    const updatedProjects = projects.map(project => ({
      ...project,
      tasks: project.tasks.map(task => {
        if (task.id === taskId && task.type === 'poster') {
          setNotifications(prev => [{
            id: Date.now() + Math.random(),
            message: `🎨 Designer completed design for "${task.name}". Ready for review.`,
            time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            read: false,
            taskId: task.id,
            taskName: task.name,
            type: 'review',
            targetRoles: ['all']
          }, ...prev]);

          return {
            ...task,
            status: 'review',
            assignee: 'Geetha',
            stage: 3,
            activity: [...(task.activity || []), {
              action: `🎨 Design completed → Ready for review by Content Writer`,
              time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
              user: 'Designer'
            }]
          };
        }
        return task;
      })
    }));

    setProjects(updatedProjects);
  };

  // Approve poster
  const approvePoster = (taskId) => {
    const updatedProjects = projects.map(project => ({
      ...project,
      tasks: project.tasks.map(task => {
        if (task.id === taskId && task.type === 'poster') {
          setNotifications(prev => [{
            id: Date.now() + Math.random(),
            message: `✅ Poster "${task.name}" approved by ${currentUser.name}. Ready for final review.`,
            time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            read: false,
            taskId: task.id,
            taskName: task.name,
            type: 'approval',
            targetRoles: ['all']
          }, ...prev]);

          return {
            ...task,
            status: 'approved',
            stage: 4,
            activity: [...(task.activity || []), {
              action: `✅ Poster approved by ${currentUser.name}`,
              time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
              user: currentUser.name
            }]
          };
        }
        return task;
      })
    }));

    setProjects(updatedProjects);
  };

  // Request rework on poster
  const requestPosterRework = (taskId, feedback) => {
    const updatedProjects = projects.map(project => ({
      ...project,
      tasks: project.tasks.map(task => {
        if (task.id === taskId && task.type === 'poster') {
          setNotifications(prev => [{
            id: Date.now() + Math.random(),
            message: `🔄 Rework requested for "${task.name}" by ${currentUser.name}. Feedback: ${feedback}`,
            time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            read: false,
            taskId: task.id,
            taskName: task.name,
            type: 'rework',
            targetRoles: ['all']
          }, ...prev]);

          return {
            ...task,
            status: 'design',
            assignee: 'Designer',
            stage: 2,
            reviewNotes: [...(task.reviewNotes || []), {
              feedback: feedback,
              requestedBy: currentUser.name,
              requestedOn: new Date().toISOString()
            }],
            activity: [...(task.activity || []), {
              action: `🔄 Rework requested by ${currentUser.name}: "${feedback}"`,
              time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
              user: currentUser.name
            }]
          };
        }
        return task;
      })
    }));

    setProjects(updatedProjects);
  };

  // Complete task from user's end
  const completeTaskFromMyEnd = (taskId, completionNote) => {
    const updatedProjects = projects.map(project => ({
      ...project,
      tasks: project.tasks.map(task => {
        if (task.id === taskId) {
          const teamNotification = {
            id: Date.now() + Math.random(),
            message: `🎉 ${task.assignee} completed "${task.name}" from their end! ${completionNote ? `Note: ${completionNote}` : ''}`,
            time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            read: false,
            taskId: task.id,
            taskName: task.name,
            type: 'team_completion',
            targetRoles: ['all']
          };

          setNotifications(prev => [teamNotification, ...prev]);
          setShowTeamNotifications(true);

          setNotifications(prev => [{
            id: Date.now() + Math.random(),
            message: `✅ ${task.assignee} marked "${task.name}" as completed. Ready for your review.`,
            time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            read: false,
            taskId: task.id,
            taskName: task.name,
            type: 'completion_review',
            targetRoles: ['manager', 'admin', 'superadmin']
          }, ...prev]);

          return {
            ...task,
            status: 'review',
            stage: 3,
            assignee: 'Gokul',
            completionNote: completionNote,
            completedBy: task.assignee,
            completedOn: new Date().toISOString(),
            activity: [...(task.activity || []), {
              action: `✅ Task marked as completed by ${task.assignee}. ${completionNote ? `Note: ${completionNote}` : ''}`,
              time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
              user: task.assignee
            }]
          };
        }
        return task;
      })
    }));

    setProjects(updatedProjects);
    
    if (selectedTask && selectedTask.id === taskId) {
      const updatedTask = updatedProjects.flatMap(p => p.tasks).find(t => t.id === taskId);
      setSelectedTask(updatedTask);
    }
  };

  // Handle high priority task postpone request
  const handleHighPriorityPostpone = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const today = new Date().toISOString().split('T')[0];
    if (task.priority === 'High' && task.dueDate === today) {
      const reason = prompt('Provide reason for postponing this high priority task (requires Reporting Head approval):');
      if (reason && reason.trim()) {
        setNotifications(prev => [{
          id: Date.now() + Math.random(),
          message: `⏰ ${task.assignee} requested to postpone High Priority task "${task.name}". Reason: ${reason}. Awaiting Reporting Head approval.`,
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          read: false,
          taskId: task.id,
          taskName: task.name,
          type: 'postpone_request',
          targetRoles: ['manager', 'admin', 'superadmin']
        }, ...prev]);

        setPendingApprovals(prev => [...prev, {
          id: Date.now(),
          taskId: task.id,
          taskName: task.name,
          reason: reason,
          requestedBy: task.assignee,
          requestedOn: new Date().toISOString(),
          type: 'postpone_request',
          status: 'pending',
          approver: 'Reporting Head'
        }]);

        alert('✅ Postpone request submitted for Reporting Head approval.');
      }
    } else {
      alert('This task is not high priority or not due today.');
    }
  };

  // Get status color
  const getStatusColor = (stageId) => {
    const colors = {
      gray: 'bg-gray-100 text-gray-700 border-gray-200',
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      purple: 'bg-purple-100 text-purple-700 border-purple-200',
      yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      green: 'bg-green-100 text-green-700 border-green-200',
      indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    };
    const stage = workflowStages.find(s => s.id === stageId);
    return colors[stage?.color] || colors.gray;
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      'High': 'bg-red-100 text-red-700',
      'Medium': 'bg-yellow-100 text-yellow-700',
      'Low': 'bg-green-100 text-green-700',
    };
    return colors[priority] || 'bg-gray-100 text-gray-700';
  };

  const getProjectColor = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    const colors = {
      blue: 'border-blue-500 bg-blue-50',
      green: 'border-green-500 bg-green-50',
      purple: 'border-purple-500 bg-purple-50',
      orange: 'border-orange-500 bg-orange-50',
      pink: 'border-pink-500 bg-pink-50',
    };
    return colors[project?.color] || colors.blue;
  };

  // Handle comment with mentions
  const handleSendComment = (taskId) => {
    if (!commentText.trim()) return;

    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(commentText)) !== null) {
      mentions.push(match[1]);
    }

    const newComment = {
      id: Date.now(),
      user: currentUser.name,
      message: commentText,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      mentions: mentions
    };

    const updatedProjects = projects.map(project => ({
      ...project,
      tasks: project.tasks.map(task => {
        if (task.id === taskId) {
          const updatedComments = [...(task.comments || []), newComment];
          const updatedActivity = [...(task.activity || []), {
            action: `💬 Comment added by ${currentUser.name}: "${commentText.substring(0, 50)}${commentText.length > 50 ? '...' : ''}"`,
            time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            user: currentUser.name
          }];
          
          mentions.forEach(mention => {
            const mentionedUser = teamMembers.find(m => m.name === mention);
            if (mentionedUser && mentionedUser.name !== currentUser.name) {
              setNotifications(prev => [{
                id: Date.now() + Math.random(),
                message: `${currentUser.name} mentioned you in task "${task.name}": "${commentText}"`,
                time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                read: false,
                taskId: task.id,
                taskName: task.name,
                type: 'mention',
                targetRoles: ['all']
              }, ...prev]);
            }
          });

          return { ...task, comments: updatedComments, activity: updatedActivity };
        }
        return task;
      })
    }));

    setProjects(updatedProjects);
    setCommentText('');
    setShowMentionList(false);
    
    if (selectedTask && selectedTask.id === taskId) {
      const updatedTask = updatedProjects.flatMap(p => p.tasks).find(t => t.id === taskId);
      setSelectedTask(updatedTask);
    }
  };

  // Mark notification as read
  const markNotificationAsRead = (id) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const unreadCount = getFilteredNotifications().filter(n => !n.read).length;

  // Role selector for Super Admin
  const RoleSelector = () => {
    if (!currentUser.isSuperAdmin && !currentUser.isAdmin) return null;
    
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button 
          onClick={() => setShowRoleSelector(!showRoleSelector)}
          className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Shield size={20} />
          <span className="text-sm font-medium">
            {currentUser.isSuperAdmin ? 'Super Admin' : currentUser.isAdmin ? 'Admin' : currentUser.role}
          </span>
        </button>
        {showRoleSelector && (
          <div className="absolute bottom-16 right-0 bg-white rounded-xl shadow-2xl border border-gray-200 w-64 p-3">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Switch Role</h4>
            {teamMembers.map(member => (
              <button
                key={member.id}
                onClick={() => {
                  setCurrentUser({
                    id: member.id,
                    name: member.name,
                    role: member.role,
                    department: member.department,
                    isSuperAdmin: member.isSuperAdmin || false,
                    isAdmin: member.isAdmin || false,
                    isManager: member.isManager || false
                  });
                  setShowRoleSelector(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-blue-50 flex items-center gap-2 ${currentUser.id === member.id ? 'bg-blue-50 text-blue-700' : ''}`}
              >
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-xs text-gray-400">{member.role}</p>
                </div>
                {member.isSuperAdmin && <Crown size={14} className="text-yellow-500 ml-auto" />}
                {member.isAdmin && <Shield size={14} className="text-blue-500 ml-auto" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render content based on active tab
  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard':
        return (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-8 gap-3 p-6">
              <div className="bg-white rounded-xl shadow-sm p-3 border border-gray-100">
                <p className="text-xs text-gray-400">Total</p>
                <p className="text-xl font-bold text-gray-800">{counts.total}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-3 border border-gray-100">
                <p className="text-xs text-gray-400">📝 Pending</p>
                <p className="text-xl font-bold text-gray-500">{counts.pending}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-3 border border-gray-100">
                <p className="text-xs text-gray-400">🔄 In Progress</p>
                <p className="text-xl font-bold text-blue-600">{counts.inProgress}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-3 border border-gray-100">
                <p className="text-xs text-gray-400">👀 Review</p>
                <p className="text-xl font-bold text-yellow-600">{counts.review}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-3 border border-gray-100">
                <p className="text-xs text-gray-400">✅ Completed</p>
                <p className="text-xl font-bold text-green-600">{counts.completed}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-3 border border-gray-100">
                <p className="text-xs text-gray-400">⏰ Overdue</p>
                <p className={`text-xl font-bold ${counts.overdue > 0 ? 'text-red-600 animate-pulse' : 'text-green-600'}`}>
                  {counts.overdue}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-3 border border-gray-100">
                <p className="text-xs text-gray-400">📦 Deliverables</p>
                <p className="text-xl font-bold text-purple-600">{counts.deliverables}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-3 border border-gray-100">
                <p className="text-xs text-gray-400">🔴 Extra Work</p>
                <p className={`text-xl font-bold ${counts.extraWork > 0 ? 'text-orange-600 animate-pulse' : 'text-gray-500'}`}>
                  {counts.extraWork}
                </p>
              </div>
            </div>

            {/* Extra Work Alert */}
            {extraWorkTasks.length > 0 && (
              <div className="px-6 pb-2">
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-orange-700">
                    <Gift size={20} />
                    <span className="font-semibold">🔴 Extra Work Tasks ({extraWorkTasks.length})</span>
                    {(currentUser.isAdmin || currentUser.isSuperAdmin) && (
                      <span className="text-xs ml-2 text-orange-600">(Admin/Super Admin can approve/reject)</span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {extraWorkTasks.map(task => (
                      <div key={task.id} className={`bg-white border rounded-lg px-3 py-1.5 text-sm flex items-center gap-2 ${task.extraWorkApproved ? 'border-green-300' : 'border-orange-300'}`}>
                        <span className="font-medium">{task.name}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-600">Reason: {task.extraWorkReason}</span>
                        {!task.extraWorkApproved && (currentUser.isAdmin || currentUser.isSuperAdmin) && (
                          <div className="flex gap-1">
                            <button 
                              onClick={() => approveExtraWork(task.id)}
                              className="px-2 py-0.5 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => {
                                const reason = prompt('Reason for rejection:');
                                if (reason !== null) {
                                  rejectExtraWork(task.id, reason);
                                }
                              }}
                              className="px-2 py-0.5 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {task.extraWorkApproved && (
                          <span className="text-xs text-green-600">✅ Approved by {task.extraWorkApprovedBy}</span>
                        )}
                        {!task.extraWorkApproved && !(currentUser.isAdmin || currentUser.isSuperAdmin) && (
                          <span className="text-xs text-yellow-600">⏳ Awaiting Admin Approval</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Overdue Warning */}
            {overdueTasks.length > 0 && (
              <div className="px-6 pb-2">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertTriangle size={20} />
                    <span className="font-semibold">⚠️ Overdue Tasks ({overdueTasks.length})</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {overdueTasks.map(task => (
                      <div key={task.id} className="bg-white border border-red-200 rounded-lg px-3 py-1.5 text-sm flex items-center gap-2">
                        <span className="font-medium">{task.name}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-red-600">Due: {task.dueDateDisplay}</span>
                        {!task.overdueRequested && (
                          <button 
                            onClick={() => handleOverdueRequest(task)}
                            className="px-2 py-0.5 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                          >
                            Raise
                          </button>
                        )}
                        {task.overdueRequested && !task.overdueApproved && (
                          <span className="text-xs text-yellow-600">⏳ Awaiting Approval</span>
                        )}
                        {task.overdueApproved && (
                          <span className="text-xs text-green-600">✅ Approved Extension</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Team Notifications */}
            <div className="px-6 pb-2">
              <button 
                onClick={() => setShowTeamNotifications(!showTeamNotifications)}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
              >
                <BellRing size={16} />
                Team Notifications
                {notifications.filter(n => n.type === 'team_completion' || n.type === 'team' || n.type === 'extra_work_team').length > 0 && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                    {notifications.filter(n => n.type === 'team_completion' || n.type === 'team' || n.type === 'extra_work_team').length}
                  </span>
                )}
              </button>
              {showTeamNotifications && (
                <div className="mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-4 max-h-60 overflow-y-auto">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">📢 Team Updates</h4>
                  {notifications.filter(n => n.type === 'team_completion' || n.type === 'team' || n.type === 'extra_work_team').map(n => (
                    <div key={n.id} className="border-b border-gray-100 py-2 last:border-0">
                      <p className="text-sm text-gray-700">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                    </div>
                  ))}
                  {notifications.filter(n => n.type === 'team_completion' || n.type === 'team' || n.type === 'extra_work_team').length === 0 && (
                    <p className="text-sm text-gray-400">No team notifications</p>
                  )}
                </div>
              )}
            </div>

            {/* Weekly Assignment View */}
            <div className="px-6 pb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700">📅 Weekly Assignments (Week {getWeekNumber(new Date())})</h3>
                <span className="text-xs text-gray-400">{counts.thisWeek} tasks this week</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {teamMembers.map(member => {
                  const memberTasks = getTasksByAssignee()[member.name] || [];
                  const memberOverdue = memberTasks.filter(t => 
                    getOverdueTasks().some(ot => ot.id === t.id)
                  );
                  const memberExtraWork = memberTasks.filter(t => t.isExtraWork);
                  
                  return (
                    <div key={member.id} className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800 text-sm">{member.name}</h4>
                          <p className="text-xs text-gray-400">{member.role}</p>
                        </div>
                        {memberOverdue.length > 0 && (
                          <span className="ml-auto text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                            ⚠️ {memberOverdue.length}
                          </span>
                        )}
                        {memberExtraWork.length > 0 && (
                          <span className="ml-auto text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                            🔴 {memberExtraWork.length}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        {memberTasks.map(task => {
                          const isOverdue = getOverdueTasks().some(ot => ot.id === task.id);
                          const isExtraWork = task.isExtraWork;
                          const isHighPriority = task.priority === 'High';
                          const today = new Date().toISOString().split('T')[0];
                          const isDueToday = task.dueDate === today && task.status !== 'completed';
                          
                          return (
                            <div 
                              key={task.id}
                              className={`flex items-center justify-between text-sm p-1.5 rounded-lg cursor-pointer hover:bg-gray-50
                                ${isOverdue ? 'bg-red-50 border border-red-200' : ''}
                                ${isExtraWork ? 'bg-orange-50 border border-orange-200' : ''}
                                ${isHighPriority && isDueToday ? 'border-l-2 border-red-500 pl-2' : ''}
                              `}
                              onClick={() => { setSelectedTask(task); setShowTaskDetail(true); }}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                {isExtraWork && <Gift size={12} className="text-orange-500" />}
                                <span className={`text-xs px-1.5 py-0.5 rounded ${getPriorityBadge(task.priority)}`}>
                                  {task.priority === 'High' && isDueToday ? '🔴' : task.priority.charAt(0)}
                                </span>
                                <span className="truncate text-xs">{task.name}</span>
                              </div>
                              <span className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                                {isOverdue ? '⏰ Overdue' : task.dueDateDisplay}
                              </span>
                            </div>
                          );
                        })}
                        {memberTasks.length === 0 && (
                          <p className="text-xs text-gray-400 text-center py-2">No tasks this week</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Workflow Board */}
            <div className="px-6 pb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700">📋 Workflow Board</h3>
                <span className="text-xs text-gray-400">{tasks.length} tasks</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {workflowStages.map((stage) => {
                  const stageTasks = tasksByStage[stage.id] || [];
                  const overdueInStage = stageTasks.filter(t => getOverdueTasks().some(ot => ot.id === t.id));
                  const extraWorkInStage = stageTasks.filter(t => t.isExtraWork);
                  
                  return (
                    <div key={stage.id} className="bg-gray-50 rounded-xl p-3 min-h-[300px] border border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-gray-600">{stage.label}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${stageTasks.length > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-400'}`}>
                          {stageTasks.length}
                          {overdueInStage.length > 0 && ` ⚠️${overdueInStage.length}`}
                          {extraWorkInStage.length > 0 && ` 🔴${extraWorkInStage.length}`}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        {stageTasks.map((task) => {
                          const project = projects.find(p => p.tasks.includes(task));
                          const isOverdue = getOverdueTasks().some(ot => ot.id === task.id);
                          const isExtraWork = task.isExtraWork;
                          const isHighPriority = task.priority === 'High';
                          const today = new Date().toISOString().split('T')[0];
                          const isDueToday = task.dueDate === today && task.status !== 'completed';
                          
                          return (
                            <div 
                              key={task.id} 
                              className={`bg-white rounded-xl p-3 shadow-sm border hover:shadow-md transition cursor-pointer
                                ${isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-100'}
                                ${isExtraWork ? 'border-orange-300 bg-orange-50' : ''}
                                ${isHighPriority && isDueToday ? 'border-l-4 border-l-red-500' : ''}
                              `}
                              onClick={() => { setSelectedTask(task); setShowTaskDetail(true); }}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1">
                                    {isExtraWork && <Gift size={14} className="text-orange-500" />}
                                    <h4 className="text-sm font-medium text-gray-800 truncate">
                                      {task.type === 'poster' && '📄 '}
                                      {task.type === 'reel' && '🎬 '}
                                      {task.type === 'blog' && '📝 '}
                                      {task.name}
                                    </h4>
                                  </div>
                                  <p className="text-xs text-gray-400 truncate">{project?.name} • {task.assignee}</p>
                                </div>
                                <div className="flex flex-col items-end gap-0.5">
                                  <span className={`text-xs px-1.5 py-0.5 rounded ${getPriorityBadge(task.priority)}`}>
                                    {task.priority}
                                  </span>
                                  {isOverdue && (
                                    <span className="text-xs text-red-600 font-medium animate-pulse">⏰ Overdue</span>
                                  )}
                                  {isExtraWork && !task.extraWorkApproved && (
                                    <span className="text-xs text-orange-600 font-medium">🔴 Extra</span>
                                  )}
                                </div>
                              </div>
                              <div className="mt-2 flex items-center justify-between text-xs">
                                <span className="text-gray-400">Due: {task.dueDateDisplay}</span>
                                {task.type === 'poster' && task.status === 'content_writing' && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      assignPosterToDesigner(task.id);
                                    }}
                                    className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded hover:bg-blue-600"
                                  >
                                    Send to Design
                                  </button>
                                )}
                                {task.type === 'poster' && task.status === 'design' && task.assignee === 'Designer' && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      submitPosterForReview(task.id);
                                    }}
                                    className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded hover:bg-purple-600"
                                  >
                                    Submit Review
                                  </button>
                                )}
                                {task.type === 'poster' && task.status === 'review' && task.assignee === 'Geetha' && (
                                  <div className="flex gap-1">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        approvePoster(task.id);
                                      }}
                                      className="text-xs bg-green-500 text-white px-2 py-0.5 rounded hover:bg-green-600"
                                    >
                                      Approve
                                    </button>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const feedback = prompt('Enter feedback for rework:');
                                        if (feedback && feedback.trim()) {
                                          requestPosterRework(task.id, feedback);
                                        }
                                      }}
                                      className="text-xs bg-yellow-500 text-white px-2 py-0.5 rounded hover:bg-yellow-600"
                                    >
                                      Rework
                                    </button>
                                  </div>
                                )}
                                {task.status !== 'completed' && task.status !== 'published' && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const note = prompt('Add completion note:');
                                      if (note !== null) {
                                        completeTaskFromMyEnd(task.id, note);
                                      }
                                    }}
                                    className="text-xs bg-green-500 text-white px-2 py-0.5 rounded hover:bg-green-600"
                                  >
                                    ✅ Complete
                                  </button>
                                )}
                              </div>
                              {isExtraWork && !task.extraWorkApproved && (currentUser.isAdmin || currentUser.isSuperAdmin) && (
                                <div className="mt-1 flex gap-1">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      approveExtraWork(task.id);
                                    }}
                                    className="text-xs bg-green-500 text-white px-2 py-0.5 rounded hover:bg-green-600"
                                  >
                                    Approve Extra
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const reason = prompt('Reason for rejection:');
                                      if (reason !== null) {
                                        rejectExtraWork(task.id, reason);
                                      }
                                    }}
                                    className="text-xs bg-red-500 text-white px-2 py-0.5 rounded hover:bg-red-600"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                              {isExtraWork && !task.extraWorkApproved && !(currentUser.isAdmin || currentUser.isSuperAdmin) && (
                                <div className="mt-1 text-xs text-yellow-600">⏳ Awaiting Admin Approval</div>
                              )}
                              {isHighPriority && isDueToday && !task.overdueApproved && (
                                <div className="mt-1 flex items-center gap-1">
                                  <span className="text-xs text-red-600 font-medium">🚨 High Priority - Due Today</span>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleHighPriorityPostpone(task.id);
                                    }}
                                    className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded hover:bg-orange-600"
                                  >
                                    Postpone (RH)
                                  </button>
                                </div>
                              )}
                              {task.overdueRequested && !task.overdueApproved && (
                                <div className="mt-1 text-xs text-yellow-600">⏳ Awaiting Manager Approval for extension</div>
                              )}
                            </div>
                          );
                        })}
                        {stageTasks.length === 0 && (
                          <div className="text-center py-6 text-xs text-gray-300 border-2 border-dashed border-gray-200 rounded-xl">
                            No tasks
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        );

      case 'pending_approvals':
        return (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">⏳ Pending Approvals</h2>
            
            {/* Extra Work Approvals */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">🔴 Extra Work Approvals</h3>
              {extraWorkTasks.filter(t => !t.extraWorkApproved).length === 0 ? (
                <div className="text-sm text-gray-400">No pending extra work approvals</div>
              ) : (
                <div className="space-y-3">
                  {extraWorkTasks.filter(t => !t.extraWorkApproved).map(task => (
                    <div key={task.id} className="bg-white rounded-xl shadow-sm p-4 border border-orange-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-800">{task.name}</h4>
                          <p className="text-sm text-gray-600">Requested by: {task.extraWorkRequestedBy}</p>
                          <p className="text-sm text-gray-500">Reason: {task.extraWorkReason}</p>
                          {task.extraWorkDetails && (
                            <p className="text-sm text-gray-400">Details: {task.extraWorkDetails}</p>
                          )}
                          <p className="text-xs text-gray-400">Requested on: {new Date(task.extraWorkRequestedOn).toLocaleString()}</p>
                        </div>
                        {(currentUser.isAdmin || currentUser.isSuperAdmin) && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => approveExtraWork(task.id)}
                              className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => {
                                const reason = prompt('Reason for rejection:');
                                if (reason !== null) {
                                  rejectExtraWork(task.id, reason);
                                }
                              }}
                              className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Overdue Extensions */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">⏰ Overdue Extensions</h3>
              {pendingApprovals.filter(p => p.type === 'overdue_extension').length === 0 ? (
                <div className="text-sm text-gray-400">No pending overdue extensions</div>
              ) : (
                <div className="space-y-3">
                  {pendingApprovals.filter(p => p.type === 'overdue_extension').map(approval => (
                    <div key={approval.id} className="bg-white rounded-xl shadow-sm p-4 border border-yellow-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-800">{approval.taskName}</h4>
                          <p className="text-sm text-gray-600">Requested by: {approval.requestedBy}</p>
                          <p className="text-sm text-gray-500">Reason: {approval.reason}</p>
                          {approval.note && <p className="text-sm text-gray-400">Note: {approval.note}</p>}
                          <p className="text-xs text-gray-400">Requested on: {new Date(approval.requestedOn).toLocaleString()}</p>
                        </div>
                        {(currentUser.isAdmin || currentUser.isSuperAdmin || currentUser.isManager) && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => approveOverdueExtension(approval.taskId)}
                              className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => rejectOverdueExtension(approval.taskId)}
                              className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'deliverables':
        return (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">📦 Project Deliverables</h2>
            
            {projects.map(project => (
              <div key={project.id} className="mb-6">
                <h3 className="text-md font-medium text-gray-700 mb-2">{project.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {project.deliverables.map((deliverable, index) => {
                    const relatedTasks = project.tasks.filter(t => 
                      t.deliverables && t.deliverables.includes(deliverable)
                    );
                    const completedTasks = relatedTasks.filter(t => 
                      t.status === 'completed' || t.status === 'published'
                    );
                    const progress = relatedTasks.length > 0 
                      ? Math.round((completedTasks.length / relatedTasks.length) * 100) 
                      : 0;

                    return (
                      <div key={index} className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-800">{deliverable}</h4>
                          <span className="text-sm text-gray-500">{completedTasks.length}/{relatedTasks.length}</span>
                        </div>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 rounded-full h-2 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {relatedTasks.slice(0, 3).map(task => (
                            <span key={task.id} className={`text-xs px-2 py-0.5 rounded-full ${task.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                              {task.name}
                            </span>
                          ))}
                          {relatedTasks.length > 3 && (
                            <span className="text-xs text-gray-400">+{relatedTasks.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        );

      case 'extra_work':
        return (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">🔴 Extra Work Management</h2>
              <button 
                onClick={() => {
                  // Create a new extra work task
                  const taskName = prompt('Enter extra work task name:');
                  if (taskName && taskName.trim()) {
                    const reason = prompt('Reason for extra work:');
                    if (reason && reason.trim()) {
                      const newTask = {
                        id: Date.now(),
                        name: taskName,
                        type: 'poster',
                        priority: 'High',
                        dueDate: new Date().toISOString().split('T')[0],
                        dueDateDisplay: 'Today',
                        status: 'pending',
                        assignee: currentUser.name,
                        stage: 0,
                        week: getWeekNumber(new Date()),
                        year: 2026,
                        createdBy: currentUser.name,
                        createdOn: new Date().toISOString(),
                        assignedOn: new Date().toISOString(),
                        comments: [],
                        activity: [],
                        statusUpdates: [],
                        overdueRequested: false,
                        completionNote: '',
                        completedBy: '',
                        completedOn: '',
                        reviewNotes: [],
                        isExtraWork: true,
                        extraWorkReason: reason,
                        extraWorkDetails: '',
                        extraWorkApproved: false,
                        extraWorkApprovedBy: '',
                        extraWorkRequestedBy: currentUser.name,
                        extraWorkRequestedOn: new Date().toISOString(),
                        deliverables: ['Extra Work'],
                        isDeliverable: true,
                      };

                      const extraProject = projects.find(p => p.name === 'Extra Work - Urgent') || projects[0];
                      const updatedProjects = projects.map(p => {
                        if (p.id === extraProject.id) {
                          return {
                            ...p,
                            tasks: [...p.tasks, newTask]
                          };
                        }
                        return p;
                      });
                      setProjects(updatedProjects);

                      setNotifications(prev => [{
                        id: Date.now() + Math.random(),
                        message: `🔴 New Extra Work requested: "${taskName}" by ${currentUser.name}. Reason: ${reason}`,
                        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                        read: false,
                        taskId: newTask.id,
                        taskName: taskName,
                        type: 'extra_work_new',
                        targetRoles: ['admin', 'superadmin']
                      }, ...prev]);

                      alert('✅ Extra work task created successfully! Awaiting admin approval.');
                    }
                  }
                }}
                className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-orange-600 transition"
              >
                <Plus size={16} />
                Request Extra Work
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {extraWorkTasks.map(task => {
                const project = projects.find(p => p.tasks.some(t => t.id === task.id));
                return (
                  <div key={task.id} className={`bg-white rounded-xl shadow-sm p-4 border ${task.extraWorkApproved ? 'border-green-300' : 'border-orange-300'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-800">{task.name}</h4>
                        <p className="text-sm text-gray-600">Project: {project?.name}</p>
                        <p className="text-sm text-gray-500">Reason: {task.extraWorkReason}</p>
                        {task.extraWorkDetails && (
                          <p className="text-sm text-gray-400">Details: {task.extraWorkDetails}</p>
                        )}
                        <p className="text-xs text-gray-400">Requested by: {task.extraWorkRequestedBy} • {new Date(task.extraWorkRequestedOn).toLocaleString()}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${task.extraWorkApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {task.extraWorkApproved ? '✅ Approved' : '⏳ Pending'}
                        </span>
                        {task.extraWorkApproved && (
                          <span className="text-xs text-green-600">Approved by: {task.extraWorkApprovedBy}</span>
                        )}
                        {!task.extraWorkApproved && (currentUser.isAdmin || currentUser.isSuperAdmin) && (
                          <div className="flex gap-1 mt-1">
                            <button 
                              onClick={() => approveExtraWork(task.id)}
                              className="px-2 py-0.5 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => {
                                const reason = prompt('Reason for rejection:');
                                if (reason !== null) {
                                  rejectExtraWork(task.id, reason);
                                }
                              }}
                              className="px-2 py-0.5 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                      <span>Status: {workflowStages.find(s => s.id === getStageIndex(task.status))?.label}</span>
                      <span>•</span>
                      <span>Priority: {task.priority}</span>
                      <span>•</span>
                      <span>Due: {task.dueDateDisplay}</span>
                    </div>
                  </div>
                );
              })}
              {extraWorkTasks.length === 0 && (
                <div className="col-span-2 text-center py-12 text-gray-400">
                  No extra work tasks
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-56' : 'w-20'} bg-white border-r border-gray-200 h-screen sticky top-0 overflow-y-auto transition-all duration-300 flex-shrink-0`}>
        <div className="p-4 border-b border-gray-200 flex items-center gap-2">
          {sidebarOpen ? (
            <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-blue-600" />
              TaskBoard
            </h1>
          ) : (
            <LayoutDashboard className="w-6 h-6 text-blue-600 mx-auto" />
          )}
        </div>
        <nav className="p-3 space-y-1">
          {[
            { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
            { icon: ClockIcon, label: 'Pending Approvals', id: 'pending_approvals', badge: pendingApprovals.length + extraWorkTasks.filter(t => !t.extraWorkApproved).length },
            { icon: FileCheck, label: 'Deliverables', id: 'deliverables' },
            { icon: Gift, label: 'Extra Work', id: 'extra_work', badge: extraWorkTasks.filter(t => !t.extraWorkApproved).length },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                activeTab === item.id 
                  ? 'bg-blue-50 text-blue-700 shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50'
              } ${!sidebarOpen && 'justify-center'}`}
            >
              <item.icon size={18} />
              {sidebarOpen && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      activeTab === item.id ? 'bg-blue-200 text-blue-800' : 'bg-red-500 text-white'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>
        {sidebarOpen && (
          <div className="border-t border-gray-200 p-4 mt-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{currentUser.name}</p>
                <p className="text-xs text-gray-500">{currentUser.role}</p>
                {currentUser.isSuperAdmin && <p className="text-xs text-yellow-600">👑 Super Admin</p>}
                {currentUser.isAdmin && !currentUser.isSuperAdmin && <p className="text-xs text-blue-600">🛡️ Admin</p>}
                {currentUser.isManager && !currentUser.isAdmin && !currentUser.isSuperAdmin && <p className="text-xs text-green-600">📋 Manager</p>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <Menu size={20} className="text-gray-500" />
              </button>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Project:</span>
                <select 
                  value={selectedProject} 
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">All Projects</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Gift size={14} className="text-orange-500" />
                  Extra: {counts.extraWork}
                </span>
                <span className="flex items-center gap-1 ml-2">
                  <FileCheck size={14} className="text-purple-500" />
                  Del: {counts.deliverables}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-gray-400 hover:text-gray-600 relative"
                >
                  <Bell size={19} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-96 overflow-y-auto z-50">
                    <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-800">Notifications</h4>
                      <div className="flex gap-2">
                        <select 
                          value={notificationFilter}
                          onChange={(e) => setNotificationFilter(e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="all">All</option>
                          <option value="team">Team</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button 
                          onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Mark all read
                        </button>
                      </div>
                    </div>
                    {getFilteredNotifications().length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-400">No notifications</div>
                    ) : (
                      getFilteredNotifications().map(n => (
                        <div 
                          key={n.id} 
                          className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${!n.read ? 'bg-blue-50' : ''}`}
                          onClick={() => markNotificationAsRead(n.id)}
                        >
                          <div className="flex items-start gap-2">
                            <div className={`w-2 h-2 rounded-full mt-1.5 ${!n.read ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                            <div>
                              <p className="text-sm text-gray-700">{n.message}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                              {n.taskName && (
                                <span className="text-xs text-blue-600 font-medium">📌 {n.taskName}</span>
                              )}
                              {n.type === 'extra_work_request' && (
                                <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">🔴 Extra Work</span>
                              )}
                              {n.type === 'extra_work_approved' && (
                                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✅ Approved</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-700 transition shadow-sm">
                <Plus size={16} />
                New Task
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Content based on active tab */}
        {renderContent()}
      </div>

      {/* Role Selector for Admin/Super Admin */}
      <RoleSelector />

      {/* Overdue Reason Modal */}
      {showOverdueModal && selectedOverdueTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">⏰ Overdue Task</h3>
            <p className="text-sm text-gray-600 mb-4">
              Task: <span className="font-medium">{selectedOverdueTask.name}</span>
              <br />
              Due: <span className="text-red-600 font-medium">{selectedOverdueTask.dueDateDisplay}</span>
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Reason for delay <span className="text-red-500">*</span>
                </label>
                <select 
                  value={overdueReason}
                  onChange={(e) => setOverdueReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select reason...</option>
                  <option value="Waiting for client input">Waiting for client input</option>
                  <option value="Dependency on other task">Dependency on other task</option>
                  <option value="Resource unavailable">Resource unavailable</option>
                  <option value="Scope change">Scope change</option>
                  <option value="Technical issue">Technical issue</option>
                  <option value="Personal emergency">Personal emergency</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Additional note
                </label>
                <textarea 
                  value={overdueNote}
                  onChange={(e) => setOverdueNote(e.target.value)}
                  placeholder="Add any additional details..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] resize-none"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setShowOverdueModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={submitOverdueReason}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Submit for Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extra Work Modal */}
      {showExtraWorkModal && selectedExtraWorkTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">🔴 Extra Work Request</h3>
            <p className="text-sm text-gray-600 mb-4">
              Task: <span className="font-medium">{selectedExtraWorkTask.name}</span>
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Reason for extra work <span className="text-red-500">*</span>
                </label>
                <select 
                  value={extraWorkReason}
                  onChange={(e) => setExtraWorkReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select reason...</option>
                  <option value="Client requested additional changes">Client requested additional changes</option>
                  <option value="Urgent requirement">Urgent requirement</option>
                  <option value="Scope expansion">Scope expansion</option>
                  <option value="Emergency fix">Emergency fix</option>
                  <option value="New requirement">New requirement</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Additional details
                </label>
                <textarea 
                  value={extraWorkDetails}
                  onChange={(e) => setExtraWorkDetails(e.target.value)}
                  placeholder="Provide details about the extra work..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] resize-none"
                />
              </div>

              <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
                <p className="flex items-center gap-2">
                  <Shield size={16} />
                  <span>This request will be sent to Admin and Super Admin for approval.</span>
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setShowExtraWorkModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={submitExtraWork}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600"
              >
                Submit for Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Detail Panel - Enhanced */}
      {showTaskDetail && selectedTask && (
        <div className="fixed right-0 top-0 z-60 w-full max-w-xl bg-white h-screen overflow-y-auto shadow-2xl border-l border-gray-200">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowTaskDetail(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
              <h3 className="font-semibold text-gray-800">{selectedTask.name}</h3>
              {selectedTask.isExtraWork && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Gift size={12} /> Extra
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button className="p-1.5 hover:bg-gray-100 rounded-lg"><MoreVertical size={16} className="text-gray-400" /></button>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Status & Priority */}
            <div className="flex flex-wrap items-center gap-3">
              <span className={`text-xs px-3 py-1 rounded-full ${getStatusColor(getStageIndex(selectedTask.status))}`}>
                {workflowStages.find(s => s.id === getStageIndex(selectedTask.status))?.label}
              </span>
              <span className={`text-xs px-3 py-1 rounded-full ${getPriorityBadge(selectedTask.priority)}`}>
                {selectedTask.priority}
              </span>
              <span className="text-xs text-gray-400">Due: {selectedTask.dueDateDisplay}</span>
              
              {selectedTask.overdueRequested && !selectedTask.overdueApproved && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                  ⏳ Extension Pending
                </span>
              )}
              {selectedTask.overdueApproved && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  ✅ Extension Approved
                </span>
              )}
              {selectedTask.isExtraWork && !selectedTask.extraWorkApproved && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                  🔴 Extra Work Pending
                </span>
              )}
              {selectedTask.isExtraWork && selectedTask.extraWorkApproved && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  ✅ Extra Work Approved
                </span>
              )}
              {getOverdueTasks().some(t => t.id === selectedTask.id) && !selectedTask.overdueRequested && (
                <button 
                  onClick={() => {
                    setShowTaskDetail(false);
                    handleOverdueRequest(selectedTask);
                  }}
                  className="text-xs bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600"
                >
                  ⚠️ Raise Overdue
                </button>
              )}
              {!selectedTask.isExtraWork && !selectedTask.extraWorkApproved && (
                <button 
                  onClick={() => {
                    setShowTaskDetail(false);
                    handleExtraWorkRequest(selectedTask);
                  }}
                  className="text-xs bg-orange-500 text-white px-3 py-1 rounded-full hover:bg-orange-600 flex items-center gap-1"
                >
                  <Gift size={12} /> Request Extra
                </button>
              )}
            </div>

            {/* Deliverables */}
            {selectedTask.deliverables && selectedTask.deliverables.length > 0 && (
              <div className="bg-purple-50 rounded-xl p-3">
                <h4 className="text-xs font-semibold text-purple-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <FileCheck size={14} /> Deliverables
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTask.deliverables.map((deliverable, index) => (
                    <span key={index} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                      {deliverable}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Task Actions */}
            <div className="flex flex-wrap gap-2">
              {selectedTask.type === 'poster' && selectedTask.status === 'content_writing' && (
                <button 
                  onClick={() => assignPosterToDesigner(selectedTask.id)}
                  className="flex items-center gap-1.5 bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-blue-600"
                >
                  <Send size={14} />
                  Send to Design
                </button>
              )}
              {selectedTask.type === 'poster' && selectedTask.status === 'design' && selectedTask.assignee === 'Designer' && (
                <button 
                  onClick={() => submitPosterForReview(selectedTask.id)}
                  className="flex items-center gap-1.5 bg-purple-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-purple-600"
                >
                  <Eye size={14} />
                  Submit Review
                </button>
              )}
              {selectedTask.type === 'poster' && selectedTask.status === 'review' && selectedTask.assignee === 'Geetha' && (
                <>
                  <button 
                    onClick={() => approvePoster(selectedTask.id)}
                    className="flex items-center gap-1.5 bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-green-600"
                  >
                    <Check size={14} />
                    Approve
                  </button>
                  <button 
                    onClick={() => {
                      const feedback = prompt('Enter feedback for rework:');
                      if (feedback && feedback.trim()) {
                        requestPosterRework(selectedTask.id, feedback);
                      }
                    }}
                    className="flex items-center gap-1.5 bg-yellow-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-yellow-600"
                  >
                    <Pencil size={14} />
                    Request Rework
                  </button>
                </>
              )}
              {selectedTask.status !== 'completed' && selectedTask.status !== 'published' && (
                <button 
                  onClick={() => {
                    const note = prompt('Add completion note:');
                    if (note !== null) {
                      completeTaskFromMyEnd(selectedTask.id, note);
                    }
                  }}
                  className="flex items-center gap-1.5 bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-green-600"
                >
                  <CheckCircle size={14} />
                  Complete
                </button>
              )}
              {selectedTask.priority === 'High' && selectedTask.dueDate === new Date().toISOString().split('T')[0] && !selectedTask.overdueApproved && (
                <button 
                  onClick={() => handleHighPriorityPostpone(selectedTask.id)}
                  className="flex items-center gap-1.5 bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-orange-600"
                >
                  <Clock size={14} />
                  Postpone (RH)
                </button>
              )}
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400">Project</p>
                <p className="text-sm font-medium text-gray-800">
                  {projects.find(p => p.tasks.some(t => t.id === selectedTask.id))?.name}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400">Assignee</p>
                <p className="text-sm font-medium text-gray-800">{selectedTask.assignee}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400">Created By</p>
                <p className="text-sm font-medium text-gray-800">{selectedTask.createdBy}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400">Type</p>
                <p className="text-sm font-medium text-gray-800 capitalize">{selectedTask.type}</p>
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Activity</h4>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {(selectedTask.activity || []).map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                    <span className="text-gray-700">{activity.action}</span>
                    <span className="text-xs text-gray-400 ml-auto">{activity.time}</span>
                  </div>
                ))}
                {(selectedTask.activity || []).length === 0 && (
                  <p className="text-xs text-gray-400">No activity yet</p>
                )}
              </div>
            </div>

            {/* Comments Section */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center justify-between">
                <span>💬 Comments</span>
                <span className="text-xs text-gray-400">{selectedTask.comments?.length || 0} messages</span>
              </h4>
              <div className="space-y-3 max-h-48 overflow-y-auto mb-3">
                {(selectedTask.comments || []).map((comment, index) => (
                  <div key={index} className={`flex items-start gap-2.5 ${comment.user === currentUser.name ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0 ${comment.user === currentUser.name ? 'bg-blue-600' : 'bg-gray-400'}`}>
                      {comment.user.charAt(0)}
                    </div>
                    <div className={`max-w-[80%] ${comment.user === currentUser.name ? 'bg-blue-600 text-white' : 'bg-white'} rounded-xl px-3 py-2 shadow-sm`}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{comment.user}</span>
                      </div>
                      <p className="text-sm">{comment.message}</p>
                      <p className={`text-xs mt-0.5 ${comment.user === currentUser.name ? 'text-blue-200' : 'text-gray-400'}`}>{comment.time}</p>
                    </div>
                  </div>
                ))}
                {(selectedTask.comments || []).length === 0 && (
                  <p className="text-center text-xs text-gray-400 py-4">No comments yet</p>
                )}
              </div>

              <div className="relative">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input 
                      type="text" 
                      value={commentText}
                      onChange={(e) => {
                        setCommentText(e.target.value);
                        const lastChar = e.target.value.slice(-1);
                        if (lastChar === '@') {
                          setShowMentionList(true);
                          setMentionSearch('');
                        } else {
                          const atIndex = e.target.value.lastIndexOf('@');
                          if (atIndex !== -1) {
                            setMentionSearch(e.target.value.slice(atIndex + 1));
                            setShowMentionList(true);
                          } else {
                            setShowMentionList(false);
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendComment(selectedTask.id);
                        }
                      }}
                      placeholder="Type a message... @ to mention"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    
                    {showMentionList && (
                      <div className="absolute bottom-full left-0 mb-1 w-full bg-white rounded-xl shadow-lg border border-gray-200 max-h-32 overflow-y-auto z-10">
                        {teamMembers
                          .filter(m => m.name !== currentUser.name && m.name.toLowerCase().includes(mentionSearch.toLowerCase()))
                          .map(member => (
                            <div 
                              key={member.id}
                              className="flex items-center gap-2 px-3 py-2 hover:bg-blue-50 cursor-pointer"
                              onClick={() => {
                                const parts = commentText.split('@');
                                const lastPart = parts.pop();
                                const newText = parts.join('@') + '@' + member.name + ' ' + (lastPart || '');
                                setCommentText(newText);
                                setShowMentionList(false);
                              }}
                            >
                              <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold">{member.name.charAt(0)}</div>
                              <div>
                                <p className="text-sm font-medium text-gray-800">{member.name}</p>
                                <p className="text-xs text-gray-400">{member.role}</p>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => handleSendComment(selectedTask.id)}
                    className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskBoard;