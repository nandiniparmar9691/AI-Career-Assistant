import { Loader2 } from 'lucide-react'

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
}

const LoadingSpinner = ({ size = 'md', label = 'Loading...', fullscreen = false }) => {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={`${sizeClasses[size] || sizeClasses.md} animate-spin text-indigo-600`} />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  )

  if (fullscreen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        {spinner}
      </div>
    )
  }

  return spinner
}

export default LoadingSpinner