import React, { useState, useEffect, FormEvent } from 'react';
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
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Types
import { Task, TeamMember, Activity, Project, Status, UserProfile } from './types';

// Utils
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ADMIN_EMAILS = ['similietimor@gmail.com', 'liberty.nahak@similie.org'].map(e => e.toLowerCase());
const ADMIN_PASSWORDS: Record<string, string> = {
  'similietimor@gmail.com': 'Admin26Similie',
  'liberty.nahak@similie.org': 'SimilieAdmin9900'
};

// Mock Data
const MOCK_TASKS: Task[] = [
  {
    id: '1',
    title: 'Update Brand Identity Guidelines',
    status: 'In Progress',
    assignees: ['Sarah', 'Alex'],
    dueDate: 'today at 5:00 PM',
    priority: 'High',
    category: 'Design',
    progress: 65,
    description: 'We need to overhaul the visual language for the upcoming Q3 campaign. This includes updating our color palette for digital surfaces and ensuring the new typography hierarchy is reflected across all marketing collateral.',
    subtasks: [
      { label: 'Audit existing color palette', done: true },
      { label: 'Draft new brand guidelines PDF', done: true },
      { label: 'Review typography with leadership', done: false },
      { label: 'Export final asset library', done: false }
    ]
  },
  {
    id: '2',
    title: 'Q3 Financial Projection Review',
    status: 'Blocked',
    assignees: ['David'],
    category: 'Finance',
    description: 'Waiting for legal team to approve the final numbers before we can proceed with the board presentation.'
  },
  {
    id: '3',
    title: 'Refactor navigation Shell for Glassmorphism effects',
    status: 'In Progress',
    assignees: ['Alex'],
    priority: 'High',
    progress: 65,
    dueDate: 'Today'
  },
  {
    id: '4',
    title: 'User interviews for the new workspace flow',
    status: 'Backlog',
    assignees: ['Sarah'],
    dueDate: 'Oct 12',
    category: 'Research'
  }
];

const MOCK_TEAM: TeamMember[] = [
  {
    id: '1',
    name: 'Sarah Jenkins',
    role: 'Project Manager',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD0Nop2-RwO9YPc0rjDpg5Swcm0xEwWw0xmzRQ7F2a0dqnUsmqizd2uZlzjt8Hq0UjvMbpyVMzkV2GMjhrZc5xofchdLUbvF_4Fdb5a_5pRYQMxSOeLiEeKrcKAtQjyr9oxusMXgIgluoG9KjwRXJ8D21nyf00uD9o4WtjE5-jIto7sRmdXEjoAxOrs75jZmQHXhIiEFnzo3rEtxrDuoBGdCtz3QlBYdtfU5NwfQf7dsALNlhoU6Ys5wownNcoLLZv_7qcWiHhFWSE',
    load: 82,
    activeTasks: 14,
    blockedTasks: 0,
    status: 'online'
  },
  {
    id: '2',
    name: 'David Roark',
    role: 'Full-stack Engineer',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCw2FwfiflqMQUlxZoL5v5RDjFP2ci-ydoHu3QjyMPZRL50690j5-sRcLEvzxWMdSmBU1sSWAqd0hBah_myu1xqG-qtWrGXdcZ5b5fs8wWrGIP0QrxIamu1rKOInUDhIflHrUNKDGAIcQqbdxsBbTAzCJLsxjUDA0Q1YLQVJbIEZxAo2cpVk07n-h2CZXKPpxuCljr62a0UtMdx7QRmSo_mUdU9XCYISssb0GnM6CjkO9TPsEwJJVL0OXtJqYpWq_309_KqYtbRm2g',
    load: 104,
    activeTasks: 28,
    blockedTasks: 3,
    status: 'busy'
  }
];

const MOCK_ACTIVITIES: Activity[] = [
  {
    id: '1',
    user: 'Helena Ross',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDzt2W1bDpvLLQhtmsHJ8rnJwrKJCFOfYtAvT1EKFH5gHsJTcUd7xgvEEirOd4YF3tHZJyU-5-ByYGPltzOvE9xkYI7tSOQ1yvDQ6t7mbojzA8iE1wfzWocSoFmqrceRjs_vKyyphT4pnhyXlCyuzTsGiixb9HPlBT-XSw5DI4evkjB74j0u3sUxFevP_R5tUTHLmIPdR8x0p8CLxC-mOL-kB6eR6YIP2zNfuVJ2olbP5j5HIij4VV8hP_mC5i6gNZ8GRrxNG3BM-U',
    action: 'moved',
    target: 'Final QA Review',
    time: '2 hours ago',
    project: 'Project Beached Street',
    comment: 'Looks great everyone! Performance metrics are exceeding targets.',
    type: 'move'
  }
];

