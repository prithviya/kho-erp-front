import React, { useEffect, useMemo, useState } from 'react';
import { 
  Plus, 
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
  UserCircle2
} from 'lucide-react';
import { toast } from 'react-toastify';
import taskService from '../../services/task.service';
import projectOnboardService from '../../services/projectOnboard.service';
import userManagementService from '../../services/userManagement.service';
import leadService from '../../services/lead.service';
import projectChatService from '../../services/projectChat.service';
import { getCanonicalRoles, getCurrentUser, isSuperAdmin } from '../../utils/auth';

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

function Assignedprojectboard() {
  const currentUser = getCurrentUser();
  const superAdmin = isSuperAdmin();
  const isManager = getCanonicalRoles(currentUser).includes('MANAGER');
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
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [loading, setLoading] = useState(true);

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
  const [taskImage, setTaskImage] = useState(null);
  
  // Assignment sub-menu state inside modal
  const [assigneeType, setAssigneeType] = useState('employee'); // 'employee' or 'vendor'
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [selectedVendorIds, setSelectedVendorIds] = useState([]);
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);

  // Active Task Detail Drawer State (Chat/Comments view)
  const [activeTask, setActiveTask] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentImage, setCommentImage] = useState(null);
  const [showProjectChat, setShowProjectChat] = useState(false);
  const [showProjectMembers, setShowProjectMembers] = useState(false);
  const [projectChatText, setProjectChatText] = useState('');
  const [mentionQuery, setMentionQuery] = useState('');
  const [chatMessages, setChatMessages] = useState({});
  const [unreadMentionCount, setUnreadMentionCount] = useState(0);

  useEffect(() => {
    if (!selectedProjectId) return;
    let mounted = true;
    projectChatService.list(selectedProjectId)
      .then((response) => {
        if (!mounted) return;
        const messages = (response?.data || []).map((item) => ({
          id: item.id,
          sender: item.sender ? `${item.sender.firstName || ''} ${item.sender.lastName || ''}`.trim() || item.sender.email : 'User',
          text: item.message,
          time: new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          mentionedUserIds: item.mentionedUserIds || []
        }));
        setChatMessages((current) => ({ ...current, [selectedProjectId]: messages }));
      })
      .catch((error) => toast.error(error.message || 'Failed to load project chat.'));
    return () => { mounted = false; };
  }, [selectedProjectId]);

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([taskService.getTasks(), projectOnboardService.list(), userManagementService.getDirectory(), leadService.getCategoriesWithServices()])
      .then(([taskResult, projectResult, userResult, serviceResult]) => {
        if (!mounted) return;

        const records = taskResult.status === 'fulfilled' ? taskResult.value?.data || [] : [];
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
        const assignedProjects = superAdmin || isManager
          ? availableProjects
          : availableProjects.filter((project) => visibleTaskProjectIds.has(Number(project.id)) || parseIds(project.spocIds).some((id) => Number(getId(id)) === Number(currentUser?.id)));

        setProjects(assignedProjects);
        if (userResult.status === 'fulfilled') {
          setEmployeesList((userResult.value?.data || []).filter((user) => user.isActive !== false));
        }
        const catalog = serviceResult.status === 'fulfilled' ? serviceResult.value?.data || [] : [];
        const services = catalog.flatMap((category) => category.services || category.Services || []);
        const selectedProject = assignedProjects.find((project) => String(project.id) === String(selectedProjectId));
        const requiredServices = parseIds(selectedProject?.serviceIds).map((value) => {
          const id = getId(value);
          return services.find((service) => Number(service.id) === Number(id) || String(service.name).toLowerCase() === String(id).toLowerCase()) || (typeof value === 'object' ? value : { id, name: `Service #${id}` });
        }).filter((service, index, list) => service && list.findIndex((item) => String(item.id) === String(service.id)) === index);
        const serviceColumns = requiredServices.map((service, index) => ({
          id: String(service.id),
          title: service.name,
          headerColor: ['bg-blue-400', 'bg-pink-500', 'bg-amber-400', 'bg-emerald-400', 'bg-purple-400'][index % 5],
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
  }, [currentUser?.id, selectedProjectId, superAdmin, isManager]);

  const selectedProject = useMemo(
    () => projects.find((project) => String(project.id) === String(selectedProjectId)),
    [projects, selectedProjectId]
  );

  const selectedProjectPeople = useMemo(() => {
    const findUsers = (ids, resolvedUsers = []) => resolvedUsers.length
      ? resolvedUsers
      : parseIds(ids).map(getId).map((id) => employeesList.find((user) => Number(user.id) === Number(id))).filter(Boolean);
    const projectTasks = columns.flatMap((column) => column.tasks);
    const assigned = projectTasks
      .map((task) => task.assignee)
      .filter((name, index, names) => name && name !== 'Unassigned' && names.indexOf(name) === index);
    return {
      spocs: findUsers(selectedProject?.spocIds, selectedProject?.spocUsers),
      reportingHeads: selectedProject?.reportingHeadUser
        ? [selectedProject.reportingHeadUser]
        : findUsers(selectedProject?.reportingHeadId ? [selectedProject.reportingHeadId] : selectedProject?.projectManagerIds),
      assigned
    };
  }, [columns, employeesList, selectedProject]);

  const isSelectedProjectSpoc = Boolean(selectedProject && parseIds(selectedProject.spocIds)
    .some((id) => Number(getId(id)) === Number(currentUser?.id)));
  const canCreateTasks = superAdmin || isManager || isSelectedProjectSpoc;
  const spocProjects = useMemo(
    () => projects.filter((project) => parseIds(project.spocIds).some((id) => Number(getId(id)) === Number(currentUser?.id))),
    [currentUser?.id, projects]
  );
  const assignedProjects = useMemo(
    () => projects.filter((project) => !spocProjects.some((spocProject) => Number(spocProject.id) === Number(project.id))),
    [projects, spocProjects]
  );

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
          sender: item?.sender ? `${item.sender.firstName || ''} ${item.sender.lastName || ''}`.trim() || item.sender.email : `${currentUser?.firstName || 'You'} ${currentUser?.lastName || ''}`.trim(),
          text: item?.message || projectChatText.trim(),
          time: item?.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          mentionedUserIds
        };
        setChatMessages((current) => ({ ...current, [selectedProjectId]: [...activeProjectMessages, message] }));
        setProjectChatText('');
        setMentionQuery('');
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
    setTaskImage(null);
    setAssigneeType('employee');
    setSelectedAssigneeIds([]);
    setSelectedEmployeeIds([]);
    setSelectedVendorIds([]);
    setIsModalOpen(true);
  };

  // Handle file/image selection for task creation
  const handleTaskImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setTaskImage(URL.createObjectURL(e.target.files[0]));
    }
  };

  // Save New Task
  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!taskName.trim()) return;
    if (!projectId || (!selectedEmployeeIds.length && !selectedVendorIds.length)) return;
    try {
      await Promise.all([
        ...selectedEmployeeIds.map((assignedToId) => taskService.createTask({
          projectOnboardId: Number(projectId), serviceId: Number(activeColumnId), title: taskName.trim(), assignedToId: Number(assignedToId), dueDate: dueDate || null
        })),
        ...selectedVendorIds.map((assignedVendorId) => taskService.createTask({
          projectOnboardId: Number(projectId), serviceId: Number(activeColumnId), title: taskName.trim(), assignedVendorId: Number(assignedVendorId), dueDate: dueDate || null
        }))
      ]);
      const assigneeCount = selectedEmployeeIds.length + selectedVendorIds.length;
      toast.success(`${assigneeCount} task${assigneeCount > 1 ? 's' : ''} created.`);
      setIsModalOpen(false);
      const response = await taskService.getTasks();
      const records = response?.data || [];
      setColumns((previous) => previous.map((column) => ({ ...column, tasks: records.filter((task) => (!selectedProjectId || Number(task.projectOnboardId) === Number(selectedProjectId)) && Number(task.serviceId) === Number(column.id)).map(normalizeTask) })));
    } catch (error) {
      toast.error(error.message || 'Failed to create task.');
    }
  };

  // Open Task Details & Communication Chat Drawer
  const handleOpenTaskDetails = (task, colId) => {
    // If task opens, auto-trigger status to 'Started' if it was 'Open'
    let updatedTask = { ...task };
    if (updatedTask.status === 'TODO') {
      updatedTask.status = 'IN_PROGRESS';
      updatedTask.commentsList = [
        ...updatedTask.commentsList,
        { id: Date.now(), sender: 'System', text: 'Communication started. Status changed to Started.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ];
    }
    setActiveTask({ ...updatedTask, columnId: colId });
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
  const handleStatusChange = async (newStatus) => {
    const updatedTask = { ...activeTask, status: newStatus };
    setActiveTask(updatedTask);

    try {
      await taskService.updateStatus(activeTask.id, newStatus);
      setColumns((previous) => previous.map((col) => col.id === activeTask.columnId
        ? { ...col, tasks: col.tasks.map((task) => task.id === updatedTask.id ? updatedTask : task) }
        : col));
    } catch (error) {
      setActiveTask(activeTask);
      toast.error(error.message || 'Failed to update task status.');
    }
  };

  // Helper to check if task is overdue
  const isOverdue = (dueDate, dueTime) => {
    if (!dueDate) return false;
    const dueDateTime = new Date(`${dueDate}T${dueTime || '23:59'}`);
    return new Date() > dueDateTime;
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f5f7f5] font-sans text-slate-800">
      
      
      {/* Assigned Projects + Kanban Board Workspace */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        <aside className="w-full shrink-0 border-b border-slate-200 bg-[#10251f] p-3 text-white sm:p-4 md:w-72 md:border-b-0 md:border-r">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">Workspace</p>
              <h2 className="text-base font-bold text-white">My Projects</h2>
            </div>
            <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-semibold text-emerald-200">{projects.length}</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 md:block md:max-h-[calc(100vh-150px)] md:space-y-2 md:overflow-y-auto md:pb-0">
            <button
              type="button"
              onClick={() => setSelectedProjectId('')}
              className={`min-w-44 rounded-lg border px-3 py-2 text-left text-sm font-semibold transition md:w-full ${!selectedProjectId ? 'border-emerald-300 bg-emerald-400/15 text-emerald-100' : 'border-white/10 text-slate-300 hover:border-emerald-300/60 hover:bg-white/5'}`}
            >
              All assigned projects
            </button>
            {!!spocProjects.length && <p className="mt-4 px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">SPOC Projects</p>}
            {spocProjects.map((project) => (
              <button
                type="button"
                key={project.id}
                onClick={() => setSelectedProjectId(String(project.id))}
                className={`min-w-44 rounded-lg border px-3 py-2 text-left transition md:w-full ${String(selectedProjectId) === String(project.id) ? 'border-emerald-300 bg-emerald-400/15' : 'border-white/10 hover:border-emerald-300/60 hover:bg-white/5'}`}
              >
                <span className="block truncate text-sm font-semibold text-slate-100">{project.projectName}</span>
                <span className="mt-0.5 block truncate text-xs text-slate-400">{project.companyName}</span>
              </button>
            ))}
            {!!assignedProjects.length && <p className="mt-4 px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Assigned Projects</p>}
            {assignedProjects.map((project) => (
              <button
                type="button"
                key={project.id}
                onClick={() => setSelectedProjectId(String(project.id))}
                className={`min-w-44 rounded-lg border px-3 py-2 text-left transition md:w-full ${String(selectedProjectId) === String(project.id) ? 'border-emerald-300 bg-emerald-400/15' : 'border-white/10 hover:border-emerald-300/60 hover:bg-white/5'}`}
              >
                <span className="block truncate text-sm font-semibold text-slate-100">{project.projectName}</span>
                <span className="mt-0.5 block truncate text-xs text-slate-400">{project.companyName}</span>
              </button>
            ))}
            {!loading && !projects.length && <p className="min-w-56 rounded-lg bg-gray-50 p-3 text-xs text-gray-500 md:min-w-0">No currently assigned projects.</p>}
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-3 sm:p-6">
        {selectedProject && (
          <div className="mb-5 shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">Selected project</p>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">{selectedProject.projectName}</h2>
                <p className="text-xs text-slate-500">{selectedProject.companyName}</p>
              </div>
              <div className="flex flex-wrap gap-6 text-xs">
                <div>
                  <p className="font-semibold uppercase tracking-wide text-slate-400">SPOC</p>
                  <p className="mt-1 text-gray-700">{selectedProjectPeople.spocs.map((user) => `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email).join(', ') || 'Not assigned'}</p>
                </div>
                <div>
                  <p className="font-semibold uppercase tracking-wide text-slate-400">Reporting Head</p>
                  <p className="mt-1 text-gray-700">{selectedProjectPeople.reportingHeads.map((user) => `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email).join(', ') || 'Not assigned'}</p>
                </div>
                <div>
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
                <div className="flex items-center gap-2 self-start">
                  <button
                    type="button"
                    onClick={() => setShowProjectMembers(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
                  >
                    <UsersRound size={15} /> Members
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowProjectChat(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 font-semibold text-white shadow-sm hover:bg-emerald-700"
                  >
                    <MessageCircle size={15} /> Project Chat
                    {unreadMentionCount > 0 && <span className="ml-1 inline-flex min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] text-white">{unreadMentionCount}</span>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-hidden pb-3">
        <div className="flex min-w-max space-x-3 sm:space-x-4">
          {columns.map((col) => (
            <div key={col.id}  className="w-[calc(100vw-2rem)] max-w-72 shrink-0 rounded-2xl border border-slate-200 bg-slate-100/80 flex max-h-[calc(100vh-12rem)] flex-col shadow-sm sm:w-72" >
              
              {/* Column Header */}
              <div className="flex items-center justify-between rounded-t-2xl border-b border-slate-200 bg-white p-3.5">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${col.headerColor}`}></div>
                  <span className="text-sm font-bold text-slate-800">{col.title}</span>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
                  {col.tasks.length}
                </span>
              </div>

              {/* Column Content Area */}
              <div className="p-3 flex-1 overflow-y-auto space-y-3">
                
                {/* Add Task Button */}
                <div className="flex justify-center my-1">
                  {canCreateTasks && (
                    <button 
                      onClick={() => handleOpenAddModal(col.id)}
                      className="bg-white hover:bg-gray-50 text-gray-500 p-1.5 rounded-full shadow-sm border border-gray-200"
                      title="Create task"
                    >
                      <Plus size={14} />
                    </button>
                  )}
                </div>

                {/* Task Cards */}
                {col.tasks.length > 0 ? (
                  col.tasks.map((task) => {
                    const overdue = isOverdue(task.dueDate, task.dueTime) && task.status !== 'COMPLETED';
                    const isCompleted = task.status === 'COMPLETED';

                    return (
                      <div 
                        key={task.id} 
                        onClick={() => handleOpenTaskDetails(task, col.id)}
                        className="cursor-pointer space-y-2 rounded-xl border border-slate-200 bg-white p-3.5 shadow-[0_3px_10px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md"
                      >
                        <div className="flex justify-between overflow-hidden">
                          <h4 className={`text-sm font-bold leading-5 text-slate-800 ${isCompleted ? 'line-through text-gray-400' : ''}`}>
                            {task.title}
                          </h4>
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                            {task.assignee !== 'Unassigned' ? task.assignee.split(' ')[0] : 'Unassigned'}
                          </span>
                        </div>

                        {/* Task Thumbnail if uploaded */}
                        {task.images && task.images.length > 0 && (
                          <div className="h-20 w-full bg-gray-100 rounded overflow-hidden">
                            <img src={task.images[0]} alt="task attachment" className="w-full h-full object-cover" />
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="flex items-center space-x-1 text-gray-400">
                            <MessageSquare size={12} />
                            <span>{task.commentsCount}</span>
                          </span>

                          {task.dueDate && (
                            <span className={`flex items-center space-x-1 px-1.5 py-0.5 rounded font-medium ${
                              overdue ? 'bg-red-100 text-red-600 border border-red-200' : 'bg-orange-50 text-orange-600'
                            }`}>
                              <Calendar size={12} />
                              <span>{task.dueDate} {task.dueTime && `@ ${task.dueTime}`}</span>
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
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
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
                  <input 
                    type="time" 
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-xs"
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-gray-600 font-medium mb-1">Attach Image</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleTaskImageUpload}
                  className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {taskImage && <span className="text-[10px] text-green-600 mt-1 block">Image attached successfully!</span>}
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
          <div className="flex h-full w-full max-w-lg flex-col border-l border-slate-200 bg-[#f6f8f7] shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">Project conversation</p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">{selectedProject.projectName}</h2>
                <p className="text-xs text-slate-500">{projectMembers.length} project members</p>
              </div>
              <button type="button" onClick={() => setShowProjectChat(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close project chat">
                <X size={19} />
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400"><MessageCircle size={14} /> Project Chat</div>
              {activeProjectMessages.map((message) => (
                <div key={message.id} className={`rounded-xl border p-3.5 shadow-sm ${message.system ? 'border-emerald-100 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="flex items-center gap-2 font-semibold text-emerald-700"><UserCircle2 size={16} /> {message.sender}</span>
                    <span className="text-slate-400">{message.time}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{message.text}</p>
                </div>
              ))}
            </div>
            <div className="relative border-t border-slate-200 bg-white p-4">
              {mentionQuery && mentionOptions.length > 0 && (
                <div className="absolute bottom-full left-4 right-4 mb-2 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                  {mentionOptions.map((member) => {
                    const name = `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.fullName || member.email;
                    return <button type="button" key={member.id} onClick={() => insertMention(member)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-emerald-50"><UserCircle2 size={17} className="text-emerald-600" /><span>{name}</span><span className="ml-auto text-[10px] text-slate-400">{member.memberRole}</span></button>;
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
                }}
                placeholder="Write a project update or use @ to mention someone..."
                className="w-full resize-none rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
              <div className="mt-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-slate-400"><AtSign size={15} /> Mention a member</span>
                <button type="button" onClick={handleProjectChatSubmit} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"><Send size={14} /> Send</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProjectMembers && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">Access list</p><h2 className="mt-1 text-lg font-bold text-slate-900">Project Members</h2></div><button type="button" onClick={() => setShowProjectMembers(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button></div>
            <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">{projectMembers.map((member) => { const name = `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.fullName || member.email; return <div key={member.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"><UserCircle2 size={28} className="text-emerald-600" /><div><p className="text-sm font-semibold text-slate-800">{name}</p><p className="text-xs text-slate-500">{member.memberRole}</p></div></div>; })}</div>
          </div>
        </div>
      )}

      {/* --- TASK DETAILS & CHAT DRAWER (Communication & Comments View) --- */}
      {activeTask && (
        <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-slate-200 bg-[#fbfcfb] shadow-2xl">
          
          {/* Header Drawer */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white p-4">
            <div className="flex items-center space-x-3">
              {/* SPOC Status Dropdown */}
              <select 
                value={activeTask.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={!canCreateTasks}
                className="text-xs font-bold border rounded px-2 py-1 bg-white text-gray-700 focus:outline-none"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REVIEW">Review</option>
                <option value="COMPLETED">Completed</option>
              </select>

              <span className="text-xs text-gray-500 font-medium">Assigned: {activeTask.assignee}</span>
            </div>

            <button onClick={() => setActiveTask(null)} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          {/* Task Info Header */}
          <div className="space-y-3 border-b border-slate-200 bg-white p-6">
            <h2 className={`text-2xl font-bold tracking-tight text-slate-900 ${activeTask.status === 'COMPLETED' ? 'line-through text-gray-400' : ''}`}>
              {activeTask.title}
            </h2>

            {/* Overdue alert warning */}
            {isOverdue(activeTask.dueDate, activeTask.dueTime) && activeTask.status !== 'COMPLETED' && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-1.5 rounded font-semibold flex items-center space-x-2">
                <Clock size={14} />
                <span>Task is Overdue! Due date & time has crossed.</span>
              </div>
            )}

            {activeTask.images && activeTask.images.length > 0 && (
              <div className="w-32 h-32 rounded border overflow-hidden">
                <img src={activeTask.images[0]} alt="attachment" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Communication / Comments Stream */}
          <div className="flex-1 space-y-4 overflow-y-auto bg-[#f6f8f7] p-6">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Communication & Comments Log</h3>
            
            {activeTask.commentsList.map((comm) => (
              <div key={comm.id} className="space-y-2 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span className="font-semibold text-emerald-700">{comm.sender}</span>
                  <span>{comm.time}</span>
                </div>
                <p className="text-sm text-gray-700">{comm.text}</p>
                {comm.image && (
                  <div className="h-28 w-28 rounded overflow-hidden border">
                    <img src={comm.image} alt="comment attachment" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Comment & Image Upload Input Footer */}
          <div className="space-y-2 border-t border-slate-200 bg-white p-4">
            <textarea 
              rows="2"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Type your comment, update or message here..."
              className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            ></textarea>

            <div className="flex justify-between items-center">
              <label className="cursor-pointer text-gray-500 hover:text-indigo-600 flex items-center space-x-1 text-xs font-medium">
                <ImageIcon size={16} />
                <span>Upload Image / File</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setCommentImage(URL.createObjectURL(e.target.files[0]));
                    }
                  }} 
                />
              </label>

              <button 
                onClick={handlePostComment}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                Post Comment
              </button>
            </div>
            {commentImage && <span className="text-[10px] text-green-600 block">Image attached to comment.</span>}
          </div>

        </div>
      )}

    </div>
  );
}

export default Assignedprojectboard;