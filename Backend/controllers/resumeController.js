const mongoose = require("mongoose");
const Resume = require("../models/Resume");
const { extractPdfText } = require("../services/pdfService");
const { analyzeResume: analyzeResumeWithGemini } = require("../services/geminiService");
const {
  calculateATSScore: calculateATSWithRules,
} = require("../services/atsService");
const {
  isConfigured,
  uploadBuffer,
  deleteFile,
} = require("../services/cloudinaryService");

const toSafeSummary = (resume) => ({
  id: resume._id,
  fileName: resume.fileName,
  fileUrl: resume.fileUrl,
  fileType: resume.fileType,
  fileSize: resume.fileSize,
  textLength: resume.extractedText ? resume.extractedText.length : 0,
  analyzed: Boolean(resume.analysis),
  atsScore: resume.atsScore ? resume.atsScore.overallScore : null,
  createdAt: resume.createdAt,
  updatedAt: resume.updatedAt,
});

const findOwnedResume = async (id, userId) => {
  if (!mongoose.isValidObjectId(id)) {
    const err = new Error("Invalid resume id");
    err.statusCode = 400;
    throw err;
  }

  const resume = await Resume.findById(id);

  if (!resume || String(resume.userId) !== String(userId)) {
    return null;
  }

  return resume;
};

// @desc    Upload a resume PDF
// @route   POST /api/resumes/upload
// @access  Private
const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded. Please attach a PDF resume.",
      });
    }

    if (!isConfigured()) {
      return res.status(500).json({
        success: false,
        message:
          "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in Backend/.env.",
      });
    }

    const extractedText = await extractPdfText(req.file.buffer);

    let cloudinaryResult;
    try {
      cloudinaryResult = await uploadBuffer(req.file.buffer);
    } catch (error) {
      console.error("Cloudinary upload error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Failed to store the resume file. Please try again.",
      });
    }

    let resume;
    try {
      resume = await Resume.create({
        userId: req.user._id,
        fileName: req.file.originalname,
        fileUrl: cloudinaryResult.secure_url,
        publicId: cloudinaryResult.public_id,
        extractedText,
        fileType: req.file.mimetype || "application/pdf",
        fileSize: req.file.size,
      });
    } catch (error) {
      console.error("Resume save error:", error.message);
      await deleteFile(cloudinaryResult.public_id);
      return res.status(500).json({
        success: false,
        message: "Failed to save resume details. Please try again.",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Resume uploaded successfully",
      resume: {
        ...toSafeSummary(resume),
        extractedTextLength: resume.extractedText.length,
      },
    });
  } catch (error) {
    console.error("Upload resume error:", error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Server error, please try again",
    });
  }
};

// @desc    Get logged-in user's resumes
// @route   GET /api/resumes
// @access  Private
const getMyResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      resumes: resumes.map(toSafeSummary),
    });
  } catch (error) {
    console.error("List resumes error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again",
    });
  }
};

// @desc    Get a single resume by id (owner only)
// @route   GET /api/resumes/:id
// @access  Private
const getResumeById = async (req, res) => {
  try {
    const resume = await findOwnedResume(req.params.id, req.user._id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    return res.status(200).json({
      success: true,
      resume: {
        ...toSafeSummary(resume),
        extractedText: resume.extractedText,
        analysis: resume.analysis || null,
        atsScore: resume.atsScore || null,
      },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    console.error("Get resume error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again",
    });
  }
};

// @desc    Analyze a resume with Gemini (owner only)
// @route   POST /api/resumes/:id/analyze
// @access  Private
const analyzeResume = async (req, res) => {
  try {
    const resume = await findOwnedResume(req.params.id, req.user._id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    if (!resume.extractedText || !resume.extractedText.trim()) {
      return res.status(400).json({
        success: false,
        message: "No text could be extracted from this resume to analyze.",
      });
    }

    const analysis = await analyzeResumeWithGemini(resume.extractedText);

    resume.analysis = analysis;
    await resume.save();

    return res.status(200).json({
      success: true,
      message: "Resume analyzed successfully",
      resume: {
        ...toSafeSummary(resume),
        analysis,
      },
    });
  } catch (error) {
    console.error("Analyze resume error:", error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Unable to analyze the resume right now. Please try again.",
    });
  }
};

// @desc    Calculate ATS score for a resume (owner only)
// @route   POST /api/resumes/:id/ats-score
// @access  Private
const calculateATSScore = async (req, res) => {
  try {
    const resume = await findOwnedResume(req.params.id, req.user._id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    if (!resume.extractedText || !resume.extractedText.trim()) {
      return res.status(400).json({
        success: false,
        message: "No text could be extracted from this resume to score.",
      });
    }

    const analysis = resume.analysis || null;
    const atsScore = calculateATSWithRules(resume.extractedText, analysis);

    resume.atsScore = atsScore;
    await resume.save();

    return res.status(200).json({
      success: true,
      message: "ATS score calculated successfully",
      atsScore,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    console.error("ATS score error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to calculate the ATS score right now. Please try again.",
    });
  }
};

// @desc    Delete a resume (owner only)
// @route   DELETE /api/resumes/:id
// @access  Private
const deleteResume = async (req, res) => {
  try {
    const resume = await findOwnedResume(req.params.id, req.user._id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    await Resume.deleteOne({ _id: resume._id });
    await deleteFile(resume.publicId);

    return res.status(200).json({
      success: true,
      message: "Resume deleted successfully",
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    console.error("Delete resume error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again",
    });
  }
};

module.exports = {
  uploadResume,
  getMyResumes,
  getResumeById,
  analyzeResume,
  calculateATSScore,
  deleteResume,
};