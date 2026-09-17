import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
})

export const getErrorMessage = (error) => {
  if (error.response?.data?.message) return error.response.data.message
  if (error.code === 'ERR_NETWORK') {
    return 'Cannot reach the server. Please check your connection.'
  }
  if (error.request) return 'No response from the server. Please try again.'
  return 'Something went wrong. Please try again.'
}

export const uploadResume = (formData) =>
  api.post('/resumes/upload', formData)

export const getResumes = () => api.get('/resumes')

export const getResumeById = (id) => api.get(`/resumes/${id}`)

export const deleteResume = (id) => api.delete(`/resumes/${id}`)

export const analyzeResume = (id) => api.post(`/resumes/${id}/analyze`)

export const calculateATSScore = (id) => api.post(`/resumes/${id}/ats-score`)

export const createJobDescription = (data) => api.post('/job-descriptions', data)

export const getJobDescriptions = () => api.get('/job-descriptions')

export const getJobDescriptionById = (id) => api.get(`/job-descriptions/${id}`)

export const deleteJobDescription = (id) => api.delete(`/job-descriptions/${id}`)

export const createResumeMatch = (resumeId, jobDescriptionId) =>
  api.post('/matches', { resumeId, jobDescriptionId })

export const getMatches = () => api.get('/matches')

export const getMatchById = (id) => api.get(`/matches/${id}`)

export const deleteMatch = (id) => api.delete(`/matches/${id}`)

export const createSkillGap = (data) => api.post('/skill-gaps', data)

export const getSkillGaps = () => api.get('/skill-gaps')

export const getSkillGapById = (id) => api.get(`/skill-gaps/${id}`)

export const deleteSkillGap = (id) => api.delete(`/skill-gaps/${id}`)

export const createRoadmap = (skillGapId) => api.post('/roadmaps', { skillGapId })

export const getRoadmaps = () => api.get('/roadmaps')

export const getRoadmapById = (id) => api.get(`/roadmaps/${id}`)

export const updateRoadmapProgress = (id, data) =>
  api.patch(`/roadmaps/${id}/progress`, data)

export const deleteRoadmap = (id) => api.delete(`/roadmaps/${id}`)

export const generateInterviewQuestions = (data) =>
  api.post('/interview-questions/generate', data)

export const getInterviewQuestionSets = () => api.get('/interview-questions')

export const getInterviewQuestionSetById = (id) =>
  api.get(`/interview-questions/${id}`)

export const deleteInterviewQuestionSet = (id) =>
  api.delete(`/interview-questions/${id}`)

export const startMockInterview = (data) => api.post('/mock-interviews', data)

export const getMockInterviews = () => api.get('/mock-interviews')

export const getMockInterviewById = (id) => api.get(`/mock-interviews/${id}`)

export const submitMockInterviewAnswer = (id, data) =>
  api.patch(`/mock-interviews/${id}/answer`, data)

export const completeMockInterview = (id) =>
  api.post(`/mock-interviews/${id}/complete`)

export const deleteMockInterview = (id) => api.delete(`/mock-interviews/${id}`)

export const generateResume = (data) => api.post('/resume-builder/generate', data)

export const getResumeBuilderResumes = () => api.get('/resume-builder')

export const getResumeBuilderResumeById = (id) => api.get(`/resume-builder/${id}`)

export const updateResumeBuilderResume = (id, data) =>
  api.put(`/resume-builder/${id}`, data)

export const deleteResumeBuilderResume = (id) => api.delete(`/resume-builder/${id}`)

export const downloadResumePdf = (id) =>
  api.get(`/resume-builder/${id}/pdf`, { responseType: 'blob' })

export const createApplication = (data) => api.post('/applications', data)

export const getApplications = (params) => api.get('/applications', { params })

export const getApplicationById = (id) => api.get(`/applications/${id}`)

export const updateApplication = (id, data) =>
  api.put(`/applications/${id}`, data)

export const updateApplicationStatus = (id, status) =>
  api.patch(`/applications/${id}/status`, { status })

export const deleteApplication = (id) => api.delete(`/applications/${id}`)

export const getAnalytics = () => api.get('/analytics')

export const getResumeDraft = () => api.get('/resume-drafts')

export const createResumeDraft = (data) => api.post('/resume-drafts', data)

export const updateResumeDraft = (id, data) =>
  api.put(`/resume-drafts/${id}`, data)

export const deleteResumeDraft = (id) => api.delete(`/resume-drafts/${id}`)

export const downloadResumeDraftPdf = (id) =>
  api.get(`/resume-drafts/${id}/pdf`, { responseType: 'blob' })

export default api