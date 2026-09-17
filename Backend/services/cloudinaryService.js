const cloudinary = require("../config/cloudinary");

const resumesFolder = "ai-career-assistant/resumes";

const isConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );

const uploadBuffer = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: resumesFolder,
        resource_type: "auto",
        ...options,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    stream.end(buffer);
  });

const deleteFile = (publicId) =>
  new Promise((resolve) => {
    if (!publicId) {
      return resolve(null);
    }
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        console.error("Cloudinary delete error:", error.message);
        return resolve(null);
      }
      resolve(result);
    });
  });

module.exports = { cloudinary, isConfigured, uploadBuffer, deleteFile };