const PDFDocument = require("pdfkit");

const asString = (value) => (typeof value === "string" ? value.trim() : "");

const asStringArray = (value) =>
  Array.isArray(value)
    ? value
        .filter((item) => typeof item === "string" || typeof item === "number")
        .map((item) => String(item).trim())
        .filter(Boolean)
    : [];

// @desc  Build a safe, ATS-friendly filename from the candidate name.
const safePdfFilename = (name) => {
  const cleaned = asString(name)
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9_\-]/g, "")
    .replace(/_+/g, "_")
    .slice(0, 60);
  return `${cleaned || "ATS_Resume"}_ATS_Resume.pdf`;
};

// @desc  Generate a clean text-based, ATS-friendly PDF from saved resume content.
const generateResumePdf = async (docData) => {
  const content =
    docData && docData.content && typeof docData.content === "object"
      ? docData.content
      : {};
  const contact =
    content.contact && typeof content.contact === "object" ? content.contact : {};
  const targetRole = asString(docData && docData.targetRole);
  const summary = asString(content.summary);
  const skills = Array.isArray(content.skills) ? content.skills : [];
  const experience = Array.isArray(content.experience) ? content.experience : [];
  const projects = Array.isArray(content.projects) ? content.projects : [];
  const education = Array.isArray(content.education) ? content.education : [];
  const certifications = Array.isArray(content.certifications)
    ? content.certifications
    : [];
  const additional =
    content.additional && typeof content.additional === "object"
      ? content.additional
      : {};

  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 55, bottom: 55, left: 50, right: 50 },
    bufferPages: false,
    info: {
      Title: `${asString(contact.name) || "ATS Resume"} - Resume`,
      Author: asString(contact.name) || "AI Career Assistant",
      Subject: "ATS-optimized resume",
    },
  });

  const chunks = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const finished = new Promise((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const PAGE_HEIGHT = 842;
  const BOTTOM_MARGIN = 55;
  const contentWidth = 595.28 - 50 - 50;

  const ensureSpace = (needed) => {
    if (doc.y + needed > PAGE_HEIGHT - BOTTOM_MARGIN) {
      doc.addPage();
      return true;
    }
    return false;
  };

  const sectionTitle = (title) => {
    ensureSpace(60);
    doc.moveDown(0.6);
    doc.font("Helvetica-Bold").fontSize(11.5).fillColor("#111111");
    doc.text(title.toUpperCase(), 50, doc.y, { width: contentWidth, lineGap: 2 });
    doc.moveDown(0.15);
    const ruleY = doc.y;
    doc
      .strokeColor("#333333")
      .lineWidth(0.8)
      .moveTo(50, ruleY)
      .lineTo(595.28 - 50, ruleY)
      .stroke();
    doc.fillColor("#111111");
    doc.moveDown(0.45);
  };

  const body = (text, opts = {}) => {
    doc
      .font(opts.bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(opts.size || 9.5)
      .fillColor("#222222");
    doc.text(text, 50, doc.y, {
      width: contentWidth,
      lineGap: opts.lineGap != null ? opts.lineGap : 3,
    });
  };

  const bullet = (text) => {
    ensureSpace(24);
    doc
      .font("Helvetica")
      .fontSize(9.5)
      .fillColor("#222222")
      .text(`\u2022 ${text}`, 50, doc.y, {
        width: contentWidth,
        lineGap: 3,
      });
  };

  const contactParts = [
    contact.email,
    contact.phone,
    contact.location,
    contact.linkedin,
    contact.github,
    contact.portfolio,
  ]
    .map((v) => asString(v))
    .filter(Boolean);

  const hasAnyContent =
    asString(contact.name) ||
    contactParts.length ||
    asString(contact.email) ||
    summary ||
    skills.length ||
    experience.length ||
    projects.length ||
    education.length ||
    certifications.length ||
    asStringArray(additional.languages).length ||
    asStringArray(additional.achievements).length ||
    asStringArray(additional.interests).length;

  if (!hasAnyContent) {
    const err = new Error("Resume content is empty. Nothing to generate.");
    err.statusCode = 400;
    throw err;
  }

  doc.font("Helvetica-Bold").fontSize(18).fillColor("#000000");
  doc.text(asString(contact.name) || targetRole || "ATS Resume", 50, doc.y, {
    width: contentWidth,
    lineGap: 2,
  });

  if (targetRole && asString(contact.name)) {
    doc.font("Helvetica").fontSize(10.5).fillColor("#333333");
    doc.text(targetRole, 50, doc.y, { width: contentWidth, lineGap: 2 });
  }

  ensureSpace(30);
  if (contactParts.length) {
    doc.font("Helvetica").fontSize(9).fillColor("#333333");
    doc.text(contactParts.join("  |  "), 50, doc.y, {
      width: contentWidth,
      lineGap: 3,
    });
  }
  doc.moveDown(0.4);

  if (summary) {
    sectionTitle("Professional Summary");
    ensureSpace(30);
    body(summary);
    doc.moveDown(0.4);
  }

  const skillGroups = skills.filter(
    (s) =>
      s &&
      typeof s === "object" &&
      (asString(s.category) || asStringArray(s.items).length)
  );
  if (skillGroups.length) {
    sectionTitle("Technical Skills");
    skillGroups.forEach((group) => {
      const category = asString(group.category);
      const items = asStringArray(group.items).join(", ");
      if (!items) return;
      ensureSpace(26);
      body(category ? `${category}: ${items}` : items);
      doc.moveDown(0.3);
    });
    doc.moveDown(0.2);
  }

  const expEntries = experience.filter(
    (e) =>
      e &&
      typeof e === "object" &&
      (asString(e.company) ||
        asString(e.role) ||
        asStringArray(e.bullets).length)
  );
  if (expEntries.length) {
    sectionTitle("Work Experience");
    expEntries.forEach((entry) => {
      const heading = [asString(entry.role), asString(entry.company)]
        .filter(Boolean)
        .join(", ");
      const meta = [asString(entry.location), asString(entry.startDate), asString(entry.endDate)]
        .filter(Boolean)
        .join("  |  ");
      if (heading) {
        ensureSpace(26);
        doc.font("Helvetica-Bold").fontSize(10).fillColor("#111111");
        doc.text(heading, 50, doc.y, { width: contentWidth, lineGap: 2 });
      }
      if (meta) {
        doc.font("Helvetica").fontSize(8.5).fillColor("#555555");
        doc.text(meta, 50, doc.y, { width: contentWidth, lineGap: 2 });
      }
      doc.moveDown(0.2);
      asStringArray(entry.bullets).forEach((b) => bullet(b));
      doc.moveDown(0.35);
    });
  }

  const projectEntries = projects.filter(
    (p) =>
      p &&
      typeof p === "object" &&
      (asString(p.name) ||
        asString(p.description) ||
        asStringArray(p.bullets).length)
  );
  if (projectEntries.length) {
    sectionTitle("Projects");
    projectEntries.forEach((project) => {
      const name = asString(project.name);
      const link = asString(project.link);
      const tech = asStringArray(project.technologies);
      if (name || link) {
        ensureSpace(26);
        doc.font("Helvetica-Bold").fontSize(10).fillColor("#111111");
        doc.text(
          [name, link].filter(Boolean).join("  -  "),
          50,
          doc.y,
          { width: contentWidth, lineGap: 2 }
        );
      }
      if (tech.length) {
        doc.font("Helvetica").fontSize(8.5).fillColor("#555555");
        doc.text(`Technologies: ${tech.join(", ")}`, 50, doc.y, {
          width: contentWidth,
          lineGap: 2,
        });
      }
      doc.moveDown(0.2);
      if (asString(project.description)) body(asString(project.description));
      asStringArray(project.bullets).forEach((b) => bullet(b));
      doc.moveDown(0.35);
    });
  }

  const eduEntries = education.filter(
    (e) =>
      e &&
      typeof e === "object" &&
      (asString(e.institution) ||
        asString(e.degree) ||
        asStringArray(e.details).length)
  );
  if (eduEntries.length) {
    sectionTitle("Education");
    eduEntries.forEach((entry) => {
      const heading = [
        asString(entry.degree),
        asString(entry.field),
        asString(entry.institution),
      ]
        .filter(Boolean)
        .join(", ");
      const meta = [asString(entry.location), asString(entry.startDate), asString(entry.endDate)]
        .filter(Boolean)
        .join("  |  ");
      if (heading) {
        ensureSpace(26);
        doc.font("Helvetica-Bold").fontSize(10).fillColor("#111111");
        doc.text(heading, 50, doc.y, { width: contentWidth, lineGap: 2 });
      }
      if (meta) {
        doc.font("Helvetica").fontSize(8.5).fillColor("#555555");
        doc.text(meta, 50, doc.y, { width: contentWidth, lineGap: 2 });
      }
      doc.moveDown(0.2);
      asStringArray(entry.details).forEach((d) => bullet(d));
      doc.moveDown(0.35);
    });
  }

  const certEntries = certifications.filter(
    (c) => c && typeof c === "object" && asString(c.name)
  );
  if (certEntries.length) {
    sectionTitle("Certifications");
    certEntries.forEach((cert) => {
      ensureSpace(24);
      const parts = [
        asString(cert.name),
        asString(cert.issuer),
        asString(cert.date),
        asString(cert.link),
      ].filter(Boolean);
      body(parts.join("  |  "));
      doc.moveDown(0.3);
    });
    doc.moveDown(0.2);
  }

  const languages = asStringArray(additional.languages);
  const achievements = asStringArray(additional.achievements);
  const interests = asStringArray(additional.interests);
  if (languages.length || achievements.length || interests.length) {
    sectionTitle("Additional Information");
    if (languages.length) {
      ensureSpace(24);
      body(`Languages: ${languages.join(", ")}`);
      doc.moveDown(0.3);
    }
    if (achievements.length) {
      ensureSpace(24);
      body(`Achievements: ${achievements.join(", ")}`);
      doc.moveDown(0.3);
    }
    if (interests.length) {
      ensureSpace(24);
      body(`Interests: ${interests.join(", ")}`);
      doc.moveDown(0.3);
    }
  }

  doc.end();
  const buffer = await finished;
  return { buffer, filename: safePdfFilename(contact.name) };
};

module.exports = { generateResumePdf, safePdfFilename };