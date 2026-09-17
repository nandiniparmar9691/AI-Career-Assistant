import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Eye,
  FileText,
  Inbox,
  Loader2,
  Trash2,
  UploadCloud,
} from 'lucide-react'
import {
  deleteResume,
  getErrorMessage,
  getResumes,
  uploadResume,
} from '../services/api'

const MAX_FILE_SIZE_MB = 5

const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`
}

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

const isValidPdf = (file) =>
  file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')

const ResumeAnalyzer = () => {
  const [resumes, setResumes] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const inputRef = useRef(null)

  const fetchResumes = useCallback(async () => {
    try {
      const { data } = await getResumes()
      setResumes(data.resumes || [])
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => {
    let active = true
    getResumes()
      .then(({ data }) => {
        if (active) setResumes(data.resumes || [])
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err))
      })
      .finally(() => {
        if (active) setLoaded(true)
      })
    return () => {
      active = false
    }
  }, [])

  const validateAndSelect = (file) => {
    setError(null)
    setSuccess(null)
    if (!file) return
    if (!isValidPdf(file)) {
      setError('Only PDF files are allowed. Please choose a .pdf file.')
      return
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File too large. Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`)
      return
    }
    setSelectedFile(file)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setDragging(false)
    validateAndSelect(event.dataTransfer.files?.[0])
  }

  const handleUpload = async () => {
    if (!selectedFile || uploading) return
    setUploading(true)
    setError(null)
    setSuccess(null)
    try {
      const formData = new FormData()
      formData.append('resume', selectedFile)
      const { data } = await uploadResume(formData)
      setSuccess(data.message || 'Resume uploaded successfully')
      setSelectedFile(null)
      if (inputRef.current) inputRef.current.value = ''
      await fetchResumes()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (resume) => {
    if (
      !window.confirm(
        `Delete "${resume.fileName}"? This permanently removes the uploaded resume.`
      )
    ) {
      return
    }
    setDeletingId(resume.id)
    setError(null)
    setSuccess(null)
    try {
      const { data } = await deleteResume(resume.id)
      setSuccess(data.message || 'Resume deleted successfully')
      setResumes((prev) => prev.filter((item) => item.id !== resume.id))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Resume Analyzer
        </h1>
        <p className="mt-1.5 text-sm text-slate-500 sm:text-base">
          Upload your resume PDF. We extract the text so AI features can analyze
          it later.
        </p>
      </div>

      {(error || success) && (
        <div
          className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
            error
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          <span>{error || success}</span>
          <button
            type="button"
            onClick={() => {
              setError(null)
              setSuccess(null)
            }}
            className="font-medium hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      <section
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition ${
          dragging
            ? 'border-indigo-400 bg-indigo-50'
            : 'border-slate-300 bg-white hover:border-indigo-300 hover:bg-slate-50'
        }`}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100">
          <UploadCloud className="h-7 w-7 text-indigo-600" />
        </div>
        <p className="mt-4 font-semibold text-slate-900">
          {selectedFile ? selectedFile.name : 'Drag & drop your resume here'}
        </p>
        <p className="mt-1 max-w-md text-sm text-slate-500">
          or click to browse. PDF only, up to {MAX_FILE_SIZE_MB} MB.
        </p>
        {selectedFile && (
          <p className="mt-1 text-sm font-medium text-indigo-600">
            {formatBytes(selectedFile.size)}
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => validateAndSelect(e.target.files?.[0])}
        />
        <button
          type="button"
          disabled={!selectedFile || uploading}
          onClick={(e) => {
            e.stopPropagation()
            handleUpload()
          }}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
            </>
          ) : (
            <>
              <UploadCloud className="h-4 w-4" /> Upload Resume
            </>
          )}
        </button>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">My Resumes</h2>
          {loaded && resumes.length > 0 && (
            <span className="text-sm text-slate-500">
              {resumes.length} {resumes.length === 1 ? 'resume' : 'resumes'}
            </span>
          )}
        </div>

        {loadingList()}
      </section>
    </div>
  )

  function loadingList() {
    if (!loaded) {
      return (
        <div className="mt-4 flex items-center justify-center rounded-xl border border-slate-200 bg-white py-12 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )
    }

    if (resumes.length === 0) {
      return (
        <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <Inbox className="h-8 w-8 text-slate-400" />
          <p className="mt-3 text-sm text-slate-600">
            No resumes yet. Upload your first PDF above.
          </p>
        </div>
      )
    }

    return (
      <ul className="mt-4 space-y-3">
        {resumes.map((resume) => (
          <li
            key={resume.id}
            className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {resume.fileName}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {formatDate(resume.createdAt)} · {formatBytes(resume.fileSize)} ·{' '}
                  {resume.textLength.toLocaleString()} characters extracted
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to={`/resume/${resume.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
              >
                <Eye className="h-4 w-4" /> View
              </Link>
              <button
                type="button"
                disabled={deletingId === resume.id}
                onClick={() => handleDelete(resume)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deletingId === resume.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    )
  }
}

export default ResumeAnalyzer