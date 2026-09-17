import { NavLink } from 'react-router-dom'
import {
  BarChart3,
  Briefcase,
  ClipboardList,
  FileSearch,
  FileText,
  LayoutDashboard,
  Map,
  MessageCircleQuestion,
  Mic,
  PenTool,
  Scale,
  Sparkles,
  Target,
  UserCircle,
  X,
} from 'lucide-react'

const navigation = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  {
    label: 'Resume Analyzer',
    href: '/resume-analyzer',
    icon: FileSearch,
  },
  { label: 'Job Analyzer', href: '/job-analyzer', icon: Briefcase },
  {
    label: 'Resume-JD Matcher',
    href: '/resume-jd-matcher',
    icon: Scale,
  },
  {
    label: 'Skill Gap Analyzer',
    href: '/skill-gap',
    icon: Target,
  },
  { label: 'Roadmap', href: '/roadmap', icon: Map },
  {
    label: 'AI Interview Questions',
    href: '/interview-questions',
    icon: Mic,
  },
  {
    label: 'Mock Interview',
    href: '/mock-interview',
    icon: MessageCircleQuestion,
  },
  {
    label: 'ATS Resume Builder',
    href: '/resume-builder',
    icon: FileText,
  },
  {
    label: 'Job Application Tracker',
    href: '/applications',
    icon: ClipboardList,
  },
  { label: 'Resume Builder', href: '/resume-builder/editor', icon: PenTool },
  { label: 'Career Analytics', href: '/analytics', icon: BarChart3 },
]

const Sidebar = ({ open, onClose, onComingSoon }) => {
  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-900/50 transition-opacity lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-semibold leading-tight text-slate-900">
              AI Career
              <br />
              Assistant
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navigation.map((item) =>
            item.href ? (
              <NavLink
                key={item.label}
                to={item.href}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            ) : (
              <button
                key={item.label}
                type="button"
                onClick={() => onComingSoon(item.label)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <item.icon className="h-5 w-5" />
                {item.label}
                <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                  Soon
                </span>
              </button>
            )
          )}

          <NavLink
            to="/profile"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <UserCircle className="h-5 w-5" />
            Profile
          </NavLink>
        </nav>
      </aside>
    </>
  )
}

export default Sidebar