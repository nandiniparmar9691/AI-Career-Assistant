const { PDFParse } = require("pdf-parse");

const extractPdfText = async (buffer) => {
  if (!buffer || buffer.length === 0) {
    const err = new Error("No file data received");
    err.statusCode = 400;
    throw err;
  }

  let parser;
  try {
    parser = new PDFParse({ data: buffer });
    const result = await parser.getText({ pageJoiner: "" });
    const text = (result && result.text ? result.text : "").trim();

    if (!text) {
      const err = new Error(
        "No readable text found in the PDF. Upload a text-based resume PDF."
      );
      err.statusCode = 400;
      throw err;
    }

    return text;
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    const err = new Error(
      "Could not read the PDF file. It may be corrupted or not a valid PDF."
    );
    err.statusCode = 400;
    throw err;
  } finally {
    if (parser && typeof parser.destroy === "function") {
      try {
        await parser.destroy();
      } catch {
        // ignore cleanup errors
      }
    }
  }
};

module.exports = { extractPdfText };