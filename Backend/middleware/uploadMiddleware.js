const multer = require("multer");

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const fileFilter = (req, file, cb) => {
  const isPdf =
    String(file.mimetype || "").toLowerCase() === "application/pdf" ||
    String(file.originalname || "").toLowerCase().endsWith(".pdf");

  if (isPdf) {
    return cb(null, true);
  }

  const error = new Error("Only PDF files are allowed");
  error.statusCode = 400;
  cb(error, false);
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter,
});

const uploadResume = (req, res, next) => {
  upload.single("resume")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File too large. Maximum allowed size is 5 MB.",
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || "Invalid file upload",
      });
    }
    next();
  });
};

module.exports = { uploadResume, MAX_FILE_SIZE };