const MOCK_PROJECTS: Project[] = [
  { id: '1', name: 'Design System Expansion', members: 4, activeTasks: 12, progress: 75, status: 'Healthy', category: 'Design' },
  { id: '2', name: 'API Refactor Phase 2', members: 2, activeTasks: 8, progress: 42, status: 'At Risk', category: 'Dev' },
  { id: '3', name: 'Marketing Launch Q4', members: 6, activeTasks: 24, progress: 92, status: 'Healthy', category: 'Marketing' }
];

type View = 'dashboard' | 'projects' | 'calendar' | 'team' | 'settings' | 'profile' | 'invites';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProjectData, setNewProjectData] = useState({ name: '', category: 'Design' });
  const [toast, setToast] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [isInvited, setIsInvited] = useState<boolean | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const [isBypassed, setIsBypassed] = useState(false);

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
    if (!session?.user) {
      setIsInvited(null);
      return;
    }

    const checkInvitation = async () => {
      const email = session.user.email?.toLowerCase();
      if (!email) return;

      // Explicit Admin Bypass: Always allow admins even if DB check fails
      if (ADMIN_EMAILS.includes(email)) {
        console.log(`Admin detected (${email}), bypassing invitation check`);
        setIsInvited(true);
        return;
      }

      console.log(`Checking invitation for: ${email}`);

      try {
        const { data, error } = await supabase
          .from('invitations')
          .select('*')
          .eq('email', email)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setIsInvited(true);
        } else {
          setIsInvited(false);
        }
      } catch (err: any) {
        console.error('Invitation check error:', err);
        if (err.message === 'Failed to fetch') {
          setConnectionError("Unable to connect to Supabase to verify your access. Please check your internet connection or project status.");
        } else {
          setConnectionError(err.message);
        }
        // Fallback to false if we can't verify, but maybe we should allow retry
        setIsInvited(false); 
      }
    };

    checkInvitation();
  }, [session]);

  useEffect(() => {
    if (!session?.user || isInvited === false || !isSupabaseConfigured) return;

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

        const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('email', session.user.email).maybeSingle();
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
  }, [session, isInvited]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // Clear URL hash to prevent re-login from stale tokens in URL
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      setSession(null);
      setIsInvited(null);
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

  if (isInvited === false && !isBypassed) {
    return <UnauthorizedView userEmail={session?.user?.email} onLogout={handleLogout} connectionError={connectionError} />;
  }

  if (isInvited === null && !isBypassed) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-6 max-w-sm text-center px-6">
          {connectionError ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-error/10 flex items-center justify-center text-error mb-2">
                <WifiOff className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold font-headline">Connection Error</h2>
              <p className="text-on-surface-variant/60 text-sm leading-relaxed">
                {connectionError}
              </p>
              <div className="flex flex-col w-full gap-3">
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full py-3 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full py-3 bg-surface-container text-on-surface-variant font-bold rounded-xl"
                >
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-on-surface-variant font-bold uppercase tracking-widest text-xs">Verifying Access...</p>
              <button 
                onClick={handleLogout}
                className="mt-8 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/20 hover:text-on-surface-variant/60 transition-colors"
              >
                Cancel & Sign Out
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Sidebar */}
      <aside className={cn(
        "hidden md:flex flex-col h-full bg-surface-container-low py-10 transition-all duration-300 border-r border-outline-variant/10",
        isSidebarOpen ? "w-72" : "w-20"
      )}>
        <div className="px-8 mb-12 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 shrink-0 overflow-hidden">
            <img 
              src="/logo.jpg" 
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
          
          {isAdmin && (
            <button
              onClick={() => setCurrentView('invites')}
              className={cn(
                "w-full flex items-center gap-3 py-3 px-8 transition-all duration-200 group relative",
                currentView === 'invites' 
                  ? "text-on-surface font-semibold bg-surface-container-lowest" 
                  : "text-on-surface-variant/60 font-medium hover:bg-surface-container-high"
              )}
            >
              {currentView === 'invites' && (
                <motion.div 
                  layoutId="active-nav"
                  className="absolute left-0 top-0 bottom-0 w-1 bg-primary"
                />
              )}
              <UserPlus className={cn("w-5 h-5 shrink-0", currentView === 'invites' ? "text-primary" : "text-on-surface-variant/60 group-hover:text-primary")} />
              {isSidebarOpen && <span className="font-headline">Invites</span>}
            </button>
          )}
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
                    {MOCK_ACTIVITIES.map(activity => (
                      <div key={activity.id} className="p-3 rounded-xl hover:bg-surface-container transition-colors cursor-pointer flex gap-3">
                        <img src={activity.avatar} className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                        <div>
                          <p className="text-xs text-on-surface leading-tight">
                            <span className="font-bold">{activity.user}</span> {activity.action} <span className="font-semibold text-primary">{activity.target}</span>
                          </p>
                          <span className="text-[10px] text-on-surface-variant/60">{activity.time}</span>
                        </div>
                      </div>
                    ))}
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
              onClick={() => setCurrentView('profile')}
              className={cn(
                "h-10 w-10 rounded-full overflow-hidden border-2 shadow-sm ml-2 ring-2 cursor-pointer transition-all",
                currentView === 'profile' ? "border-primary ring-primary" : "border-white ring-primary/10 hover:ring-primary"
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
                  onAddTask={async (status) => {
                    const newTask: Task = {
                      id: Math.random().toString(36).substr(2, 9),
                      title: 'New Task',
                      status: status || 'Backlog',
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
              {currentView === 'calendar' && <CalendarView />}
              {currentView === 'team' && <TeamView />}
              {currentView === 'settings' && <div className="text-center py-20 text-on-surface-variant">Settings view coming soon...</div>}
              {currentView === 'profile' && userProfile && (
                <ProfileView 
                  profile={userProfile} 
                  onUpdateProfile={async (updatedProfile) => {
                    setUserProfile(updatedProfile);
                    try {
                      const { error } = await supabase.from('profiles').upsert(updatedProfile);
                      if (error) {
                        console.error('Supabase profile update error:', error);
                        showToast(`Profile sync failed: ${error.message}`);
                      } else {
                        showToast("Profile updated successfully");
                      }
                    } catch (err: any) {
                      console.error('Supabase profile update error:', err);
                      showToast(`Profile sync failed: ${err.message || 'Unknown error'}`);
                    }
                  }}
                />
              )}
              {currentView === 'invites' && isAdmin && (
                <InvitesView onShowToast={showToast} />
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
                onUpdateTask={async (updatedTask) => {
                  const newTasks = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
                  setTasks(newTasks);
                  setSelectedTask(updatedTask);
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

function ProfileView({ profile, onUpdateProfile }: { 
  profile: UserProfile, 
  onUpdateProfile: (profile: UserProfile) => void 
}) {
  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    onUpdateProfile(editedProfile);
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Avatar Section */}
        <div className="w-full md:w-1/3 flex flex-col items-center gap-6 bg-surface-container-lowest p-8 rounded-3xl shadow-ambient">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-primary/20 shadow-xl">
              <img 
                src={editedProfile.avatar} 
                alt={editedProfile.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            {isEditing && (
              <button className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:scale-110 transition-transform">
                <Camera className="w-5 h-5" />
              </button>
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
                  <span className="text-[9px] text-primary/60 lowercase font-medium italic">Only Project Managers can create projects</span>
                </label>
                <input 
                  disabled={!isEditing}
                  value={editedProfile.role}
                  onChange={(e) => setEditedProfile({ ...editedProfile, role: e.target.value })}
                  className="w-full bg-surface-container border-none rounded-xl p-3 focus:ring-2 focus:ring-primary disabled:opacity-60"
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
                    preferences: { ...editedProfile.preferences, notifications: !editedProfile.preferences.notifications }
                  })}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    editedProfile.preferences.notifications ? "bg-primary" : "bg-surface-container-highest"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                    editedProfile.preferences.notifications ? "left-7" : "left-1"
                  )} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-surface-container rounded-2xl">
                <div className="flex items-center gap-3">
                  {editedProfile.preferences.darkMode ? <Moon className="w-5 h-5 text-on-surface-variant" /> : <Sun className="w-5 h-5 text-on-surface-variant" />}
                  <div>
                    <p className="font-bold text-sm">Dark Mode</p>
                    <p className="text-xs text-on-surface-variant">Switch to high-contrast dark theme</p>
                  </div>
                </div>
                <button 
                  disabled={!isEditing}
                  onClick={() => setEditedProfile({
                    ...editedProfile,
                    preferences: { ...editedProfile.preferences, darkMode: !editedProfile.preferences.darkMode }
                  })}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    editedProfile.preferences.darkMode ? "bg-primary" : "bg-surface-container-highest"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                    editedProfile.preferences.darkMode ? "left-7" : "left-1"
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
                  value={editedProfile.preferences.language}
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

          <div className="flex justify-end gap-4">
            <button className="flex items-center gap-2 px-6 py-3 text-error font-bold hover:bg-error/10 rounded-xl transition-colors">
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Sub-Views ---

function DashboardView({ tasks, projects, onTaskClick, onProjectClick, onViewAllTasks }: { 
  tasks: Task[], 
  projects: Project[], 
  onTaskClick: (task: Task) => void,
  onProjectClick: (projectId: string) => void,
  onViewAllTasks: () => void
}) {
  return (
    <div className="space-y-12">
      <section>
        <h2 className="text-4xl font-headline font-extrabold text-on-surface tracking-tight mb-2">Welcome back, Sarah.</h2>
        <p className="text-on-surface-variant font-sans text-lg">You have {tasks.filter(t => t.dueDate === 'Today' || t.dueDate?.includes('today')).length} critical tasks finishing today.</p>
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
            {MOCK_ACTIVITIES.map(activity => (
              <div key={activity.id} className="flex gap-4">
                <div className="h-10 w-10 rounded-full overflow-hidden shrink-0 ring-2 ring-white">
                  <img src={activity.avatar} alt={activity.user} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1 pb-6 border-b border-surface-container-high last:border-0">
                  <p className="text-on-surface leading-snug">
                    <span className="font-bold">{activity.user}</span> {activity.action} <span className="font-semibold text-primary">{activity.target}</span> to <span className="text-secondary font-bold">Done</span>
                  </p>
                  <span className="text-xs text-on-surface-variant font-medium">{activity.time} • {activity.project}</span>
                  {activity.comment && (
                    <div className="mt-3 p-4 bg-surface-container-lowest rounded-xl text-sm italic text-on-surface-variant border border-outline-variant/10">
                      "{activity.comment}"
                    </div>
                  )}
                </div>
              </div>
            ))}
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
                <p className="text-xs text-on-surface-variant mt-1">{project.members} core members • {project.activeTasks} active tasks</p>
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

function ProjectsView({ tasks, activeProject, onTaskClick, onAddTask, onShowToast }: { 
  tasks: Task[], 
  activeProject: Project | null,
  onTaskClick: (task: Task) => void,
  onAddTask: (status?: Status) => void,
  onShowToast: (msg: string) => void
}) {
  const [activeTab, setActiveTab] = useState('Board');
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 3)); // April 2026
  const columns: Status[] = ['Backlog', 'In Progress', 'Review', 'Done'];
  
  const tabs = ['Overview', 'List', 'Board', 'Timeline', 'Dashboard', 'Calendar'];

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)));
  const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)));
  const handleToday = () => setCurrentMonth(new Date(2026, 3));

  return (
    <div className="space-y-6">
      {/* Project Header & Sub-nav */}
      <div className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
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
            {MOCK_TEAM.map(m => (
              <img key={m.id} src={m.avatar} alt={m.name} className="w-10 h-10 rounded-full ring-4 ring-surface object-cover" referrerPolicy="no-referrer" />
            ))}
            <div className="w-10 h-10 rounded-full bg-surface-container-highest ring-4 ring-surface flex items-center justify-center text-xs font-bold text-on-surface-variant">+4</div>
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
          {activeTab === 'Board' ? (
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
                  
                  <div className="space-y-4">
                    {tasks.filter(t => t.status === status).map(task => (
                      <motion.div 
                        layoutId={task.id}
                        key={task.id}
                        onClick={() => onTaskClick(task)}
                        className="group bg-surface-container-lowest p-6 rounded-2xl shadow-sm hover:scale-[1.01] hover:shadow-xl hover:shadow-on-surface/5 transition-all duration-200 cursor-pointer border border-outline-variant/5"
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
                      </motion.div>
                    ))}
                    <button 
                      onClick={() => onAddTask(status)}
                      className="w-full py-4 border-2 border-dashed border-outline-variant/30 rounded-2xl text-on-surface-variant/40 font-bold text-sm hover:border-primary/40 hover:text-primary transition-all duration-200"
                    >
                      + Add Task
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : activeTab === 'Calendar' ? (
            <CalendarView />
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

function CalendarView() {
  const [view, setView] = useState('Month');
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h2 className="text-4xl font-extrabold tracking-tighter text-on-surface font-headline">October 2023</h2>
            <div className="flex gap-1">
              <button className="p-2 hover:bg-surface-container rounded-lg transition-colors">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
              <button className="p-2 hover:bg-surface-container rounded-lg transition-colors">
                <Plus className="w-5 h-5 -rotate-45" />
              </button>
            </div>
          </div>
          <p className="text-on-surface-variant font-medium">12 tasks due this month • 3 overdue</p>
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
          {[...Array(35)].map((_, i) => {
            const day = i - 6;
            const isCurrentMonth = day > 0 && day <= 31;
            return (
              <div key={i} className={cn(
                "min-h-[140px] p-4 font-medium transition-colors hover:bg-surface-container/20",
                !isCurrentMonth && "bg-surface-container/20 text-on-surface-variant/40",
                day === 11 && "bg-primary/5 ring-2 ring-primary/20 ring-inset"
              )}>
                <span className={cn(
                  "inline-flex w-8 h-8 items-center justify-center rounded-full text-sm font-bold",
                  day === 11 ? "bg-primary text-white" : "text-on-surface"
                )}>
                  {isCurrentMonth ? day : day <= 0 ? 30 + day : day - 31}
                </span>
                {day === 4 && (
                  <div className="mt-2 bg-primary text-on-primary text-[10px] font-bold py-1.5 px-2 rounded-lg shadow-lg">
                    Brand Guidelines Overhaul
                  </div>
                )}
                {day === 11 && (
                  <div className="mt-2 space-y-1">
                    <div className="bg-tertiary-container text-on-tertiary-container text-[10px] font-bold py-1.5 px-2 rounded-lg border-l-4 border-tertiary truncate">
                      Design Critique
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TeamView() {
  const [view, setView] = useState('Grid View');

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-extrabold text-on-surface tracking-tight font-headline">Team Workload</h2>
          <p className="text-on-surface-variant text-lg">Visualizing capacity across the next 7-day sprint cycle.</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12 bg-surface-container-low rounded-2xl p-8 overflow-hidden relative">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 font-headline">
              <Layers className="w-5 h-5 text-primary" />
              Weekly Capacity Pulse
            </h3>
            <div className="grid grid-cols-7 gap-4">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                <div key={day} className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">{day}</span>
                  <div className="h-24 bg-primary/10 rounded-xl relative group overflow-hidden">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: i === 2 ? '100%' : `${Math.random() * 60 + 30}%` }}
                      className={cn(
                        "absolute bottom-0 left-0 w-full rounded-xl transition-all",
                        i === 2 ? "bg-error" : "bg-primary/60"
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {MOCK_TEAM.map(member => (
          <div key={member.id} className="lg:col-span-4 bg-surface-container-lowest rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-ambient flex flex-col gap-6 border border-outline-variant/5">
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
              AI has detected three tasks that can be reassigned from <strong>David Roark</strong> to <strong>Mia Kovac</strong> to rebalance capacity.
            </p>
          </div>
          <button className="relative z-10 w-full bg-white text-primary py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl hover:bg-on-primary-fixed-variant hover:text-white transition-all">
            Review Reassignment
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskDetailView({ task, allTasks, onClose, onUpdateTask }: { 
  task: Task, 
  allTasks: Task[],
  onClose: () => void,
  onUpdateTask: (task: Task) => void
}) {
  const [editedTask, setEditedTask] = useState<Task>(task);
  const [errors, setErrors] = useState<{ title?: string; assignees?: string; dueDate?: string }>({});

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
    const newStatus: Status = editedTask.status === 'Done' ? 'In Progress' : 'Done';
    const updated = { ...editedTask, status: newStatus };
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

  const handleSave = () => {
    if (validate()) {
      onUpdateTask(editedTask);
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
              editedTask.status === 'Done' 
                ? "bg-primary text-white" 
                : "bg-secondary-container text-on-secondary-container hover:scale-[0.98]"
            )}
          >
            <Plus className={cn("w-4 h-4 transition-transform", editedTask.status === 'Done' && "rotate-45")} />
            {editedTask.status === 'Done' ? 'Completed' : 'Mark Complete'}
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
            "bg-surface-container-low p-5 rounded-2xl flex items-center gap-4 transition-all",
            errors.assignees && "ring-2 ring-error"
          )}>
            <div className="w-12 h-12 rounded-full bg-primary-fixed ring-2 ring-white flex items-center justify-center text-white font-bold shrink-0">
              {editedTask.assignees[0]?.[0] || '?'}
            </div>
            <div className="flex-1">
              <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-tighter">Assignee</p>
              <input
                type="text"
                value={editedTask.assignees.join(', ')}
                onChange={(e) => setEditedTask({ ...editedTask, assignees: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                className="w-full text-sm font-bold text-on-surface bg-transparent border-none focus:ring-0 p-0"
                placeholder="Add assignees..."
              />
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
                type="text"
                value={editedTask.dueDate || ''}
                onChange={(e) => setEditedTask({ ...editedTask, dueDate: e.target.value })}
                className="w-full text-sm font-bold text-on-surface bg-transparent border-none focus:ring-0 p-0"
                placeholder="Set due date..."
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
                        depTask?.status === 'Done' ? "bg-primary" : "bg-error"
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
          <div className="bg-surface-container-high rounded-2xl overflow-hidden">
            {(editedTask.subtasks || [
              { label: 'Initial research', done: false },
              { label: 'Drafting proposal', done: false }
            ]).map((st, i) => (
              <div 
                key={i} 
                onClick={() => handleToggleSubtask(i)}
                className={cn(
                  "p-4 border-b border-white/50 flex items-center gap-4 cursor-pointer hover:bg-white/10 transition-colors",
                  st.done ? "bg-white/20" : ""
                )}
              >
                <input 
                  type="checkbox" 
                  checked={st.done} 
                  onChange={() => {}} // Handled by parent div click
                  className="rounded border-outline-variant text-primary focus:ring-primary h-5 w-5 pointer-events-none" 
                />
                <span className={cn("text-sm font-medium text-on-surface", st.done && "line-through opacity-50")}>{st.label}</span>
              </div>
            ))}
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
            className="px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            Save Changes
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
          const { error } = await supabase.from('invitations').select('count', { count: 'exact', head: true });
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
      const { error } = await supabase.from('invitations').select('count', { count: 'exact', head: true });
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

  const handleGodModeLogin = async () => {
    setIsLoading(true);
    const emailLower = email.trim().toLowerCase();
    const password = ADMIN_PASSWORDS[emailLower];
    
    if (!password) {
      onShowToast("Error: No password found for this admin email.");
      setIsLoading(false);
      return;
    }

    try {
      console.log('Attempting GOD mode login for:', emailLower);
      setStatusMessage("Authenticating admin...");
      // Try Sign In first
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: emailLower,
        password: password
      });
      
      if (signInError) {
        console.log('GOD mode sign-in error:', signInError.message);
        if (signInError.message.includes("Invalid login credentials") || signInError.message.includes("Email not confirmed")) {
          if (signInError.message.includes("Email not confirmed")) {
            setStatusMessage("Email not confirmed. Check your inbox!");
            onShowToast("Admin account exists but email is not confirmed. Please check your inbox!");
            setIsLoading(false);
            return;
          }

          console.log('User not found or invalid credentials, attempting auto-onboarding');
          setStatusMessage("Account not found. Initializing admin...");
          // Auto-onboard if not found
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: emailLower,
            password: password
          });
          
          if (signUpError) {
            if (signUpError.message.includes("already registered")) {
              setStatusMessage("Password mismatch. Reset in Supabase.");
              onShowToast("Admin account already exists but password doesn't match. Please check your email or reset password in Supabase.");
            } else {
              throw signUpError;
            }
          } else if (signUpData.session) {
            setStatusMessage("GOD Mode Activated!");
            onShowToast("GOD mode activated! Account created and signed in.");
          } else if (signUpData.user) {
            setStatusMessage("Confirmation Required. Check Email!");
            onShowToast("Admin account initialized! CRITICAL: You MUST check your email and click the confirmation link before you can log in.");
          }
        } else {
          throw signInError;
        }
      } else if (data.session) {
        setStatusMessage("GOD Mode Activated!");
        onShowToast("GOD mode activated! Welcome back.");
      }
    } catch (err: any) {
      console.error('GOD mode error:', err);
      setLastError(err);
      setStatusMessage(`Error: ${err.message}`);
      onShowToast(`GOD mode failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      onShowToast("Supabase is not configured. Please check your Secrets.");
      return;
    }
    if (!email.trim()) return;

    // If it's an admin email, we use the GOD mode logic automatically
    if (isAdminEmail && !isSignUp) {
      handleGodModeLogin();
      return;
    }

    if (!password.trim()) return;
    
    setIsLoading(true);
    console.log('Attempting login:', { email: email.trim(), mode: isSignUp ? 'Sign Up' : 'Password' });
    try {
      const { data, error } = isSignUp 
        ? await supabase.auth.signUp({ email: email.trim(), password })
        : await supabase.auth.signInWithPassword({ email: email.trim(), password });
      
      if (error) {
        console.error('Login error:', error);
        if (error.message.includes("Invalid login credentials")) {
          if (isAdminEmail && !isSignUp) {
            onShowToast("Account not found. If this is your first time, please click 'Create one' below to setup your admin account.");
          } else {
            onShowToast("Invalid credentials. If you don't have an account, click 'Create one' below.");
          }
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
            src="/logo.jpg" 
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
              Note: You are creating an admin account. You will need to confirm your email after signing up.
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
                placeholder={isAdminEmail && !isSignUp ? "Password (Auto-filled for Admin)" : "Password"}
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
          <button 
            disabled={isLoading}
            className="w-full py-5 bg-on-surface text-surface font-bold rounded-2xl flex items-center justify-center gap-4 hover:scale-[0.98] active:scale-95 transition-all shadow-2xl hover:shadow-primary/20 disabled:opacity-50"
          >
            {isLoading 
              ? (isSignUp ? "Creating..." : "Signing in...") 
              : (isSignUp ? "Create Account" : "Sign In")}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-3">
          {isAdminEmail && !isSignUp && (
            <div className="space-y-3">
              <button 
                onClick={handleGodModeLogin}
                disabled={isLoading}
                className="w-full py-4 bg-primary text-white border-none rounded-2xl text-sm font-bold hover:scale-[0.98] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                <ShieldCheck className="w-4 h-4" />
                Activate GOD Mode
              </button>
              
              <button 
                onClick={() => {
                  console.log('EMERGENCY BYPASS ACTIVATED');
                  setIsBypassed(true);
                  onShowToast("Emergency Bypass Activated! Welcome.");
                }}
                className="w-full py-3 bg-warning/10 text-warning border border-warning/20 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-warning/20 transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-3 h-3" />
                Emergency Bypass (If Login Fails)
              </button>
            </div>
          )}
          
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
                {isAdminEmail && (
                  <button 
                    onClick={() => {
                      console.log('FORCING ADMIN ACCESS BYPASS');
                      setIsBypassed(true);
                      onShowToast("Bypass activated! Welcome Admin.");
                    }}
                    className="w-full py-2 bg-warning/10 text-warning rounded-lg font-bold hover:bg-warning/20 transition-all"
                  >
                    Force Admin Access (Bypass)
                  </button>
                )}
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

function UnauthorizedView({ userEmail, onLogout, connectionError }: { userEmail: string | undefined, onLogout: () => void, connectionError?: string | null }) {
  return (
    <div className="flex h-screen items-center justify-center bg-surface p-6">
      <div className="max-w-md w-full bg-surface-bright p-12 rounded-[2.5rem] shadow-ambient border border-outline-variant/10 text-center">
        {connectionError ? (
          <>
            <div className="w-16 h-16 rounded-2xl bg-error/10 flex items-center justify-center text-error mx-auto mb-8">
              <WifiOff className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-extrabold text-on-surface font-headline mb-4 tracking-tight">Connection Error</h1>
            <p className="text-on-surface-variant/60 mb-10 leading-relaxed font-medium">
              {connectionError}
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl bg-error/10 flex items-center justify-center text-error mx-auto mb-8">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-extrabold text-on-surface font-headline mb-4 tracking-tight">Access Restricted</h1>
            <p className="text-on-surface-variant/60 mb-4 leading-relaxed font-medium">
              The email <span className="text-on-surface font-bold">{userEmail || 'Unknown'}</span> has not been invited to join this workspace.
            </p>
            <p className="text-xs text-on-surface-variant/40 mb-10">
              Please contact an administrator to request access.
            </p>
          </>
        )}
        <div className="space-y-3">
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-primary text-white font-bold rounded-2xl flex items-center justify-center gap-3 hover:scale-[0.98] transition-all shadow-lg shadow-primary/20"
          >
            <RefreshCw className="w-5 h-5" />
            {connectionError ? "Retry Connection" : "Check Again"}
          </button>
          <button 
            onClick={onLogout}
            className="w-full py-4 bg-surface-container text-on-surface-variant font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-surface-container-high transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

function InvitesView({ onShowToast }: { onShowToast: (msg: string) => void }) {
  const [email, setEmail] = useState('');
  const [invites, setInvites] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadInvites();
  }, []);

  const loadInvites = async () => {
    try {
      const { data, error } = await supabase.from('invitations').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setInvites(data);
    } catch (err: any) {
      console.error('Load invites error:', err);
      onShowToast(`Failed to load invites: ${err.message}`);
    }
  };

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault();
    const inviteEmail = email.trim();
    if (!inviteEmail) return;
    setIsSubmitting(true);
    try {
      // 1. Record in database
      const { error: dbError } = await supabase.from('invitations').insert({ email: inviteEmail });
      if (dbError) {
        if (dbError.code === '23505') onShowToast("User already invited");
        else throw dbError;
        setIsSubmitting(false);
        return;
      }

      // 2. Send real email via backend
      try {
        const response = await fetch('/api/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: inviteEmail,
            inviteUrl: window.location.origin
          }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to send email');
        
        if (result.warning) {
          onShowToast(result.message);
        } else {
          onShowToast(result.message || "Invitation sent successfully!");
        }
      } catch (emailErr: any) {
        console.error('Email sending failed:', emailErr);
        onShowToast("User added to workspace, but email notification failed. Please share the URL manually.");
      }

      setEmail('');
      loadInvites();
    } catch (err: any) {
      onShowToast(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeInvite = async (id: string) => {
    const { error } = await supabase.from('invitations').delete().eq('id', id);
    if (!error) {
      onShowToast("Invitation removed");
      loadInvites();
    }
  };

  return (
    <div className="space-y-12">
      <header className="mb-12">
        <h2 className="text-5xl font-extrabold text-on-surface tracking-tighter font-headline mb-4">Workspace Invites</h2>
        <p className="text-on-surface-variant/60 text-lg max-w-2xl font-medium">
          Manage access to your premium workspace. Only invited users can sign in.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-1">
          <div className="bg-surface-bright p-8 rounded-[2rem] shadow-ambient border border-outline-variant/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <UserPlus className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold font-headline">Invite New User</h3>
            </div>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 mb-2 ml-1">Email Address</label>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="w-full px-5 py-4 bg-surface-container border-none rounded-2xl focus:ring-2 focus:ring-primary text-sm font-medium"
                  required
                />
              </div>
              <button 
                disabled={isSubmitting}
                className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Inviting..." : "Send Invitation"}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-surface-bright rounded-[2rem] shadow-ambient border border-outline-variant/10 overflow-hidden">
            <div className="p-8 border-b border-outline-variant/10 flex justify-between items-center">
              <h3 className="text-xl font-bold font-headline">Invited Users</h3>
              <span className="px-3 py-1 bg-surface-container rounded-full text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                {invites.length} Total
              </span>
            </div>
            <div className="divide-y divide-outline-variant/10">
              {invites.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-on-surface-variant/40 font-medium italic">No invitations sent yet.</p>
                </div>
              ) : (
                invites.map((invite) => (
                  <div key={invite.id} className="p-6 flex items-center justify-between hover:bg-surface-container/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-on-surface">{invite.email}</p>
                        <p className="text-[10px] text-on-surface-variant/60 uppercase tracking-widest font-bold">
                          Invited on {new Date(invite.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeInvite(invite.id)}
                      className="p-2 text-on-surface-variant/40 hover:text-error hover:bg-error/10 rounded-xl transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
