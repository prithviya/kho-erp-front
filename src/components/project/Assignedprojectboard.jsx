import React, { useEffect, useState } from 'react';
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
  Check
} from 'lucide-react';
import { toast } from 'react-toastify';
import taskService from '../../services/task.service';
import projectOnboardService from '../../services/projectOnboard.service';
import userManagementService from '../../services/userManagement.service';
import { getCurrentUser } from '../../utils/auth';

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

function Assignedprojectboard() {
  const currentUser = getCurrentUser();
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
  const [columns, setColumns] = useState([
    { id: 'social', title: 'Social Media', headerColor: 'bg-blue-400', tasks: [] },
    { id: 'print', title: 'Print', headerColor: 'bg-pink-500', tasks: [] },
    { id: 'ads', title: 'Ads', headerColor: 'bg-amber-400', tasks: [] },
    { id: 'blogs', title: 'Website Blogs', headerColor: 'bg-emerald-400', tasks: [] },
    { id: 'seo', title: 'SEO', headerColor: 'bg-purple-400', tasks: [] }
  ]);

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
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);

  // Active Task Detail Drawer State (Chat/Comments view)
  const [activeTask, setActiveTask] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentImage, setCommentImage] = useState(null);

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([taskService.getTasks(), projectOnboardService.list(), userManagementService.getDirectory()])
      .then(([taskResult, projectResult, userResult]) => {
        if (!mounted) return;

        const records = taskResult.status === 'fulfilled' ? taskResult.value?.data || [] : [];
        const taskProjects = records.map((task) => task.project).filter(Boolean);
        const availableProjects = projectResult.status === 'fulfilled'
          ? projectResult.value?.data || []
          : taskProjects;
        const assignedProjects = availableProjects.filter((project) => {
          const hasAssignment = parseIds(project.assignedToIds).some((id) => Number(id) === Number(currentUser?.id));
          const hasVisibleTask = records.some((task) => Number(task.projectOnboardId) === Number(project.id));
          return hasAssignment || (projectResult.status !== 'fulfilled' && hasVisibleTask);
        });

        setProjects(assignedProjects);
        if (userResult.status === 'fulfilled') {
          setEmployeesList((userResult.value?.data || []).filter((user) => user.isActive !== false));
        }
        setColumns((previous) => previous.map((column) => ({
          ...column,
          tasks: records.filter((task) => (!selectedProjectId || Number(task.projectOnboardId) === Number(selectedProjectId)) && (task.service?.name || '').toLowerCase().includes(column.title.toLowerCase().replace('website ', ''))).map(normalizeTask)
        })));

        if (taskResult.status === 'rejected') {
          toast.error(taskResult.reason?.message || 'Failed to load assigned tasks.');
        }
        if (projectResult.status === 'rejected' && taskResult.status === 'fulfilled') {
          toast.info('Showing projects from your assigned tasks.');
        }
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [currentUser?.id, selectedProjectId]);

  // Open modal to add a task
  const handleOpenAddModal = (columnId) => {
    setActiveColumnId(columnId);
    setTaskName('');
    setProjectId('');
    setDueDate('');
    setDueTime('');
    setTaskImage(null);
    setAssigneeType('employee');
    setSelectedAssigneeIds([]);
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
    if (!projectId || !selectedAssigneeIds.length) return;
    try {
      await Promise.all(selectedAssigneeIds.map((assignedToId) => taskService.createTask({
        projectOnboardId: Number(projectId), title: taskName.trim(), assignedToId: Number(assignedToId), dueDate: dueDate || null
      })));
      toast.success(`${selectedAssigneeIds.length} task${selectedAssigneeIds.length > 1 ? 's' : ''} created.`);
      setIsModalOpen(false);
      const response = await taskService.getTasks();
      const records = response?.data || [];
      setColumns((previous) => previous.map((column) => ({ ...column, tasks: records.filter((task) => (!selectedProjectId || Number(task.projectOnboardId) === Number(selectedProjectId)) && (task.service?.name || '').toLowerCase().includes(column.title.toLowerCase().replace('website ', ''))).map(normalizeTask) })));
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
    <div className="flex min-h-screen flex-col bg-gray-100 font-sans">
      
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-white px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center space-x-3">
          <span className="bg-emerald-600 text-white font-bold text-xs px-2 py-1 rounded">KI</span>
          <h1 className="truncate text-base font-bold text-gray-800 sm:text-lg">Kumaraguru Institutions</h1>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <Filter size={16} className="cursor-pointer hover:text-gray-700" />
          <ArrowUpDown size={16} className="cursor-pointer hover:text-gray-700" />
          <Activity size={16} className="cursor-pointer hover:text-gray-700" />
        </div>
      </div>

      {/* Assigned Projects + Kanban Board Workspace */}
      <div className="flex flex-1 min-h-0 flex-col md:flex-row">
        <aside className="w-full shrink-0 border-b bg-white p-3 sm:p-4 md:w-64 md:border-b-0 md:border-r">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Workspace</p>
              <h2 className="text-base font-bold text-gray-800">My Projects</h2>
            </div>
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">{projects.length}</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 md:block md:max-h-[calc(100vh-150px)] md:space-y-2 md:overflow-y-auto md:pb-0">
            <button
              type="button"
              onClick={() => setSelectedProjectId('')}
              className={`min-w-44 rounded-lg border px-3 py-2 text-left text-sm font-semibold transition md:w-full ${!selectedProjectId ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-gray-200 text-gray-600 hover:border-emerald-300 hover:bg-gray-50'}`}
            >
              All assigned projects
            </button>
            {projects.map((project) => (
              <button
                type="button"
                key={project.id}
                onClick={() => setSelectedProjectId(String(project.id))}
                className={`min-w-44 rounded-lg border px-3 py-2 text-left transition md:w-full ${String(selectedProjectId) === String(project.id) ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'}`}
              >
                <span className="block truncate text-sm font-semibold text-gray-800">{project.projectName}</span>
                <span className="mt-0.5 block truncate text-xs text-gray-500">{project.companyName}</span>
              </button>
            ))}
            {!loading && !projects.length && <p className="min-w-56 rounded-lg bg-gray-50 p-3 text-xs text-gray-500 md:min-w-0">No currently assigned projects.</p>}
          </div>
        </aside>

        <div className="min-h-0 flex-1 overflow-x-auto p-3 sm:p-6">
        <div className="flex min-w-max space-x-3 pb-2 sm:space-x-4">
          {columns.map((col) => (
            <div key={col.id} className="w-[min(18rem,calc(100vw-1.5rem))] rounded-lg bg-gray-200/60 flex max-h-[calc(100vh-12rem)] flex-col sm:w-72">
              
              {/* Column Header */}
              <div className="flex items-center justify-between p-3 bg-white rounded-t-lg border-b">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${col.headerColor}`}></div>
                  <span className="font-semibold text-gray-700 text-sm">{col.title}</span>
                </div>
                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {col.tasks.length}
                </span>
              </div>

              {/* Column Content Area */}
              <div className="p-3 flex-1 overflow-y-auto space-y-3">
                
                {/* Add Task Button */}
                <div className="flex justify-center my-1">
                  <button 
                    onClick={() => handleOpenAddModal(col.id)}
                    className="bg-white hover:bg-gray-50 text-gray-500 p-1.5 rounded-full shadow-sm border border-gray-200"
                  >
                    <Plus size={14} />
                  </button>
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
                        className="bg-white p-3.5 rounded-md shadow-sm border border-gray-200 space-y-2 cursor-pointer hover:border-indigo-400 transition"
                      >
                        <div className="flex justify-between items-start">
                          <h4 className={`font-semibold text-sm text-gray-800 ${isCompleted ? 'line-through text-gray-400' : ''}`}>
                            {task.title}
                          </h4>
                          <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-medium">
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
                    <p className="text-[11px] text-gray-400 mt-1">Click + to add new Tasks.</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>

      {/* --- MODAL: CREATE TASK WITH ASSIGN EMPLOYEE/VENDOR & DATE/TIME/IMAGE --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
          <div className="max-h-[92vh] w-full max-w-md space-y-4 overflow-y-auto rounded-t-lg bg-white p-4 shadow-xl sm:rounded-lg sm:p-6">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="font-bold text-gray-800 text-base">Create New Task</h2>
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
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              {/* Project and multi-assignee selector */}
              <div>
                <label className="block text-gray-600 font-medium mb-1">Project</label>
                <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full border rounded px-3 py-2 bg-white" required>
                  <option value="">Select project</option>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.projectName} - {project.companyName}</option>)}
                </select>
              </div>

              <div className="relative">
                <label className="block text-gray-600 font-medium mb-1">Assigned To</label>
                <div className="max-h-40 overflow-y-auto rounded border bg-white p-2 space-y-1">
                  {employeesList.map((employee) => {
                    const name = `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.fullName || employee.email;
                    const selected = selectedAssigneeIds.includes(employee.id);
                    return <label key={employee.id} className={`flex items-center gap-2 rounded px-2 py-1.5 text-xs cursor-pointer ${selected ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50 text-gray-700'}`}>
                      <input type="checkbox" checked={selected} onChange={() => setSelectedAssigneeIds((current) => selected ? current.filter((id) => id !== employee.id) : [...current, employee.id])} />
                      <User size={14} />
                      <span>{name}</span>
                    </label>;
                  })}
                  {!employeesList.length && <p className="p-2 text-xs text-gray-400">No active users found.</p>}
                </div>
                {!!selectedAssigneeIds.length && <p className="mt-1 text-[10px] text-indigo-600">{selectedAssigneeIds.length} assignee(s) selected</p>}
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

      {/* --- TASK DETAILS & CHAT DRAWER (Communication & Comments View) --- */}
      {activeTask && (
        <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col border-l">
          
          {/* Header Drawer */}
          <div className="p-4 border-b flex items-center justify-between bg-gray-50">
            <div className="flex items-center space-x-3">
              {/* SPOC Status Dropdown */}
              <select 
                value={activeTask.status}
                onChange={(e) => handleStatusChange(e.target.value)}
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
          <div className="p-6 border-b space-y-3">
            <h2 className={`text-xl font-bold text-gray-800 ${activeTask.status === 'COMPLETED' ? 'line-through text-gray-400' : ''}`}>
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
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Communication & Comments Log</h3>
            
            {activeTask.commentsList.map((comm) => (
              <div key={comm.id} className="bg-white p-3 rounded-lg shadow-sm border space-y-2">
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span className="font-semibold text-indigo-600">{comm.sender}</span>
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
          <div className="p-4 bg-white border-t space-y-2">
            <textarea 
              rows="2"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Type your comment, update or message here..."
              className="w-full border rounded p-2 text-sm focus:outline-none focus:border-indigo-500"
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
                className="bg-indigo-600 text-white px-4 py-1.5 rounded text-xs font-semibold hover:bg-indigo-700"
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