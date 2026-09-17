import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import PublicOnlyRoute from './components/PublicOnlyRoute'
import DashboardLayout from './layouts/DashboardLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import ResumeAnalyzer from './pages/ResumeAnalyzer'
import ResumeDetails from './pages/ResumeDetails'
import ResumeJDMatcher from './pages/ResumeJDMatcher'
import MatchDetails from './pages/MatchDetails'
import JobAnalyzer from './pages/JobAnalyzer'
import SkillGapAnalyzer from './pages/SkillGapAnalyzer'
import SkillGapDetails from './pages/SkillGapDetails'
import Roadmap from './pages/Roadmap'
import RoadmapDetail from './pages/RoadmapDetail'
import InterviewQuestions from './pages/InterviewQuestions'
import InterviewQuestionDetails from './pages/InterviewQuestionDetails'
import MockInterview from './pages/MockInterview'
import InterviewEvaluation from './pages/InterviewEvaluation'
import ResumeBuilder from './pages/ResumeBuilder'
import JobApplicationTracker from './pages/JobApplicationTracker'
import ApplicationDetails from './pages/ApplicationDetails'
const CareerAnalytics = lazy(() => import('./pages/CareerAnalytics'))
const ResumeDraftBuilder = lazy(() => import('./pages/ResumeDraftBuilder'))

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/resume-analyzer" element={<ResumeAnalyzer />} />
            <Route path="/resume/:id" element={<ResumeDetails />} />
            <Route path="/resume-jd-matcher" element={<ResumeJDMatcher />} />
            <Route path="/match/:id" element={<MatchDetails />} />
            <Route path="/job-analyzer" element={<JobAnalyzer />} />
            <Route path="/skill-gap" element={<SkillGapAnalyzer />} />
            <Route path="/skill-gap/:id" element={<SkillGapDetails />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/roadmap/:id" element={<RoadmapDetail />} />
            <Route path="/interview-questions" element={<InterviewQuestions />} />
            <Route path="/interview-questions/:id" element={<InterviewQuestionDetails />} />
            <Route path="/mock-interview" element={<MockInterview />} />
            <Route path="/mock-interview/:id" element={<MockInterview />} />
            <Route path="/mock-interview/:id/evaluation" element={<InterviewEvaluation />} />
            <Route path="/resume-builder" element={<ResumeBuilder />} />
            <Route path="/resume-builder/:id" element={<ResumeBuilder />} />
            <Route
              path="/resume-builder/editor"
              element={
                <Suspense
                  fallback={
                    <div className="flex min-h-[50vh] items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                    </div>
                  }
                >
                  <ResumeDraftBuilder />
                </Suspense>
              }
            />
            <Route path="/applications" element={<JobApplicationTracker />} />
            <Route path="/applications/:id" element={<ApplicationDetails />} />
            <Route
              path="/analytics"
              element={
                <Suspense
                  fallback={
                    <div className="flex min-h-[50vh] items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                    </div>
                  }
                >
                  <CareerAnalytics />
                </Suspense>
              }
            />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App