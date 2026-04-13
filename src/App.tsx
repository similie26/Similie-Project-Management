import React, { useState, useEffect, FormEvent, useRef } from 'react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { 
  LayoutDashboard, 
  Layers, 
  Calendar as CalendarIcon, 
  Users, 
  Settings, 
  Plus, 
  Search, 
  Bell, 
  HelpCircle,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  SlidersHorizontal,
  ChevronDown,
  User,
  Mail,
  Shield,
  Lock,
  Moon,
  Sun,
  Globe,
  Camera,
  Save,
  LogOut,
  UserPlus,
  ShieldCheck,
  AlertCircle,
  WifiOff,
  RefreshCw,
  ExternalLink,
  Zap,
  Activity as ActivityIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { 
  DndContext, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Types
import { Task, TeamMember, Activity, Project, Status, UserProfile } from './types';

// Utils
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ADMIN_EMAILS = ['similietimor@gmail.com', 'liberty.nahak@similie.org'].map(e => e.toLowerCase());

type View = 'dashboard' | 'projects' | 'calendar' | 'team' | 'settings' | 'profile';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProjectData, setNewProjectData] = useState({ name: '', category: 'Design' });
  const [toast, setToast] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const [isBypassed, setIsBypassed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setConnectionError("Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your Secrets.");
      setIsLoading(false);
      return;
    }

    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        console.log('Session initialized:', session?.user?.email);
        setSession(session);
      } catch (err: any) {
        console.error('Session initialization error:', err);
        if (err.message === 'Failed to fetch') {
          setConnectionError("Unable to connect to Supabase. Please check your internet connection or project status.");
        } else {
          setConnectionError(err.message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session?.user?.email);
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user || !isSupabaseConfigured) return;

    const loadData = async () => {
      setIsLoading(true);
      setConnectionError(null);
      try {
        const { data: tasksData, error: tasksError } = await supabase.from('tasks').select('*');
        if (tasksError) throw tasksError;
        if (tasksData && tasksData.length > 0) {
          setTasks(tasksData);
        }

        const { data: projectsData, error: projectsError } = await supabase.from('projects').select('*');
        if (projectsError) throw projectsError;
        if (projectsData && projectsData.length > 0) {
          setProjects(projectsData);
        }

        const { data: teamData, error: teamError } = await supabase.from('profiles').select('*');
        if (teamError) throw teamError;
        if (teamData) {
          setAllProfiles(teamData as UserProfile[]);
          const members: TeamMember[] = teamData.map(p => ({
            id: p.id,
            name: p.name,
            role: p.role,
            avatar: p.avatar,
            load: Math.floor(Math.random() * 100), // Mock load for now as it's not in profiles
            activeTasks: 0,
            blockedTasks: 0,
            status: 'online'
          }));
          setTeamMembers(members);
        }

        const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
        if (profileError) throw profileError;
        if (profileData) {
          setUserProfile(profileData);
        } else {
          // Initialize a default profile if none exists
          const defaultProfile: UserProfile = {
            id: session.user.id,
            name: session.user.user_metadata.full_name || session.user.email.split('@')[0],
            email: session.user.email,
            avatar: session.user.user_metadata.avatar_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuD0Nop2-RwO9YPc0rjDpg5Swcm0xEwWw0xmzRQ7F2a0dqnUsmqizd2uZlzjt8Hq0UjvMbpyVMzkV2GMjhrZc5xofchdLUbvF_4Fdb5a_5pRYQMxSOeLiEeKrcKAtQjyr9oxusMXgIgluoG9KjwRXJ8D21nyf00uD9o4WtjE5-jIto7sRmdXEjoAxOrs75jZmQHXhIiEFnzo3rEtxrDuoBGdCtz3QlBYdtfU5NwfQf7dsALNlhoU6Ys5wownNcoLLZv_7qcWiHhFWSE',
            role: ADMIN_EMAILS.includes(session.user.email) ? 'Administrator' : 'Team Member',
            bio: 'Passionate about creating seamless user experiences and premium visual languages.',
            preferences: {
              notifications: true,
              darkMode: false,
              language: 'English'
            }
          };
          setUserProfile(defaultProfile);
          // Try to save it if it's the first time
          if (!profileData) {
             await supabase.from('profiles').upsert(defaultProfile);
          }
        }
      } catch (err: any) {
        console.error('Supabase load error:', err);
        if (err.message === 'Failed to fetch') {
          setConnectionError("Unable to connect to Supabase. This usually means the URL is incorrect or the project is paused.");
        } else {
          setConnectionError(err.message || "An unexpected error occurred while connecting to Supabase.");
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [session]);

  const showToast = (message: string) => {
    setToast(message);
    const duration = message.length > 50 ? 8000 : 4000;
    setTimeout(() => setToast(null), duration);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // Clear URL hash to prevent re-login from stale tokens in URL
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      setSession(null);
      setUserProfile(null);
      console.log('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: Layers },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const isAdmin = (session?.user?.email && ADMIN_EMAILS.includes(session.user.email)) || isBypassed;
  const canCreateProjects = userProfile?.role === 'Project Manager' || userProfile?.role === 'Administrator' || isAdmin;

  if (!session && !isBypassed) {
    return <LoginView onShowToast={showToast} setSession={setSession} setIsBypassed={setIsBypassed} />;
  }

  const isDarkMode = userProfile?.preferences?.darkMode || false;

  return (
    <div className={cn(
      "flex h-screen overflow-hidden bg-surface transition-colors duration-300",
      isDarkMode && "dark"
    )}>
      {/* Sidebar */}
      <aside className={cn(
        "hidden md:flex flex-col h-full bg-surface-container-low py-10 transition-all duration-300 border-r border-outline-variant/10",
        isSidebarOpen ? "w-72" : "w-20"
      )}>
        <div className="px-8 mb-12 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 shrink-0 overflow-hidden">
            <img 
              src="logo.jpg" 
              alt="Beached Street Logo" 
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  const span = document.createElement('span');
                  span.className = 'font-bold text-lg';
                  span.innerText = 'B';
                  parent.appendChild(span);
                }
              }}
            />
          </div>
          {isSidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-xl font-extrabold text-primary leading-tight">Beached Street</h2>
              <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/60">Premium Workflow</p>
            </motion.div>
          )}
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as View)}
              className={cn(
                "w-full flex items-center gap-3 py-3 px-8 transition-all duration-200 group relative",
                currentView === item.id 
                  ? "text-on-surface font-semibold bg-surface-container-lowest" 
                  : "text-on-surface-variant/60 font-medium hover:bg-surface-container-high"
              )}
            >
              {currentView === item.id && (
                <motion.div 
                  layoutId="active-nav"
                  className="absolute left-0 top-0 bottom-0 w-1 bg-primary"
                />
              )}
              <item.icon className={cn("w-5 h-5 shrink-0", currentView === item.id ? "text-primary" : "text-on-surface-variant/60 group-hover:text-primary")} />
              {isSidebarOpen && <span className="font-headline">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="px-8 mt-auto space-y-2">
          {canCreateProjects && (
            <button 
              onClick={() => setIsNewProjectModalOpen(true)}
              className={cn(
                "w-full bg-primary text-on-primary rounded-xl font-headline font-bold flex items-center justify-center gap-2 shadow-ambient hover:scale-[0.98] transition-all",
                isSidebarOpen ? "py-4" : "p-3"
              )}
            >
              <Plus className="w-5 h-5" />
              {isSidebarOpen && "New Project"}
            </button>
          )}
          
          <button 
            onClick={handleLogout}
            className={cn(
              "w-full bg-surface-container text-on-surface-variant rounded-xl font-headline font-bold flex items-center justify-center gap-2 hover:bg-surface-container-high transition-all",
              isSidebarOpen ? "py-3" : "p-3"
            )}
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && "Sign Out"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl flex justify-between items-center w-full px-8 h-20 border-b border-outline-variant/10">
          <div className="flex items-center gap-6 flex-1">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-on-surface-variant hover:text-primary transition-colors md:block hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold tracking-tight text-primary font-headline capitalize">{currentView}</h1>
            <div className="relative hidden lg:block flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
              <input 
                className="w-full pl-10 pr-4 py-2 bg-surface-container border-none rounded-xl focus:ring-2 focus:ring-primary text-sm font-sans placeholder:text-on-surface-variant/50" 
                placeholder="Search tasks, people, projects..." 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-4 relative">
            <div className="hidden xl:flex flex-col items-end mr-4">
              <span className="text-sm font-bold text-on-surface font-headline">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
                {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>
            
            <button 
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className={cn(
                "p-2 text-on-surface-variant hover:text-primary transition-colors relative",
                notificationsOpen && "text-primary"
              )}
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full ring-2 ring-surface" />
            </button>
            
            <AnimatePresence>
              {notificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full right-0 mt-2 w-80 bg-surface-bright rounded-2xl shadow-ambient border border-outline-variant/10 overflow-hidden z-50"
                >
                  <div className="p-4 border-b border-outline-variant/10 flex justify-between items-center">
                    <h4 className="font-bold font-headline">Notifications</h4>
                    <button className="text-[10px] font-bold text-primary uppercase tracking-widest">Mark all read</button>
                  </div>
                  <div className="max-h-96 overflow-y-auto p-2 space-y-1">
                    <div className="p-8 text-center">
                      <p className="text-xs text-on-surface-variant/40 italic">No new notifications</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              onClick={() => showToast("Help center coming soon")}
              className="p-2 text-on-surface-variant hover:text-primary transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            <div 
              onClick={() => {
                setEditingMemberId(null);
                setCurrentView('profile');
              }}
              className={cn(
                "h-10 w-10 rounded-full overflow-hidden border-2 shadow-sm ml-2 ring-2 cursor-pointer transition-all",
                currentView === 'profile' && !editingMemberId ? "border-primary ring-primary" : "border-white ring-primary/10 hover:ring-primary"
              )}
            >
              <img 
                alt="User avatar" 
                className="w-full h-full object-cover" 
                src={userProfile?.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuAMryzCxVGAfPgVRr9q2D5EuumXh9tSlot0eo0No0Ik7QTd0ZmGR2wVN-dTH8QLur9Clp2kf4f7tS7xc6LrFrn4RPi5ARQmyX49whRwajEYvaR31FCk16GMOmskdTsznkzRyO8Pu06jNHgiHxe2FmtMBzTDK-GXhiGe4EKjaPfh2jwv4vurOE_Z5FuHsZ92O_CaMpdmEZX2nwVZJzue5nExmeQ_H5gdAx2jNJ22W6LEZhFhp1as0mP7Vrb66YAhYTPi5lGhXkklL30"}
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
          {connectionError && (
            <div className="max-w-7xl mx-auto mb-8">
              <div className="bg-error/10 border border-error/20 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                <div className="w-16 h-16 rounded-2xl bg-error/20 flex items-center justify-center text-error shrink-0">
                  <WifiOff className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-on-surface font-headline mb-2">Connection Issue Detected</h3>
                  <p className="text-on-surface-variant/70 font-medium mb-4 leading-relaxed">
                    {connectionError}
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    <button 
                      onClick={() => window.location.reload()}
                      className="px-6 py-3 bg-error text-white font-bold rounded-xl flex items-center gap-2 hover:scale-[0.98] transition-all shadow-lg shadow-error/20"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Retry Connection
                    </button>
                    <a 
                      href="https://supabase.com/dashboard" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-surface-container text-on-surface-variant font-bold rounded-xl flex items-center gap-2 hover:bg-surface-container-high transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Check Supabase Dashboard
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-7xl mx-auto w-full"
            >
              {currentView === 'dashboard' && (
                <DashboardView 
                  tasks={tasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))}
                  projects={projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))}
                  onTaskClick={setSelectedTask} 
                  onProjectClick={(projectId) => {
                    setSelectedProjectId(projectId);
                    setCurrentView('projects');
                  }}
                  onViewAllTasks={() => {
                    setSelectedProjectId(null);
                    setCurrentView('projects');
                  }}
                  userProfile={userProfile}
                  teamMembers={teamMembers}
                />
              )}
              {currentView === 'projects' && (
                <ProjectsView 
                  tasks={tasks.filter(t => {
                    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
                    const matchesProject = selectedProjectId ? t.projectId === selectedProjectId : true;
                    return matchesSearch && matchesProject;
                  })}
                  activeProject={projects.find(p => p.id === selectedProjectId) || null}
                  onTaskClick={setSelectedTask} 
                  onShowToast={showToast}
                  teamMembers={teamMembers}
                  projects={projects}
                  onProjectClick={setSelectedProjectId}
                  onUpdateTask={async (updatedTask) => {
                    const newTasks = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
                    setTasks(newTasks);
                    try {
                      const { error } = await supabase.from('tasks').upsert(updatedTask);
                      if (error) {
                        console.error('Supabase update error:', error);
                        showToast(`Failed to sync: ${error.message}`);
                      }
                    } catch (err: any) {
                      console.error('Supabase update error:', err);
                      showToast(`Failed to sync: ${err.message || 'Unknown error'}`);
                    }
                  }}
                  onAddTask={async (status) => {
                    const newTask: Task = {
                      id: Math.random().toString(36).substr(2, 9),
                      title: 'New Task',
                      status: status || 'To Do',
                      assignees: ['You'],
                      dueDate: 'Tomorrow',
                      priority: 'Medium',
                      category: 'General',
                      description: '',
                      subtasks: [],
                      projectId: selectedProjectId || undefined,
                      dependencies: [],
                      comments: 0,
                      attachments: 0,
                      progress: 0
                    };
                    setTasks([...tasks, newTask]);
                    setSelectedTask(newTask);
                    try {
                      const { error } = await supabase.from('tasks').insert(newTask);
                      if (error) {
                        console.error('Supabase task insert error:', error);
                        showToast(`Failed to sync: ${error.message}`);
                      }
                    } catch (err: any) {
                      console.error('Supabase task insert error:', err);
                      showToast(`Failed to sync: ${err.message || 'Unknown error'}`);
                    }
                  }}
                />
              )}
              {currentView === 'calendar' && <CalendarView tasks={tasks} />}
              {currentView === 'team' && <TeamView 
                teamMembers={teamMembers} 
                tasks={tasks}
                projects={projects}
                isAdmin={isAdmin}
                onMemberClick={(memberId) => {
                  if (isAdmin) {
                    const memberProfile = allProfiles.find(p => p.id === memberId);
                    if (memberProfile) {
                      setEditingMemberId(memberId);
                      setCurrentView('profile');
                    }
                  }
                }}
              />}
              {currentView === 'settings' && userProfile && (
                <SettingsView 
                  profile={userProfile} 
                  isAdmin={isAdmin} 
                  onShowToast={showToast}
                  onUpdateProfile={async (updatedProfile) => {
                    setUserProfile(updatedProfile);
                    try {
                      const { error } = await supabase.from('profiles').upsert(updatedProfile);
                      if (error) {
                        console.error('Supabase profile update error:', error);
                        showToast(`Settings sync failed: ${error.message}`);
                      } else {
                        showToast("Settings updated successfully");
                      }
                    } catch (err: any) {
                      console.error('Supabase profile update error:', err);
                      showToast(`Settings sync failed: ${err.message || 'Unknown error'}`);
                    }
                  }}
                />
              )}
              {currentView === 'profile' && (userProfile || editingMemberId) && (
                <ProfileView 
                  key={editingMemberId || userProfile?.id}
                  profile={editingMemberId ? (allProfiles.find(m => m.id === editingMemberId) || userProfile!) : userProfile!} 
                  onShowToast={showToast}
                  isAdmin={isAdmin}
                  onUpdateProfile={async (updatedProfile) => {
                    if (editingMemberId) {
                      // Update the profile in the list
                      const newProfiles = allProfiles.map(p => p.id === updatedProfile.id ? updatedProfile : p);
                      setAllProfiles(newProfiles);
                      
                      // Update team members as well
                      const newTeam = teamMembers.map(m => m.id === updatedProfile.id ? { ...m, name: updatedProfile.name, role: updatedProfile.role, avatar: updatedProfile.avatar } : m);
                      setTeamMembers(newTeam);
                    } else {
                      setUserProfile(updatedProfile);
                      // Update in allProfiles too
                      setAllProfiles(allProfiles.map(p => p.id === updatedProfile.id ? updatedProfile : p));
                    }
                    
                    try {
                      const { error } = await supabase.from('profiles').upsert(updatedProfile);
                      if (error) {
                        console.error('Supabase profile update error:', error);
                        showToast(`Profile sync failed: ${error.message}`);
                      } else {
                        showToast("Profile updated successfully");
                        if (editingMemberId) setEditingMemberId(null);
                      }
                    } catch (err: any) {
                      console.error('Supabase profile update error:', err);
                      showToast(`Profile sync failed: ${err.message || 'Unknown error'}`);
                    }
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Task Detail Sidebar */}
      <AnimatePresence>
        {selectedTask && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTask(null)}
              className="fixed inset-0 bg-on-surface/20 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-surface-bright z-50 shadow-ambient flex flex-col"
            >
              <TaskDetailView 
                task={selectedTask} 
                allTasks={tasks}
                onClose={() => setSelectedTask(null)} 
                teamMembers={teamMembers}
                onUpdateTask={async (updatedTask) => {
                  const newTasks = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
                  setTasks(newTasks);
                  setSelectedTask(updatedTask);
                  try {
                    const { error } = await supabase.from('tasks').upsert(updatedTask);
                    if (error) {
                      console.error('Supabase update error:', error);
                      showToast(`Failed to sync: ${error.message}`);
                      return { success: false, error };
                    }
                    showToast("Changes saved successfully");
                    return { success: true };
                  } catch (err: any) {
                    console.error('Supabase update error:', err);
                    showToast(`Failed to sync: ${err.message || 'Unknown error'}`);
                    return { success: false, error: err };
                  }
                }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* New Project Modal */}
      <AnimatePresence>
        {isNewProjectModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewProjectModalOpen(false)}
              className="fixed inset-0 bg-on-surface/20 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 m-auto w-full max-w-md h-fit bg-surface-bright z-[70] shadow-ambient rounded-3xl p-8 flex flex-col gap-6"
            >
              <h3 className="text-2xl font-bold font-headline">Create New Project</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2 block">Project Name</label>
                  <input 
                    className="w-full bg-surface-container border-none rounded-xl p-3 focus:ring-2 focus:ring-primary" 
                    placeholder="e.g. Q4 Marketing Campaign" 
                    value={newProjectData.name}
                    onChange={(e) => setNewProjectData({ ...newProjectData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2 block">Category</label>
                  <select 
                    className="w-full bg-surface-container border-none rounded-xl p-3 focus:ring-2 focus:ring-primary"
                    value={newProjectData.category}
                    onChange={(e) => setNewProjectData({ ...newProjectData, category: e.target.value })}
                  >
                    <option>Design</option>
                    <option>Dev</option>
                    <option>Marketing</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => setIsNewProjectModalOpen(false)} className="flex-1 py-3 font-bold text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors">Cancel</button>
                <button 
                  disabled={!canCreateProjects}
                  onClick={async () => {
                    if (!canCreateProjects) {
                      showToast("Only Project Managers can create projects");
                      return;
                    }
                    if (!newProjectData.name.trim()) {
                      showToast("Project name is required");
                      return;
                    }
                    
                    const newProject: Project = {
                      id: Math.random().toString(36).substr(2, 9),
                      name: newProjectData.name,
                      managerId: userProfile?.id,
                      members: 1,
                      activeTasks: 0,
                      progress: 0,
                      status: 'Healthy',
                      category: newProjectData.category
                    };
                    setProjects([...projects, newProject]);
                    setIsNewProjectModalOpen(false);
                    setNewProjectData({ name: '', category: 'Design' });
                    showToast(`Project "${newProject.name}" created`);
                    
                    try {
                      const { error } = await supabase.from('projects').insert(newProject);
                      if (error) throw error;
                    } catch (err: any) {
                      console.error('Supabase project insert error:', err);
                      showToast(`Sync failed: ${err.message || "Check Supabase tables and RLS policies"}`);
                    }
                  }}
                  className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                >
                  Create Project
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface/90 backdrop-blur-md flex justify-around items-center px-4 z-40 border-t border-outline-variant/10">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id as View)}
            className={cn(
              "p-2 transition-colors",
              currentView === item.id ? "text-primary" : "text-on-surface-variant/60"
            )}
          >
            <item.icon className="w-6 h-6" />
          </button>
        ))}
      </nav>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] bg-on-surface text-surface px-6 py-3 rounded-2xl font-bold shadow-2xl flex items-center gap-3"
          >
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProfileView({ profile, onUpdateProfile, onShowToast, isAdmin }: { 
  profile: UserProfile, 
  onUpdateProfile: (profile: UserProfile) => void,
  onShowToast: (msg: string) => void,
  isAdmin: boolean
}) {
  const [editedProfile, setEditedProfile] = useState<UserProfile>({
    ...profile,
    preferences: profile.preferences || {
      notifications: true,
      darkMode: false,
      language: 'English'
    }
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    onUpdateProfile(editedProfile);
    setIsEditing(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onShowToast("Please upload an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      onShowToast("Image size must be less than 2MB");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const updated = { ...editedProfile, avatar: publicUrl };
      setEditedProfile(updated);
      onUpdateProfile(updated);
      onShowToast("Profile picture uploaded successfully");
    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      if (err.message === 'Bucket not found') {
        onShowToast("Storage bucket 'avatars' not found. Please create it in your Supabase dashboard.");
      } else {
        onShowToast(`Upload failed: ${err.message}`);
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Avatar Section */}
        <div className="w-full md:w-1/3 flex flex-col items-center gap-6 bg-surface-container-lowest p-8 rounded-3xl shadow-ambient">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-primary/20 shadow-xl bg-surface-container flex items-center justify-center">
              {isUploading ? (
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <img 
                  src={editedProfile.avatar} 
                  alt={editedProfile.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
            {isEditing && (
              <>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept="image/*"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:scale-110 transition-transform disabled:opacity-50"
                >
                  <Camera className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-bold font-headline">{editedProfile.name}</h3>
            <p className="text-on-surface-variant font-medium">{editedProfile.role}</p>
          </div>
          <div className="w-full pt-6 border-t border-outline-variant/10 space-y-4">
            <div className="flex items-center gap-3 text-on-surface-variant">
              <Mail className="w-4 h-4" />
              <span className="text-sm font-medium">{editedProfile.email}</span>
            </div>
            <div className="flex items-center gap-3 text-on-surface-variant">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">Admin Access</span>
            </div>
          </div>
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              className="w-full py-3 bg-surface-container-high text-on-surface font-bold rounded-xl hover:bg-surface-container-highest transition-colors"
            >
              Edit Profile
            </button>
          ) : (
            <div className="w-full flex gap-2">
              <button 
                onClick={() => setIsEditing(false)}
                className="flex-1 py-3 bg-surface-container-high text-on-surface font-bold rounded-xl hover:bg-surface-container-highest transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
              >
                Save
              </button>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="flex-1 space-y-8">
          <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-ambient space-y-6">
            <h4 className="text-xl font-bold font-headline flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              General Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Full Name</label>
                <input 
                  disabled={!isEditing}
                  value={editedProfile.name}
                  onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                  className="w-full bg-surface-container border-none rounded-xl p-3 focus:ring-2 focus:ring-primary disabled:opacity-60"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant flex items-center justify-between">
                  Job Title
                  {!isAdmin && <span className="text-[9px] text-primary/60 lowercase font-medium italic">Only Admins can change roles</span>}
                </label>
                <input 
                  disabled={!isEditing || !isAdmin}
                  value={editedProfile.role}
                  onChange={(e) => setEditedProfile({ ...editedProfile, role: e.target.value })}
                  className="w-full bg-surface-container border-none rounded-xl p-3 focus:ring-2 focus:ring-primary disabled:opacity-60"
                  placeholder="e.g. Designer, Developer"
                />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Bio</label>
                <textarea 
                  disabled={!isEditing}
                  value={editedProfile.bio}
                  onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                  className="w-full bg-surface-container border-none rounded-xl p-3 focus:ring-2 focus:ring-primary disabled:opacity-60 min-h-[100px] resize-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-ambient space-y-6">
            <h4 className="text-xl font-bold font-headline flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Preferences
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-surface-container rounded-2xl">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-on-surface-variant" />
                  <div>
                    <p className="font-bold text-sm">Push Notifications</p>
                    <p className="text-xs text-on-surface-variant">Receive alerts about task updates</p>
                  </div>
                </div>
                <button 
                  disabled={!isEditing}
                  onClick={() => setEditedProfile({
                    ...editedProfile,
                    preferences: { ...editedProfile.preferences, notifications: !editedProfile.preferences?.notifications }
                  })}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    editedProfile.preferences?.notifications ? "bg-primary" : "bg-surface-container-highest"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                    editedProfile.preferences?.notifications ? "left-7" : "left-1"
                  )} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-surface-container rounded-2xl">
                <div className="flex items-center gap-3">
                  {editedProfile.preferences?.darkMode ? <Moon className="w-5 h-5 text-on-surface-variant" /> : <Sun className="w-5 h-5 text-on-surface-variant" />}
                  <div>
                    <p className="font-bold text-sm">Dark Mode</p>
                    <p className="text-xs text-on-surface-variant">Switch to high-contrast dark theme</p>
                  </div>
                </div>
                <button 
                  disabled={!isEditing}
                  onClick={() => setEditedProfile({
                    ...editedProfile,
                    preferences: { ...editedProfile.preferences, darkMode: !editedProfile.preferences?.darkMode }
                  })}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    editedProfile.preferences?.darkMode ? "bg-primary" : "bg-surface-container-highest"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                    editedProfile.preferences?.darkMode ? "left-7" : "left-1"
                  )} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-surface-container rounded-2xl">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-on-surface-variant" />
                  <div>
                    <p className="font-bold text-sm">Language</p>
                    <p className="text-xs text-on-surface-variant">Select your preferred interface language</p>
                  </div>
                </div>
                <select 
                  disabled={!isEditing}
                  value={editedProfile.preferences?.language}
                  onChange={(e) => setEditedProfile({
                    ...editedProfile,
                    preferences: { ...editedProfile.preferences, language: e.target.value }
                  })}
                  className="bg-surface-container-highest border-none rounded-lg text-xs font-bold p-2 focus:ring-primary"
                >
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                </select>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function SettingsView({ profile, isAdmin, onShowToast, onUpdateProfile }: { 
  profile: UserProfile, 
  isAdmin: boolean, 
  onShowToast: (msg: string) => void,
  onUpdateProfile: (profile: UserProfile) => void
}) {
  const [activeTab, setActiveTab] = useState('General');
  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);

  const tabs = [
    { id: 'General', icon: Settings },
    { id: 'Security', icon: ShieldCheck },
    { id: 'Workspace', icon: Layers },
    { id: 'Notifications', icon: Bell },
  ];

  const handleToggle = (key: keyof UserProfile['preferences']) => {
    const updated = {
      ...editedProfile,
      preferences: {
        ...editedProfile.preferences,
        [key]: !editedProfile.preferences[key]
      }
    };
    setEditedProfile(updated);
    onUpdateProfile(updated);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="space-y-2">
        <h2 className="text-4xl font-extrabold text-on-surface tracking-tight font-headline">Settings</h2>
        <p className="text-on-surface-variant text-lg">Manage your account and workspace preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Nav */}
        <div className="md:w-64 space-y-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
                activeTab === tab.id 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-on-surface-variant hover:bg-surface-container"
              )}
            >
              <tab.icon className="w-5 h-5" />
              {tab.id}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-surface-container-lowest rounded-3xl p-8 shadow-ambient border border-outline-variant/5">
          {activeTab === 'General' && (
            <div className="space-y-8">
              <div className="space-y-6">
                <h3 className="text-xl font-bold font-headline">Display Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-surface-container rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Sun className="w-5 h-5 text-on-surface-variant" />
                      <div>
                        <p className="font-bold text-sm">Dark Mode</p>
                        <p className="text-xs text-on-surface-variant">Switch to high-contrast dark theme</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleToggle('darkMode')}
                      className={cn(
                        "w-12 h-6 rounded-full transition-colors relative",
                        editedProfile.preferences?.darkMode ? "bg-primary" : "bg-surface-container-highest"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        editedProfile.preferences?.darkMode ? "left-7" : "left-1"
                      )} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-bold font-headline">Language</h3>
                <select 
                  value={editedProfile.preferences?.language}
                  onChange={(e) => {
                    const updated = {
                      ...editedProfile,
                      preferences: { ...editedProfile.preferences, language: e.target.value }
                    };
                    setEditedProfile(updated);
                    onUpdateProfile(updated);
                  }}
                  className="w-full bg-surface-container border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary font-bold"
                >
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'Notifications' && (
            <div className="space-y-8">
              <h3 className="text-xl font-bold font-headline">Notification Channels</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-surface-container rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-on-surface-variant" />
                    <div>
                      <p className="font-bold text-sm">Push Notifications</p>
                      <p className="text-xs text-on-surface-variant">Receive alerts about task updates</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleToggle('notifications')}
                    className={cn(
                      "w-12 h-6 rounded-full transition-colors relative",
                      editedProfile.preferences?.notifications ? "bg-primary" : "bg-surface-container-highest"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                      editedProfile.preferences?.notifications ? "left-7" : "left-1"
                    )} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Security' && (
            <div className="space-y-8">
              <h3 className="text-xl font-bold font-headline">Account Security</h3>
              <div className="p-6 bg-surface-container rounded-2xl space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-success">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Two-Factor Authentication</p>
                    <p className="text-xs text-on-surface-variant">Add an extra layer of security to your account</p>
                  </div>
                </div>
                <button 
                  onClick={() => onShowToast("2FA setup coming soon")}
                  className="w-full py-3 bg-surface-container-highest text-on-surface font-bold rounded-xl hover:bg-primary hover:text-white transition-all"
                >
                  Enable 2FA
                </button>
              </div>
            </div>
          )}

          {activeTab === 'Workspace' && (
            <div className="space-y-8">
              <h3 className="text-xl font-bold font-headline">Workspace Configuration</h3>
              <div className="space-y-6">
                <div className="p-6 bg-surface-container rounded-2xl space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Workspace Name</p>
                  <p className="text-lg font-bold">Beached Street Property</p>
                </div>
                
                {isAdmin && (
                  <div className="p-6 bg-primary/5 border border-primary/10 rounded-2xl space-y-4">
                    <div className="flex items-center gap-3">
                      <Settings className="w-5 h-5 text-primary" />
                      <p className="font-bold text-primary">Admin Controls</p>
                    </div>
                    <p className="text-sm text-on-surface-variant">As an administrator, you can manage global workspace settings and user permissions.</p>
                    <button 
                      onClick={() => onShowToast("Admin dashboard coming soon")}
                      className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20"
                    >
                      Open Admin Dashboard
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Sub-Views ---

function DashboardView({ tasks, projects, onTaskClick, onProjectClick, onViewAllTasks, userProfile, teamMembers }: { 
  tasks: Task[], 
  projects: Project[], 
  onTaskClick: (task: Task) => void,
  onProjectClick: (projectId: string) => void,
  onViewAllTasks: () => void,
  userProfile: UserProfile | null,
  teamMembers: TeamMember[]
}) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const firstName = userProfile?.name.split(' ')[0] || 'there';

  return (
    <div className="space-y-12">
      <section>
        <h2 className="text-4xl font-headline font-extrabold text-on-surface tracking-tight mb-2">Welcome back, {firstName}.</h2>
        <p className="text-on-surface-variant font-sans text-lg">You have {tasks.filter(t => t.dueDate === todayStr || t.dueDate === 'Today').length} critical tasks finishing today.</p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Active Tasks */}
        <div className="md:col-span-8 bg-surface-container-lowest rounded-2xl p-8 shadow-ambient flex flex-col gap-8 transition-all hover:bg-surface-bright">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-xs font-bold font-headline uppercase tracking-widest text-primary-dim">Overview</span>
              <h3 className="text-2xl font-headline font-bold text-on-surface">My Active Tasks</h3>
            </div>
            <button 
              onClick={onViewAllTasks}
              className="text-primary font-headline font-semibold flex items-center gap-1 hover:underline"
            >
              View All <Plus className="w-4 h-4 rotate-45" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {tasks.slice(0, 2).map(task => (
              <div 
                key={task.id} 
                onClick={() => onTaskClick(task)}
                className="bg-surface-container p-6 rounded-2xl space-y-4 hover:scale-[1.01] transition-transform cursor-pointer group"
              >
                <div className="flex justify-between items-start">
                  <span className={cn(
                    "px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-tighter",
                    task.status === 'In Progress' ? "bg-secondary-container text-on-secondary-container" : "bg-error-container text-on-error-container"
                  )}>
                    {task.status}
                  </span>
                  <Plus className="w-4 h-4 text-on-surface-variant group-hover:text-primary transition-colors" />
                </div>
                <h4 className="font-headline font-bold text-on-surface text-lg leading-tight">{task.title}</h4>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {task.assignees.map((a, i) => (
                      <div key={i} className="w-6 h-6 rounded-full bg-primary-fixed ring-2 ring-surface-container flex items-center justify-center text-[10px] text-white font-bold">
                        {a[0]}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-on-surface-variant font-medium">{task.dueDate || 'No deadline'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Global Velocity */}
        <div className="md:col-span-4 bg-primary text-on-primary rounded-2xl p-8 flex flex-col justify-between shadow-ambient relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Layers className="w-32 h-32" />
          </div>
          <div className="z-10">
            <h3 className="text-xl font-headline font-bold mb-1">Global Velocity</h3>
            <p className="text-primary-container text-sm font-medium">Progress across 12 active streams</p>
          </div>
          <div className="z-10 space-y-4">
            <div className="flex items-end gap-2">
              <span className="text-5xl font-headline font-extrabold leading-none">84%</span>
              <span className="text-sm font-bold mb-1">+12% vs last week</span>
            </div>
            <div className="w-full bg-on-primary/20 h-3 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '84%' }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="bg-white h-full" 
              />
            </div>
          </div>
        </div>

        {/* Deadlines */}
        <div className="md:col-span-4 bg-surface-container-low rounded-2xl p-8 flex flex-col gap-6 shadow-sm">
          <h3 className="text-xl font-headline font-bold text-on-surface flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            Deadlines
          </h3>
          <ul className="space-y-4">
            {[
              { date: '12', month: 'Oct', title: 'Client Onboarding', sub: 'Beached Street Project' },
              { date: '15', month: 'Oct', title: 'Beta Release', sub: 'Internal Alpha' }
            ].map((d, i) => (
              <li key={i} className="flex items-center gap-4">
                <div className="flex flex-col items-center justify-center bg-surface-container-lowest w-12 h-12 rounded-xl shadow-sm shrink-0">
                  <span className="text-[10px] font-bold uppercase text-primary-dim">{d.month}</span>
                  <span className="text-lg font-bold leading-none">{d.date}</span>
                </div>
                <div>
                  <h5 className="font-bold text-sm text-on-surface">{d.title}</h5>
                  <p className="text-xs text-on-surface-variant">{d.sub}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Recent Activity */}
        <div className="md:col-span-8 bg-surface-container-low rounded-2xl p-8 flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-headline font-bold text-on-surface">Recent Activity</h3>
            <button className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-6">
            {tasks.length === 0 ? (
              <div className="text-center py-10 text-on-surface-variant/40 italic text-sm">
                No recent activity to show.
              </div>
            ) : (
              tasks.slice(0, 3).map(task => (
                <div key={task.id} className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 ring-2 ring-white">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 pb-6 border-b border-surface-container-high last:border-0">
                    <p className="text-on-surface leading-snug">
                      Task <span className="font-bold">{task.title}</span> is currently <span className="font-semibold text-primary">{task.status}</span>
                    </p>
                    <span className="text-xs text-on-surface-variant font-medium">Updated recently</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Stream Performance */}
      <section className="space-y-8">
        <h3 className="text-2xl font-headline font-bold text-on-surface">Stream Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {projects.map(project => (
            <div 
              key={project.id} 
              onClick={() => onProjectClick(project.id)}
              className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient space-y-4 hover:scale-[1.02] transition-transform cursor-pointer group"
            >
              <div className="flex justify-between items-start">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  project.category === 'Design' ? "bg-primary/10 text-primary" : project.category === 'Dev' ? "bg-tertiary/10 text-tertiary" : "bg-secondary/10 text-secondary"
                )}>
                  <Layers className="w-6 h-6" />
                </div>
                <span className={cn(
                  "px-2 py-1 text-[10px] font-bold rounded-lg uppercase",
                  project.status === 'Healthy' ? "bg-green-100 text-green-700" : "bg-secondary-container text-on-secondary-container"
                )}>
                  {project.status}
                </span>
              </div>
              <div>
                <h4 className="font-headline font-bold text-lg">{project.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  {teamMembers.find(m => m.id === project.managerId) && (
                    <img 
                      src={teamMembers.find(m => m.id === project.managerId)?.avatar} 
                      className="w-4 h-4 rounded-full object-cover" 
                      referrerPolicy="no-referrer" 
                    />
                  )}
                  <p className="text-[10px] text-on-surface-variant font-medium">
                    {teamMembers.find(m => m.id === project.managerId)?.name || 'No Manager'} • {project.activeTasks} tasks
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-surface-container-high flex justify-between items-center">
                <div className="flex -space-x-1">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-6 h-6 rounded-full bg-surface-container-high border border-white" />
                  ))}
                </div>
                <span className="text-sm font-bold text-on-surface">{project.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SortableTask({ task, onClick }: { task: Task, onClick: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="group bg-surface-container-lowest p-6 rounded-2xl shadow-sm hover:scale-[1.01] hover:shadow-xl hover:shadow-on-surface/5 transition-all duration-200 cursor-pointer border border-outline-variant/5 touch-none"
    >
      {task.category && (
        <div className="flex gap-2 mb-4">
          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">{task.category}</span>
        </div>
      )}
      <h4 className="font-semibold text-on-surface mb-6 leading-snug">{task.title}</h4>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-on-surface-variant/60">
          <CalendarIcon className="w-4 h-4" />
          <span className="text-xs font-medium">{task.dueDate || 'No date'}</span>
        </div>
        <div className="flex -space-x-2">
          {task.assignees.map((a, i) => (
            <div key={i} className="w-6 h-6 rounded-full bg-primary-fixed ring-2 ring-surface-container-lowest flex items-center justify-center text-[10px] text-white font-bold">
              {a[0]}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProjectsView({ tasks, activeProject, onTaskClick, onAddTask, onUpdateTask, onShowToast, teamMembers, projects, onProjectClick }: { 
  tasks: Task[], 
  activeProject: Project | null,
  onTaskClick: (task: Task) => void,
  onAddTask: (status?: Status) => void,
  onUpdateTask: (task: Task) => void,
  onShowToast: (msg: string) => void,
  teamMembers: TeamMember[],
  projects: Project[],
  onProjectClick: (id: string | null) => void
}) {
  const [activeTab, setActiveTab] = useState('Board');
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 3)); // April 2026
  const columns: Status[] = ['To Do', 'In Progress', 'Review', 'On Hold', 'Done', 'Completed'];
  
  const tabs = ['Overview', 'List', 'Board', 'Timeline', 'Dashboard', 'Calendar'];

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)));
  const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)));
  const handleToday = () => setCurrentMonth(new Date(2026, 3));

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find(t => t.id === activeId);
    if (!activeTask) return;

    // If dropped over a column (column id is the status)
    if (columns.includes(overId as Status)) {
      if (activeTask.status !== overId) {
        onUpdateTask({ ...activeTask, status: overId as Status });
      }
      return;
    }

    // If dropped over another task
    const overTask = tasks.find(t => t.id === overId);
    if (overTask && activeTask.status !== overTask.status) {
      onUpdateTask({ ...activeTask, status: overTask.status });
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Header & Sub-nav */}
      <div className="space-y-6">
        {!activeProject && (
          <div className="bg-surface-container-low rounded-3xl p-8 border border-outline-variant/10 shadow-ambient mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold font-headline">Project Directory</h3>
                <p className="text-on-surface-variant text-sm">Overview of all active streams and their managers.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-on-surface-variant/60 uppercase tracking-widest">Sort by:</span>
                <select className="bg-surface-container-high border-none rounded-lg text-xs font-bold py-1.5 px-3 focus:ring-2 focus:ring-primary">
                  <option>Recent</option>
                  <option>Priority</option>
                  <option>Progress</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(project => {
                const manager = teamMembers.find(m => m.id === project.managerId);
                return (
                  <div 
                    key={project.id}
                    onClick={() => onProjectClick(project.id)}
                    className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/5 hover:scale-[1.02] hover:shadow-xl transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Layers className="w-5 h-5" />
                      </div>
                      <span className="px-2 py-1 bg-success/10 text-success text-[10px] font-bold rounded-lg uppercase">Healthy</span>
                    </div>
                    <h4 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{project.name}</h4>
                    <div className="flex items-center gap-2 mb-4">
                      {manager ? (
                        <>
                          <img src={manager.avatar} className="w-5 h-5 rounded-full object-cover" referrerPolicy="no-referrer" />
                          <span className="text-xs font-medium text-on-surface-variant">{manager.name}</span>
                        </>
                      ) : (
                        <span className="text-xs font-medium text-on-surface-variant/40 italic">No manager assigned</span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${project.progress}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {activeProject && (
                <button 
                  onClick={() => onProjectClick(null)}
                  className="p-1 hover:bg-surface-container rounded-lg text-on-surface-variant transition-colors mr-2"
                  title="Back to Directory"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <span className="px-2 py-0.5 rounded-md bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-widest">
                {activeProject ? 'Active Project' : 'All Projects'}
              </span>
              <span className="text-on-surface-variant/40">•</span>
              <span className="text-sm font-medium text-on-surface-variant">Updated 2h ago</span>
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight text-on-surface font-headline">
              {activeProject ? activeProject.name : 'Global Workspace'}
            </h2>
          </div>
          <div className="flex -space-x-3">
            {teamMembers.slice(0, 3).map(m => (
              <img key={m.id} src={m.avatar} alt={m.name} className="w-10 h-10 rounded-full ring-4 ring-surface object-cover" referrerPolicy="no-referrer" />
            ))}
            {teamMembers.length > 3 && (
              <div className="w-10 h-10 rounded-full bg-surface-container-highest ring-4 ring-surface flex items-center justify-center text-xs font-bold text-on-surface-variant">+{teamMembers.length - 3}</div>
            )}
          </div>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-outline-variant/10">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-3 text-sm font-semibold transition-all relative",
                activeTab === tab ? "text-primary" : "text-on-surface-variant/60 hover:text-on-surface"
              )}
            >
              {tab}
              {activeTab === tab && (
                <motion.div 
                  layoutId="active-project-tab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </button>
          ))}
          <button className="p-3 text-on-surface-variant/60 hover:text-primary">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Secondary Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <button 
                onClick={() => onAddTask()}
                className="bg-primary text-on-primary px-4 py-2 rounded-l-xl text-sm font-bold flex items-center gap-2 hover:bg-primary-dim transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add task
              </button>
              <button className="bg-primary text-on-primary p-2 rounded-r-xl border-l border-on-primary/20 hover:bg-primary-dim transition-colors">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            
            <div className="h-8 w-[1px] bg-outline-variant/20 mx-1" />
            
            <div className="flex items-center gap-1">
              <button 
                onClick={handlePrevMonth}
                className="p-2 text-on-surface-variant hover:text-primary transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={handleToday}
                className="px-3 py-1.5 text-sm font-bold text-on-surface hover:bg-surface-container rounded-lg transition-colors"
              >
                Today
              </button>
              <button 
                onClick={handleNextMonth}
                className="p-2 text-on-surface-variant hover:text-primary transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <span className="text-sm font-bold text-on-surface ml-2">{monthName}</span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => onShowToast("Month view options coming soon")}
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-xl transition-all"
            >
              <HelpCircle className="w-4 h-4" />
              Months
            </button>
            <button 
              onClick={() => onShowToast("Filter options coming soon")}
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-xl transition-all"
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <button 
              onClick={() => onShowToast("Project settings coming soon")}
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-xl transition-all"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Options
            </button>
            <button 
              onClick={() => onShowToast("Search within project coming soon")}
              className="p-2 text-on-surface-variant hover:text-primary transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'Overview' ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              <div className="md:col-span-8 space-y-8">
                <div className="bg-surface-container-low rounded-3xl p-8 border border-outline-variant/10 shadow-ambient">
                  <h3 className="text-xl font-bold font-headline mb-6">Project Summary</h3>
                  <p className="text-on-surface-variant leading-relaxed mb-8">
                    {activeProject?.description || "This project focuses on delivering high-quality results through iterative development and collaborative team efforts. We are currently in the execution phase with a focus on core features."}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">Status</span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-success" />
                        <span className="font-bold text-sm">On Track</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">Progress</span>
                      <span className="font-bold text-sm block">68%</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">Due Date</span>
                      <span className="font-bold text-sm block">Oct 24, 2026</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">Priority</span>
                      <span className="font-bold text-sm block text-error">High</span>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-container-low rounded-3xl p-8 border border-outline-variant/10 shadow-ambient">
                  <h3 className="text-xl font-bold font-headline mb-6">Recent Activity</h3>
                  <div className="space-y-6">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <RefreshCw className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">Task "{tasks[i]?.title || 'Update Documentation'}" moved to Review</p>
                          <p className="text-xs text-on-surface-variant">by {teamMembers[i % teamMembers.length]?.name} • 2h ago</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="md:col-span-4 space-y-8">
                <div className="bg-primary text-on-primary rounded-3xl p-8 shadow-xl shadow-primary/20 relative overflow-hidden">
                  <Zap className="absolute -right-4 -top-4 w-32 h-32 opacity-10 rotate-12" />
                  <h3 className="text-xl font-bold font-headline mb-2 relative z-10">AI Project Pulse</h3>
                  <p className="text-on-primary/80 text-sm mb-6 relative z-10">Velocity is up 12% this week. Team is performing above baseline.</p>
                  <button className="w-full py-3 bg-white text-primary font-bold rounded-xl text-sm relative z-10 hover:bg-on-primary-fixed-variant hover:text-white transition-all">
                    Generate Report
                  </button>
                </div>

                <div className="bg-surface-container-low rounded-3xl p-8 border border-outline-variant/10 shadow-ambient">
                  <h3 className="text-sm font-bold font-headline mb-4 uppercase tracking-widest text-on-surface-variant">Team Members</h3>
                  <div className="flex flex-wrap gap-3">
                    {teamMembers.map(m => (
                      <img key={m.id} src={m.avatar} className="w-10 h-10 rounded-xl object-cover ring-2 ring-surface" referrerPolicy="no-referrer" title={m.name} />
                    ))}
                    <button className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'List' ? (
            <div className="bg-surface-container-low rounded-3xl border border-outline-variant/10 shadow-ambient overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/10">
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">Task Name</th>
                      {!activeProject && <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">Project</th>}
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">Status</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">Assignee</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">Due Date</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">Priority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/5">
                    {tasks.map(task => (
                      <tr 
                        key={task.id} 
                        onClick={() => onTaskClick(task)}
                        className="hover:bg-surface-container transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              (task.status === 'Done' || task.status === 'Completed') ? "bg-success" : task.status === 'On Hold' ? "bg-error" : "bg-primary"
                            )} />
                            <span className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">{task.title}</span>
                          </div>
                        </td>
                        {!activeProject && (
                          <td className="px-6 py-4">
                            <span className="text-xs font-medium text-on-surface-variant">
                              {projects.find(p => p.id === task.projectId)?.name || 'Global'}
                            </span>
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                            (task.status === 'Done' || task.status === 'Completed') ? "bg-success/10 text-success" : 
                            task.status === 'On Hold' ? "bg-error/10 text-error" : 
                            "bg-primary/10 text-primary"
                          )}>
                            {task.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <img src={teamMembers[0].avatar} className="w-6 h-6 rounded-full object-cover" referrerPolicy="no-referrer" />
                            <span className="text-xs font-medium text-on-surface-variant">Assigned</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-on-surface-variant">{task.dueDate}</td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold text-error">High</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'Board' ? (
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-8 overflow-x-auto pb-10 no-scrollbar min-h-[600px]">
                {columns.map(status => (
                  <div key={status} className="flex-shrink-0 w-80 flex flex-col">
                    <div className="flex items-center justify-between px-4 mb-6">
                      <div className="flex items-center gap-2">
                        <h3 className="font-headline font-bold text-lg">{status}</h3>
                        <span className="bg-surface-container-high px-2 py-0.5 rounded-full text-xs font-bold text-on-surface-variant">
                          {tasks.filter(t => t.status === status).length}
                        </span>
                      </div>
                      <button 
                        onClick={() => onAddTask(status)}
                        className="text-on-surface-variant/40 hover:text-primary transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <SortableContext 
                      id={status}
                      items={tasks.filter(t => t.status === status).map(t => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-4 flex-1 min-h-[100px]">
                        {tasks.filter(t => t.status === status).map(task => (
                          <SortableTask 
                            key={task.id} 
                            task={task} 
                            onClick={() => onTaskClick(task)} 
                          />
                        ))}
                        <button 
                          onClick={() => onAddTask(status)}
                          className="w-full py-4 border-2 border-dashed border-outline-variant/30 rounded-2xl text-on-surface-variant/40 font-bold text-sm hover:border-primary/40 hover:text-primary transition-all duration-200"
                        >
                          + Add Task
                        </button>
                      </div>
                    </SortableContext>
                  </div>
                ))}
              </div>
            </DndContext>
          ) : activeTab === 'Timeline' ? (
            <GanttChart tasks={tasks} projects={activeProject ? [activeProject] : projects} />
          ) : activeTab === 'Dashboard' ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              <div className="md:col-span-4 bg-surface-container-low rounded-3xl p-8 border border-outline-variant/10 shadow-ambient">
                <h3 className="text-sm font-bold font-headline mb-6 uppercase tracking-widest text-on-surface-variant">Task Distribution</h3>
                <div className="space-y-6">
                  {columns.map(status => {
                    const count = tasks.filter(t => t.status === status).length;
                    const percentage = (count / tasks.length) * 100;
                    return (
                      <div key={status} className="space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-on-surface">{status}</span>
                          <span className="text-on-surface-variant">{count}</span>
                        </div>
                        <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            className={cn(
                              "h-full rounded-full",
                              (status === 'Done' || status === 'Completed') ? "bg-success" : status === 'On Hold' ? "bg-error" : "bg-primary"
                            )}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="md:col-span-8 bg-surface-container-low rounded-3xl p-8 border border-outline-variant/10 shadow-ambient">
                <h3 className="text-sm font-bold font-headline mb-6 uppercase tracking-widest text-on-surface-variant">Velocity Trend</h3>
                <div className="h-64 flex items-end gap-4 px-4">
                  {[45, 60, 55, 80, 75, 90, 85].map((val, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${val}%` }}
                        className="w-full bg-primary/20 rounded-t-xl group-hover:bg-primary transition-colors relative"
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-on-surface text-surface text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          {val}%
                        </div>
                      </motion.div>
                      <span className="text-[10px] font-bold text-on-surface-variant/40">W{i+1}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === 'Calendar' ? (
            <CalendarView tasks={tasks} />
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-on-surface-variant/40 bg-surface-container-low rounded-3xl border-2 border-dashed border-outline-variant/20">
              <Layers className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-headline font-bold text-xl">{activeTab} View coming soon</p>
              <p className="text-sm">We're currently building this module for the Design System project.</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function CalendarView({ tasks = [] }: { tasks?: Task[] }) {
  const [view, setView] = useState('Month');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(year, currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(year, currentDate.getMonth());
  const daysInPrevMonth = getDaysInMonth(year, currentDate.getMonth() - 1);

  const calendarDays = [];
  // Prev month days
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarDays.push({ day: daysInPrevMonth - i, currentMonth: false });
  }
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({ day: i, currentMonth: true });
  }
  // Next month days
  const remaining = 42 - calendarDays.length;
  for (let i = 1; i <= remaining; i++) {
    calendarDays.push({ day: i, currentMonth: false });
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
  };

  const isToday = (day: number, isCurrentMonth: boolean) => {
    const today = new Date();
    return isCurrentMonth && 
           day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h2 className="text-4xl font-extrabold tracking-tighter text-on-surface font-headline">{monthName} {year}</h2>
            <div className="flex gap-1">
              <button onClick={handlePrevMonth} className="p-2 hover:bg-surface-container rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={handleNextMonth} className="p-2 hover:bg-surface-container rounded-lg transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          <p className="text-on-surface-variant font-medium">Dynamic calendar view synced to real-time</p>
        </div>
        <div className="flex items-center bg-surface-container-low p-1.5 rounded-2xl">
          {['Day', 'Week', 'Month', 'Agenda'].map(v => (
            <button 
              key={v} 
              onClick={() => setView(v)}
              className={cn(
                "px-6 py-2 rounded-xl font-semibold text-sm transition-all",
                v === view ? "bg-surface-container-lowest shadow-sm text-primary" : "text-on-surface-variant/60 hover:text-primary"
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-xl shadow-on-surface/5 border border-outline-variant/10">
        <div className="grid grid-cols-7 bg-surface-container-low">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-4 text-center text-[11px] font-bold tracking-widest text-on-surface-variant uppercase">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 divide-x divide-y divide-outline-variant/10">
          {calendarDays.map((item, i) => {
            const dayTasks = tasks.filter(t => {
              if (!t.dueDate) return false;
              const d = new Date(t.dueDate);
              return d.getDate() === item.day && 
                     d.getMonth() === currentDate.getMonth() && 
                     d.getFullYear() === currentDate.getFullYear() &&
                     item.currentMonth;
            });

            return (
              <div key={i} className={cn(
                "min-h-[140px] p-4 font-medium transition-colors hover:bg-surface-container/20",
                !item.currentMonth && "bg-surface-container/20 text-on-surface-variant/40",
                isToday(item.day, item.currentMonth) && "bg-primary/5 ring-2 ring-primary/20 ring-inset"
              )}>
                <div className="flex justify-between items-start mb-2">
                  <span className={cn(
                    "inline-flex w-8 h-8 items-center justify-center rounded-full text-sm font-bold",
                    isToday(item.day, item.currentMonth) ? "bg-primary text-white" : "text-on-surface"
                  )}>
                    {item.day}
                  </span>
                </div>
                <div className="space-y-1">
                  {dayTasks.map(task => (
                    <div key={task.id} className="px-2 py-1 rounded bg-primary/10 text-[10px] font-bold text-primary truncate">
                      {task.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function GanttChart({ tasks, projects }: { tasks: Task[], projects: Project[] }) {
  const [scrollPos, setScrollPos] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 7); // Start 1 week ago
  
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 21); // End 3 weeks from now
  
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const dayWidth = 100; // pixels per day
  
  const days = Array.from({ length: totalDays }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    return date;
  });

  const getTaskPosition = (task: Task) => {
    if (!task.dueDate) return null;
    const taskDate = new Date(task.dueDate);
    if (isNaN(taskDate.getTime())) return null;
    
    const diffTime = taskDate.getTime() - startDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    // Assume tasks take 3 days if not specified
    const duration = 3; 
    const left = (diffDays - duration + 1) * dayWidth;
    const width = duration * dayWidth;
    
    return { left, width };
  };

  return (
    <div className="bg-surface-container-low rounded-3xl p-8 overflow-hidden border border-outline-variant/10 shadow-ambient">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold font-headline">Global Activity Gantt</h3>
            <p className="text-xs text-on-surface-variant font-medium">Cross-project timeline synchronization</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => containerRef.current?.scrollBy({ left: -200, behavior: 'smooth' })}
            className="p-2 hover:bg-surface-container rounded-xl transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={() => containerRef.current?.scrollBy({ left: 200, behavior: 'smooth' })}
            className="p-2 hover:bg-surface-container rounded-xl transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="overflow-x-auto no-scrollbar relative"
      >
        <div style={{ width: totalDays * dayWidth }} className="relative min-h-[400px]">
          {/* Timeline Header */}
          <div className="flex border-b border-outline-variant/10 mb-6 sticky top-0 bg-surface-container-low z-20">
            {days.map((date, i) => {
              const isToday = date.toDateString() === today.toDateString();
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              return (
                <div 
                  key={i} 
                  style={{ width: dayWidth }} 
                  className={cn(
                    "shrink-0 py-4 text-center flex flex-col items-center gap-1",
                    isToday && "bg-primary/5"
                  )}
                >
                  <span className={cn(
                    "text-[10px] uppercase font-bold tracking-widest",
                    isToday ? "text-primary" : "text-on-surface-variant/40"
                  )}>
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span className={cn(
                    "w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold",
                    isToday ? "bg-primary text-white" : "text-on-surface"
                  )}>
                    {date.getDate()}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Grid Lines */}
          <div className="absolute inset-0 pointer-events-none flex">
            {days.map((_, i) => (
              <div 
                key={i} 
                style={{ width: dayWidth }} 
                className="shrink-0 border-r border-outline-variant/5 h-full"
              />
            ))}
          </div>

          {/* Today Line */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-primary z-10 pointer-events-none"
            style={{ left: Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) * dayWidth }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 px-2 py-1 bg-primary text-white text-[10px] font-bold rounded-b-md whitespace-nowrap">
              TODAY
            </div>
          </div>

          {/* Tasks */}
          <div className="space-y-4 pt-4 relative z-10">
            {projects.map(project => {
              const projectTasks = tasks.filter(t => t.projectId === project.id);
              if (projectTasks.length === 0) return null;

              return (
                <div key={project.id} className="space-y-2">
                  <div className="sticky left-0 z-30 inline-block px-4 py-1 bg-surface-container-high rounded-r-full text-[10px] font-bold uppercase tracking-widest text-primary shadow-sm">
                    {project.name}
                  </div>
                  <div className="space-y-2">
                    {projectTasks.map(task => {
                      const pos = getTaskPosition(task);
                      if (!pos) return null;

                      return (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="relative h-10 group"
                        >
                          <div 
                            style={{ left: pos.left, width: pos.width }}
                            className={cn(
                              "absolute h-full rounded-xl flex items-center px-4 shadow-sm transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer overflow-hidden",
                              (task.status === 'Done' || task.status === 'Completed') ? "bg-primary text-white" :
                              task.status === 'On Hold' ? "bg-error text-white" :
                              "bg-surface-container-highest text-on-surface"
                            )}
                          >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="text-xs font-bold truncate relative z-10">{task.title}</span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkloadHeatmap({ teamMembers }: { teamMembers: TeamMember[] }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  return (
    <div className="bg-surface-container-low rounded-3xl p-8 border border-outline-variant/10 shadow-ambient overflow-x-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <ActivityIcon className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold font-headline">Workload Intensity</h3>
          <p className="text-xs text-on-surface-variant font-medium">Real-time capacity distribution heatmap</p>
        </div>
      </div>
      
      <table className="w-full border-separate border-spacing-2">
        <thead>
          <tr>
            <th className="text-left p-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">Team Member</th>
            {days.map(day => (
              <th key={day} className="p-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {teamMembers.map(member => (
            <tr key={member.id}>
              <td className="p-2 min-w-[180px]">
                <div className="flex items-center gap-3">
                  <img src={member.avatar} className="w-10 h-10 rounded-xl object-cover" referrerPolicy="no-referrer" />
                  <div>
                    <p className="font-bold text-sm truncate">{member.name}</p>
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold">{member.role}</p>
                  </div>
                </div>
              </td>
              {days.map((day, i) => {
                // Mock intensity based on member load and some randomness for visualization
                const baseIntensity = member.load;
                const dailyVariation = Math.sin(i * 1.5) * 20;
                const intensity = Math.max(10, Math.min(100, baseIntensity + dailyVariation));
                
                return (
                  <td key={day} className="p-1">
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className={cn(
                        "h-14 min-w-[60px] rounded-xl transition-all hover:scale-105 cursor-help flex items-center justify-center",
                        intensity > 90 ? "bg-error text-white shadow-lg shadow-error/20" :
                        intensity > 70 ? "bg-primary text-white shadow-lg shadow-primary/20" :
                        intensity > 40 ? "bg-primary/40 text-on-surface" :
                        "bg-surface-container-highest text-on-surface-variant/60"
                      )}
                      title={`${member.name} - ${day}: ${Math.round(intensity)}% load`}
                    >
                      <span className="text-[10px] font-black">{Math.round(intensity)}%</span>
                    </motion.div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TeamView({ teamMembers, tasks, projects, isAdmin, onMemberClick }: { 
  teamMembers: TeamMember[], 
  tasks: Task[],
  projects: Project[],
  isAdmin: boolean, 
  onMemberClick: (id: string) => void 
}) {
  const [view, setView] = useState('Grid View');

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-extrabold text-on-surface tracking-tight font-headline">Team Workload</h2>
          <p className="text-on-surface-variant text-lg">Visualizing capacity and project timelines.</p>
        </div>
        <div className="flex items-center bg-surface-container p-1 rounded-2xl">
          {['Grid View', 'Timeline', 'Heatmap'].map(v => (
            <button 
              key={v} 
              onClick={() => setView(v)}
              className={cn(
                "px-6 py-2 rounded-xl font-semibold transition-all",
                v === view ? "bg-surface-container-lowest shadow-sm text-primary" : "text-on-surface-variant/60 hover:text-on-surface"
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="min-h-[600px]"
        >
          {view === 'Timeline' && (
            <GanttChart tasks={tasks} projects={projects} />
          )}

          {view === 'Heatmap' && (
            <WorkloadHeatmap teamMembers={teamMembers} />
          )}

          {view === 'Grid View' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {teamMembers.map(member => (
                <div 
                  key={member.id} 
                  onClick={() => isAdmin && onMemberClick(member.id)}
                  className={cn(
                    "lg:col-span-4 bg-surface-container-lowest rounded-2xl p-6 transition-all duration-300 flex flex-col gap-6 border border-outline-variant/5",
                    isAdmin ? "hover:scale-[1.02] hover:shadow-ambient cursor-pointer" : ""
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      <img src={member.avatar} alt={member.name} className="w-16 h-16 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                      <div className={cn(
                        "absolute -bottom-1 -right-1 w-5 h-5 border-4 border-white rounded-full",
                        member.status === 'online' ? "bg-green-500" : "bg-error"
                      )} />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg font-headline">{member.name}</h4>
                      <p className="text-sm text-on-surface-variant">{member.role}</p>
                    </div>
                    {isAdmin && (
                      <div className="ml-auto p-2 bg-primary/10 text-primary rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <Settings className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                      <span className="text-on-surface-variant">{member.load > 100 ? 'Over Capacity' : 'Current Load'}</span>
                      <span className={member.load > 100 ? "text-error" : "text-primary"}>{member.load}%</span>
                    </div>
                    <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(member.load, 100)}%` }}
                        className={cn("h-full rounded-full", member.load > 100 ? "bg-error" : "bg-primary")} 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-surface-container-low p-4 rounded-xl">
                      <span className="text-[10px] block text-on-surface-variant font-bold uppercase mb-1">Active</span>
                      <span className="text-xl font-extrabold">{member.activeTasks}</span>
                    </div>
                    <div className="bg-surface-container-low p-4 rounded-xl">
                      <span className="text-[10px] block text-on-surface-variant font-bold uppercase mb-1">Blocked</span>
                      <span className={cn("text-xl font-extrabold", member.blockedTasks > 0 && "text-error")}>{member.blockedTasks}</span>
                    </div>
                  </div>
                  {member.load > 100 && (
                    <p className="text-xs text-error font-medium flex items-center gap-1">
                      <HelpCircle className="w-3 h-3" />
                      Critical burnout risk detected
                    </p>
                  )}
                </div>
              ))}

              <div className="lg:col-span-4 bg-primary text-on-primary rounded-2xl p-8 relative overflow-hidden flex flex-col justify-between group">
                <div className="relative z-10">
                  <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-widest mb-6">Insight Engine</span>
                  <h3 className="text-2xl font-bold leading-tight mb-4 font-headline">Burnout Protection Active</h3>
                  <p className="text-on-primary/80 text-sm leading-relaxed mb-8">
                    AI is monitoring team capacity to prevent burnout and optimize task distribution across active streams.
                  </p>
                </div>
                <button className="relative z-10 w-full bg-white text-primary py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl hover:bg-on-primary-fixed-variant hover:text-white transition-all">
                  Review Reassignment
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function TaskDetailView({ task, allTasks, onClose, onUpdateTask, teamMembers }: { 
  task: Task, 
  allTasks: Task[],
  onClose: () => void,
  onUpdateTask: (task: Task) => Promise<{ success: boolean; error?: any }>,
  teamMembers: TeamMember[]
}) {
  const [editedTask, setEditedTask] = useState<Task>(task);
  const [errors, setErrors] = useState<{ title?: string; assignees?: string; dueDate?: string }>({});
  const [newSubtaskLabel, setNewSubtaskLabel] = useState('');
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditedTask(task);
    setErrors({});
  }, [task.id]);

  const handleToggleSubtask = (index: number) => {
    if (!editedTask.subtasks) return;
    const newSubtasks = [...editedTask.subtasks];
    newSubtasks[index] = { ...newSubtasks[index], done: !newSubtasks[index].done };
    const updated = { ...editedTask, subtasks: newSubtasks };
    setEditedTask(updated);
    onUpdateTask(updated);
  };

  const handleMarkComplete = () => {
    const newStatus: Status = editedTask.status === 'Completed' ? 'In Progress' : 'Completed';
    const updated = { ...editedTask, status: newStatus };
    setEditedTask(updated);
    onUpdateTask(updated);
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskLabel.trim()) return;
    const newSubtask = { label: newSubtaskLabel.trim(), done: false };
    const updated = { 
      ...editedTask, 
      subtasks: [...(editedTask.subtasks || []), newSubtask] 
    };
    setEditedTask(updated);
    setNewSubtaskLabel('');
    onUpdateTask(updated);
  };

  const toggleAssignee = (memberName: string) => {
    const currentAssignees = editedTask.assignees || [];
    const updatedAssignees = currentAssignees.includes(memberName)
      ? currentAssignees.filter(name => name !== memberName)
      : [...currentAssignees, memberName];
    
    const updated = { ...editedTask, assignees: updatedAssignees };
    setEditedTask(updated);
    onUpdateTask(updated);
  };

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!editedTask.title.trim()) newErrors.title = 'Title is required';
    if (editedTask.assignees.length === 0 || !editedTask.assignees[0].trim()) {
      newErrors.assignees = 'At least one assignee is required';
    }
    if (editedTask.dueDate && editedTask.dueDate.trim() === '') {
      newErrors.dueDate = 'Due date cannot be empty if provided';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (validate()) {
      setIsSaving(true);
      const result = await onUpdateTask(editedTask);
      setIsSaving(false);
      if (result.success) {
        onClose();
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-8 py-6 flex items-center justify-between border-b border-outline-variant/10">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-surface-container flex items-center justify-center transition-colors">
            <X className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-on-surface-variant/60">EV-204 • Project Alpha</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleMarkComplete}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 transition-all",
              editedTask.status === 'Completed' 
                ? "bg-primary text-white" 
                : "bg-secondary-container text-on-secondary-container hover:scale-[0.98]"
            )}
          >
            <Plus className={cn("w-4 h-4 transition-transform", editedTask.status === 'Completed' && "rotate-45")} />
            {editedTask.status === 'Completed' ? 'Completed' : 'Mark Complete'}
          </button>
          <button className="w-10 h-10 rounded-full hover:bg-surface-container flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-12 py-8 no-scrollbar">
        <div className="mb-10">
          <div className="space-y-1">
            <input
              type="text"
              value={editedTask.title}
              onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
              className={cn(
                "w-full text-4xl font-extrabold text-on-surface tracking-tight mb-2 leading-tight font-headline bg-transparent border-none focus:ring-2 focus:ring-primary rounded-xl p-2 -ml-2",
                errors.title && "ring-2 ring-error"
              )}
              placeholder="Task Title"
            />
            {errors.title && <p className="text-error text-xs font-bold">{errors.title}</p>}
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            <select 
              value={editedTask.status}
              onChange={(e) => {
                const updated = { ...editedTask, status: e.target.value as Status };
                setEditedTask(updated);
                onUpdateTask(updated);
              }}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border-none focus:ring-2 focus:ring-primary cursor-pointer transition-colors",
                editedTask.status === 'Completed' || editedTask.status === 'Done' ? "bg-success/10 text-success" :
                editedTask.status === 'In Progress' ? "bg-primary/10 text-primary" :
                editedTask.status === 'On Hold' ? "bg-error/10 text-error" :
                "bg-surface-container-highest text-on-surface-variant"
              )}
            >
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Review">Review</option>
              <option value="On Hold">On Hold</option>
              <option value="Done">Done</option>
              <option value="Completed">Completed</option>
            </select>
            <select 
              value={editedTask.priority || ''}
              onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value as any || undefined })}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border-none focus:ring-2 focus:ring-primary cursor-pointer transition-colors",
                editedTask.priority === 'High' ? "bg-error/10 text-error" :
                editedTask.priority === 'Medium' ? "bg-primary/10 text-primary" :
                editedTask.priority === 'Low' ? "bg-secondary/10 text-secondary" :
                "bg-surface-container-highest text-on-surface-variant"
              )}
            >
              <option value="" disabled>Priority</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <input
              type="text"
              value={editedTask.category || ''}
              onChange={(e) => setEditedTask({ ...editedTask, category: e.target.value })}
              placeholder="Category"
              className="px-3 py-1 bg-surface-container-highest text-on-surface-variant rounded-full text-xs font-semibold border-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-12">
          <div className={cn(
            "bg-surface-container-low p-5 rounded-2xl flex items-center gap-4 transition-all relative",
            errors.assignees && "ring-2 ring-error"
          )}>
            <div className="flex -space-x-2 shrink-0">
              {editedTask.assignees.length > 0 ? (
                editedTask.assignees.slice(0, 3).map((name, i) => {
                  const member = teamMembers.find(m => m.name === name);
                  return (
                    <div key={i} className="w-10 h-10 rounded-full bg-primary-fixed ring-2 ring-white flex items-center justify-center text-white font-bold overflow-hidden">
                      {member ? (
                        <img src={member.avatar} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        name[0]
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant/40">
                  <Users className="w-5 h-5" />
                </div>
              )}
              {editedTask.assignees.length > 3 && (
                <div className="w-10 h-10 rounded-full bg-surface-container-highest ring-2 ring-white flex items-center justify-center text-[10px] font-bold text-on-surface-variant">
                  +{editedTask.assignees.length - 3}
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-tighter">Assignees</p>
              <button 
                onClick={() => setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)}
                className="w-full text-left text-sm font-bold text-on-surface truncate"
              >
                {editedTask.assignees.length > 0 ? editedTask.assignees.join(', ') : 'Add assignees...'}
              </button>
              {errors.assignees && <p className="text-error text-[10px] font-bold mt-1">{errors.assignees}</p>}
              
              <AnimatePresence>
                {isAssigneeDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-surface-bright border border-outline-variant/10 rounded-xl shadow-ambient z-50 max-h-60 overflow-y-auto p-2"
                  >
                    {teamMembers.length > 0 ? (
                      teamMembers.map(member => (
                        <button
                          key={member.id}
                          onClick={() => toggleAssignee(member.name)}
                          className={cn(
                            "w-full flex items-center gap-3 p-2 rounded-lg transition-colors",
                            editedTask.assignees.includes(member.name) ? "bg-primary/10" : "hover:bg-surface-container"
                          )}
                        >
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container">
                            <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <span className="text-sm font-medium text-on-surface">{member.name}</span>
                          {editedTask.assignees.includes(member.name) && (
                            <div className="ml-auto w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                              <Plus className="w-3 h-3 text-white rotate-45" />
                            </div>
                          )}
                        </button>
                      ))
                    ) : (
                      <p className="text-xs text-on-surface-variant/60 p-4 text-center">No team members found.</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className={cn(
            "bg-surface-container-low p-5 rounded-2xl flex items-center gap-4 transition-all",
            errors.dueDate && "ring-2 ring-error"
          )}>
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-primary shadow-sm shrink-0">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-tighter">Due Date</p>
              <input
                type="date"
                value={editedTask.dueDate || ''}
                onChange={(e) => {
                  const updated = { ...editedTask, dueDate: e.target.value };
                  setEditedTask(updated);
                  onUpdateTask(updated);
                }}
                className="w-full text-sm font-bold text-on-surface bg-transparent border-none focus:ring-0 p-0"
              />
            </div>
          </div>
        </div>

        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-5 h-5 text-primary rotate-45" />
            <h3 className="text-lg font-bold text-on-surface font-headline">Description</h3>
          </div>
          <textarea
            value={editedTask.description || ''}
            onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
            className="w-full min-h-[150px] bg-surface-container-low rounded-2xl p-4 text-on-surface-variant leading-relaxed font-sans border-none focus:ring-2 focus:ring-primary resize-none"
            placeholder="Add a detailed description..."
          />
        </section>

        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold text-on-surface font-headline">Dependencies</h3>
            </div>
            <select 
              className="bg-surface-container-high text-on-surface-variant text-xs font-bold py-1.5 px-3 rounded-lg border-none focus:ring-2 focus:ring-primary"
              onChange={(e) => {
                const depId = e.target.value;
                if (!depId) return;
                const currentDeps = editedTask.dependencies || [];
                if (!currentDeps.includes(depId)) {
                  const updated = { ...editedTask, dependencies: [...currentDeps, depId] };
                  setEditedTask(updated);
                  onUpdateTask(updated);
                }
                e.target.value = "";
              }}
            >
              <option value="">Add dependency...</option>
              {allTasks
                .filter(t => t.id !== editedTask.id && !(editedTask.dependencies || []).includes(t.id))
                .map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
            </select>
          </div>
          <div className="space-y-2">
            {(editedTask.dependencies || []).length > 0 ? (
              editedTask.dependencies?.map(depId => {
                const depTask = allTasks.find(t => t.id === depId);
                return (
                  <div key={depId} className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl border border-outline-variant/10">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        (depTask?.status === 'Done' || depTask?.status === 'Completed') ? "bg-primary" : "bg-error"
                      )} />
                      <span className="text-sm font-medium text-on-surface">{depTask?.title || 'Unknown Task'}</span>
                    </div>
                    <button 
                      onClick={() => {
                        const updated = { 
                          ...editedTask, 
                          dependencies: editedTask.dependencies?.filter(id => id !== depId) 
                        };
                        setEditedTask(updated);
                        onUpdateTask(updated);
                      }}
                      className="p-1 hover:bg-surface-container rounded-md text-on-surface-variant/40 hover:text-error transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-on-surface-variant/60 italic px-2">No dependencies defined.</p>
            )}
          </div>
        </section>

        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold text-on-surface font-headline">Subtasks</h3>
            </div>
            <span className="text-xs font-bold text-on-surface-variant">
              {editedTask.subtasks?.filter(s => s.done).length || 0} / {editedTask.subtasks?.length || 0} Completed
            </span>
          </div>
          
          <form onSubmit={handleAddSubtask} className="flex gap-2 mb-4">
            <input 
              type="text"
              value={newSubtaskLabel}
              onChange={(e) => setNewSubtaskLabel(e.target.value)}
              placeholder="Add a new subtask..."
              className="flex-1 bg-surface-container border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary"
            />
            <button 
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dim transition-colors"
            >
              Add
            </button>
          </form>

          <div className="bg-surface-container-high rounded-2xl overflow-hidden">
            {(editedTask.subtasks || []).map((st, i) => (
              <div 
                key={i} 
                className={cn(
                  "p-4 border-b border-white/50 flex items-center gap-4 group transition-colors",
                  st.done ? "bg-white/10" : "hover:bg-white/5"
                )}
              >
                <div 
                  onClick={() => handleToggleSubtask(i)}
                  className="flex items-center gap-4 flex-1 cursor-pointer"
                >
                  <input 
                    type="checkbox" 
                    checked={st.done} 
                    readOnly
                    className="rounded border-outline-variant text-primary focus:ring-primary h-5 w-5" 
                  />
                  <span className={cn("text-sm font-medium text-on-surface", st.done && "line-through opacity-50")}>{st.label}</span>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const newSubtasks = editedTask.subtasks?.filter((_, index) => index !== i);
                    const updated = { ...editedTask, subtasks: newSubtasks };
                    setEditedTask(updated);
                    onUpdateTask(updated);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-error/10 rounded-md text-on-surface-variant/40 hover:text-error transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {(editedTask.subtasks || []).length === 0 && (
              <p className="text-xs text-on-surface-variant/60 p-8 text-center italic">No subtasks yet. Add one above.</p>
            )}
          </div>
        </section>
      </div>

      <div className="p-6 bg-surface-container-lowest flex items-center justify-between gap-4 border-t border-outline-variant/10">
        <div className="flex gap-2">
          <button className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors">
            <Plus className="w-5 h-5" />
          </button>
          <button className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors">
            <Bell className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-on-surface-variant">Last edited just now</span>
          <div className="h-6 w-[2px] bg-surface-container" />
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving && <RefreshCw className="w-4 h-4 animate-spin" />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function LoginView({ onShowToast, setSession, setIsBypassed }: { onShowToast: (msg: string) => void, setSession: (session: any) => void, setIsBypassed: (val: boolean) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isAdminEmail, setIsAdminEmail] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState({
    url: '',
    key: '',
    configured: false,
    status: 'checking' as 'checking' | 'ok' | 'error'
  });

  const [lastError, setLastError] = useState<any>(null);

  const refreshSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      console.log('Manual session refresh:', session?.user?.email);
      setSession(session);
      if (session) {
        onShowToast("Session updated! You should be redirected shortly.");
      } else {
        onShowToast("No active session found.");
      }
    } catch (err: any) {
      console.error('Refresh session error:', err);
      onShowToast(`Refresh failed: ${err.message}`);
    }
  };

  useEffect(() => {
    const emailLower = email.trim().toLowerCase();
    const isAdmin = ADMIN_EMAILS.includes(emailLower);
    setIsAdminEmail(isAdmin);
  }, [email]);

  useEffect(() => {
    const checkStatus = async () => {
      const url = (import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || '').trim();
      const key = (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY || '').trim();
      
      let status: 'ok' | 'error' = 'error';
      if (isSupabaseConfigured) {
        try {
          const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
          if (!error) status = 'ok';
        } catch (e) {
          status = 'error';
        }
      }

      setDebugInfo({
        url: url ? `${url.substring(0, 15)}...` : 'MISSING',
        key: key ? `${key.substring(0, 10)}...` : 'MISSING',
        configured: isSupabaseConfigured,
        status
      });
    };
    
    checkStatus();
  }, []);

  const testConnection = async () => {
    setIsTesting(true);
    try {
      const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
      if (error) throw error;
      onShowToast("Connection successful! Supabase is reachable.");
    } catch (err: any) {
      console.error('Connection test failed:', err);
      onShowToast(`Connection failed: ${err.message}. Check your Secrets.`);
    } finally {
      setIsTesting(false);
    }
  };

  const clearCache = () => {
    localStorage.clear();
    sessionStorage.clear();
    onShowToast("Browser cache cleared. Please refresh the page.");
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      onShowToast("Supabase is not configured. Please check your Secrets.");
      return;
    }
    if (!email.trim()) return;

    if (!password.trim()) return;
    
    setIsLoading(true);
    console.log('Attempting login:', { email: email.trim(), mode: isSignUp ? 'Sign Up' : 'Password' });
    try {
      const { data, error } = isSignUp 
        ? await supabase.auth.signUp({ 
            email: email.trim(), 
            password,
            options: {
              emailRedirectTo: 'https://beachedstreetproperty.netlify.app/'
            }
          })
        : await supabase.auth.signInWithPassword({ email: email.trim(), password });
      
      if (error) {
        console.error('Login error:', error);
        if (error.message.includes("Invalid login credentials")) {
          onShowToast("Invalid credentials. If you don't have an account, click 'Create one' below.");
        } else if (error.message.includes("Email not confirmed")) {
          onShowToast("Please check your inbox and confirm your email before signing in.");
        } else if (error.message === 'Failed to fetch') {
          onShowToast("Connection failed. Please check your Supabase URL and project status.");
        } else {
          onShowToast(`Error: ${error.message}`);
        }
        return;
      }
      
      if (isSignUp) {
        if (data.session) {
          onShowToast("Account created and signed in!");
        } else {
          onShowToast("Account created! Please check your email for a confirmation link.");
          setIsSignUp(false);
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setLastError(err);
      onShowToast(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-surface relative overflow-hidden">
      {/* Premium Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px]" />
      
      <div className="max-w-md w-full bg-surface-bright/80 backdrop-blur-2xl p-12 rounded-[3rem] shadow-ambient border border-white/20 text-center relative z-10">
        <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center text-white shadow-2xl shadow-primary/40 mx-auto mb-10 transform -rotate-6 hover:rotate-0 transition-transform duration-500 overflow-hidden">
          <img 
            src="logo.jpg" 
            alt="Beached Street Logo" 
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                const span = document.createElement('span');
                span.className = 'font-bold text-3xl';
                span.innerText = 'B';
                parent.appendChild(span);
              }
            }}
          />
        </div>
        <h1 className="text-5xl font-extrabold text-on-surface font-headline mb-6 tracking-tighter">Beached Street</h1>
        
        {!isSupabaseConfigured && (
          <div className="mb-8 p-4 bg-error/10 border border-error/20 rounded-2xl flex items-center gap-3 text-left">
            <AlertCircle className="w-5 h-5 text-error shrink-0" />
            <p className="text-xs text-error font-bold leading-tight">
              Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your Secrets.
            </p>
          </div>
        )}

        <p className="text-on-surface-variant/60 mb-10 leading-relaxed font-medium text-lg">
          {isSignUp 
            ? "Create your account to join the workspace." 
            : "Sign in with your work credentials."}
        </p>

        {statusMessage && (
          <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-2xl text-center">
            <p className="text-sm font-bold text-primary animate-pulse">{statusMessage}</p>
          </div>
        )}
        
        {isSignUp && (
          <div className="mb-6 p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-center gap-3 text-left">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
            <p className="text-xs text-on-surface-variant font-medium leading-tight">
              Welcome! You are creating a new account. You will need to confirm your email after signing up.
            </p>
          </div>
        )}

        <div className="mb-6 flex items-center justify-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            debugInfo.status === 'ok' ? "bg-success" : debugInfo.status === 'error' ? "bg-error" : "bg-on-surface-variant/20 animate-pulse"
          )} />
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">
            Supabase: {debugInfo.status === 'ok' ? "Connected" : debugInfo.status === 'error' ? "Connection Error" : "Checking..."}
          </span>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/40" />
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full pl-12 pr-5 py-4 bg-surface-container border-none rounded-2xl focus:ring-2 focus:ring-primary text-sm font-medium"
              required
            />
          </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/40" />
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isAdminEmail && !isSignUp ? "Password (Optional for Admin Bypass)" : "Password"}
                className="w-full pl-12 pr-12 py-4 bg-surface-container border-none rounded-2xl focus:ring-2 focus:ring-primary text-sm font-medium"
                required={!isAdminEmail || isSignUp}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface-variant transition-colors"
              >
                {showPassword ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          
          <div className="flex flex-col gap-3">
            <button 
              disabled={isLoading}
              className="w-full py-5 bg-on-surface text-surface font-bold rounded-2xl flex items-center justify-center gap-4 hover:scale-[0.98] active:scale-95 transition-all shadow-2xl hover:shadow-primary/20 disabled:opacity-50"
            >
              {isLoading 
                ? (isSignUp ? "Creating..." : "Signing in...") 
                : (isSignUp ? "Create Account" : "Sign In")}
            </button>

            {isAdminEmail && !isSignUp && (
              <button 
                type="button"
                onClick={() => {
                  console.log('FORCING ADMIN ACCESS BYPASS');
                  setIsBypassed(true);
                  onShowToast("Bypass activated! Welcome Admin.");
                }}
                className="w-full py-4 bg-primary/10 text-primary font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-primary/20 transition-all border border-primary/20"
              >
                <ShieldCheck className="w-5 h-5" />
                Sign in as Admin (Bypass)
              </button>
            )}
          </div>
        </form>

        <div className="mt-6 flex flex-col gap-3">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full py-4 border border-outline-variant/20 rounded-2xl text-sm font-bold text-on-surface hover:bg-surface-container transition-all"
          >
            {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Create one"}
          </button>

          <button 
            onClick={testConnection}
            disabled={isTesting}
            className="w-full py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 hover:text-primary transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className={cn("w-3 h-3", isTesting && "animate-spin")} />
            {isTesting ? "Testing Connection..." : "Test Supabase Connection"}
          </button>

          <button 
            onClick={() => setShowDebug(!showDebug)}
            className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/20 hover:text-on-surface-variant/60 transition-colors"
          >
            {showDebug ? "Hide Debug Info" : "Show Debug Info"}
          </button>

          {showDebug && (
            <div className="mt-4 p-4 bg-surface-container-high rounded-xl text-left font-mono text-[10px] text-on-surface-variant/60 overflow-hidden">
              <p className="mb-3 font-bold text-primary uppercase tracking-widest">Diagnostic Info</p>
              <p className="mb-1">Supabase URL: {debugInfo.url}</p>
              <p className="mb-1">Anon Key: {debugInfo.key}</p>
              <p className="mb-1">Configured: {debugInfo.configured ? "YES" : "NO"}</p>
              <p className="mb-1">Admin Emails: {ADMIN_EMAILS.join(', ')}</p>
              
              {lastError && (
                <div className="mt-4 p-2 bg-error/10 border border-error/20 rounded-lg">
                  <p className="font-bold text-error uppercase mb-1">Last Error Details</p>
                  <pre className="whitespace-pre-wrap break-all">{JSON.stringify(lastError, null, 2)}</pre>
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t border-outline-variant/10 flex flex-col gap-2">
                <button 
                  onClick={refreshSession}
                  className="w-full py-2 bg-primary/10 text-primary rounded-lg font-bold hover:bg-primary/20 transition-all"
                >
                  Refresh Auth Session
                </button>
                <button 
                  onClick={clearCache}
                  className="w-full py-2 bg-error/10 text-error rounded-lg font-bold hover:bg-error/20 transition-all"
                >
                  Clear Browser Cache
                </button>
                <p className="mt-1 text-[8px] opacity-40 text-center uppercase tracking-widest">Use if stuck after login/logout</p>
              </div>
            </div>
          )}
        </div>
        
        {!isSignUp && (
          <button 
            onClick={() => onShowToast("Password reset is managed via Supabase dashboard.")}
            className="mt-4 text-xs font-bold text-on-surface-variant/40 hover:text-primary transition-colors"
          >
            Forgot your password?
          </button>
        )}
        
        <p className="mt-12 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/40">
          Secure Enterprise Access
        </p>
      </div>
    </div>
  );
}

