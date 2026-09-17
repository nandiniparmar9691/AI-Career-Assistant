import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AlertCircle, X } from 'lucide-react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notice, setNotice] = useState(null)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="print:hidden">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onComingSoon={(label) => setNotice(`${label} is coming soon.`)}
        />
      </div>

      <div className="lg:pl-64 print:pl-0">
        <div className="print:hidden">
          <Navbar onOpenSidebar={() => setSidebarOpen(true)} />
        </div>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          {notice && (
            <div className="mb-6 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {notice}
              </div>
              <button
                type="button"
                onClick={() => setNotice(null)}
                className="rounded p-1 hover:bg-amber-100"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout