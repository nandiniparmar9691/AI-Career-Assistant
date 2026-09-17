const PDFDocument = require("pdfkit");

const asString = (value) => (typeof value === "string" ? value.trim() : "");

const asStringArray = (value) =>
  Array.isArray(value)
    ? value
        .filter((item) => typeof item === "string" || typeof item === "number")
        .map((item) => String(item).trim())
        .filter(Boolean)
    : [];

const TEMPLATE_META = {
  CLASSIC: { accent: "#111111", headerFill: "#ffffff", nameSize: 18, ruleBelowName: true },
  MINIMAL: { accent: "#334155", headerFill: "#ffffff", nameSize: 16, ruleBelowName: false },
  MODERN: { accent: "#4f46e5", headerFill: "#4f46e5", nameSize: 19, ruleBelowName: false },
};

// @desc  Generate a clean, text-based PDF for the general resume draft.
const generateResumeDraftPdf = async (draft) => {
  const personal = (draft && draft.personal) || {};
  const template = TEMPLATE_META[asString(draft && draft.template)] || TEMPLATE_META.CLASSIC;
  const summary = asString(draft && draft.summary);
  const skills = Array.isArray(draft && draft.skills) ? draft.skills : [];
  const education = Array.isArray(draft && draft.education) ? draft.education : [];
  const experience = Array.isArray(draft && draft.experience) ? draft.experience : [];
  const projects = Array.isArray(draft && draft.projects) ? draft.projects : [];
  const certifications = Array.isArray(draft && draft.certifications) ? draft.certifications : [];
  const achievements = asStringArray(draft && draft.achievements);
  const additional = (draft && draft.additional) || {};

  const name = asString(personal.fullName);
  const contactParts = [
    personal.email,
    personal.phone,
    personal.location,
    personal.linkedin,
    personal.github,
    personal.portfolio,
  ]
    .map((v) => asString(v))
    .filter(Boolean);

  const hasAnyContent =
    name ||
    contactParts.length ||
    summary ||
    skills.length ||
    education.length ||
    experience.length ||
    projects.length ||
    certifications.length ||
    achievements.length ||
    asStringArray(additional.languages).length ||
    asStringArray(additional.interests).length;

  if (!hasAnyContent) {
    const err = new Error("Resume content is empty. Nothing to generate.");
    err.statusCode = 400;
    throw err;
  }

  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 55, bottom: 55, left: 50, right: 50 },
    bufferPages: false,
    info: {
      Title: `${name || "Resume"} - Resume`,
      Author: name || "AI Career Assistant",
      Subject: "Professional resume",
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

  // ---- Header ----
  if (template.headerFill && asString(template.headerFill) !== "#ffffff") {
    doc
      .rect(0, 0, 595.28, 95)
      .fill(template.headerFill);
    doc.fillColor("#ffffff");
    doc.font("Helvetica-Bold").fontSize(template.nameSize).text(name || "Resume", 50, 52, {
      width: contentWidth,
      lineGap: 3,
    });
    if (contactParts.length) {
      doc.font("Helvetica").fontSize(9.5).fillColor("#eef2ff");
      doc.text(contactParts.join("   |   "), 50, 78, {
        width: contentWidth,
        lineGap: 3,
      });
    }
    doc.y = 115;
    doc.fillColor("#111111");
  } else {
    if (name) {
      doc.font("Helvetica-Bold").fontSize(template.nameSize).fillColor("#000000");
      doc.text(name, 50, doc.y, { width: contentWidth, lineGap: 2 });
    }
    if (name || contactParts.length) doc.moveDown(0.15);
    if (contactParts.length) {
      doc.font("Helvetica").fontSize(9).fillColor("#333333");
      doc.text(contactParts.join("  |  "), 50, doc.y, {
        width: contentWidth,
        lineGap: 3,
      });
    }
    if (name || contactParts.length) {
      doc.moveDown(0.35);
      if (template.ruleBelowName) {
        ensureSpace(30);
        doc
          .strokeColor("#333333")
          .lineWidth(0.8)
          .moveTo(50, doc.y)
          .lineTo(595.28 - 50, doc.y)
          .stroke();
        doc.moveDown(0.45);
      }
    }
  }

  const sectionTitle = (title) => {
    ensureSpace(60);
    doc.moveDown(0.5);
    doc.font("Helvetica-Bold").fontSize(11).fillColor(template.accent);
    doc.text(title.toUpperCase(), 50, doc.y, { width: contentWidth, lineGap: 2 });
    doc.moveDown(0.15);
    const ruleY = doc.y;
    doc
      .strokeColor("#9ca3af")
      .lineWidth(0.6)
      .moveTo(50, ruleY)
      .lineTo(595.28 - 50, ruleY)
      .stroke();
    doc.moveDown(0.4);
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
    doc.font("Helvetica").fontSize(9.5).fillColor("#222222").text(`\u2022 ${text}`, 50, doc.y, {
      width: contentWidth,
      lineGap: 3,
    });
  };

  const entryHeading = (text) => {
    ensureSpace(26);
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#111111");
    doc.text(text, 50, doc.y, { width: contentWidth, lineGap: 2 });
  };

  const entryMeta = (text) => {
    doc.font("Helvetica").fontSize(8.5).fillColor("#555555");
    doc.text(text, 50, doc.y, { width: contentWidth, lineGap: 2 });
  };

  if (summary) {
    sectionTitle("Professional Summary");
    body(summary);
    doc.moveDown(0.3);
  }

  const skillGroups = skills.filter(
    (s) =>
      s &&
      typeof s === "object" &&
      (asString(s.category) || asStringArray(s.items).length)
  );
  if (skillGroups.length) {
    sectionTitle("Skills");
    skillGroups.forEach((group) => {
      const category = asString(group.category);
      const items = asStringArray(group.items).join(", ");
      if (!items) return;
      ensureSpace(26);
      body(category ? `${category}: ${items}` : items);
      doc.moveDown(0.25);
    });
    doc.moveDown(0.15);
  }

  const expEntries = experience.filter(
    (e) =>
      e &&
      typeof e === "object" &&
      (asString(e.jobTitle) || asString(e.company) || asString(e.description))
  );
  if (expEntries.length) {
    sectionTitle("Experience");
    expEntries.forEach((entry) => {
      const heading = [asString(entry.jobTitle), asString(entry.company)]
        .filter(Boolean)
        .join(", ");
      const meta = [
        asString(entry.location),
        [asString(entry.startDate), asString(entry.endDate)].filter(Boolean).join(" - "),
      ]
        .filter(Boolean)
        .join("  |  ");
      if (heading) entryHeading(heading);
      if (meta) entryMeta(meta);
      doc.moveDown(0.2);
      if (asString(entry.description)) body(asString(entry.description));
      doc.moveDown(0.3);
    });
  }

  const projectEntries = projects.filter(
    (p) =>
      p &&
      typeof p === "object" &&
      (asString(p.name) || asString(p.description) || asStringArray(p.technologies).length)
  );
  if (projectEntries.length) {
    sectionTitle("Projects");
    projectEntries.forEach((project) => {
      const name = asString(project.name);
      if (name) entryHeading(name);
      const tech = asStringArray(project.technologies);
      if (tech.length) {
        entryMeta(`Technologies: ${tech.join(", ")}`);
        doc.moveDown(0.15);
      }
      if (asString(project.description)) {
        ensureSpace(24);
        body(asString(project.description));
      }
      const links = [asString(project.githubUrl), asString(project.liveUrl)].filter(Boolean);
      if (links.length) {
        ensureSpace(24);
        body(`Links: ${links.join("   |   ")}`, { size: 8.5 });
      }
      doc.moveDown(0.3);
    });
  }

  const eduEntries = education.filter(
    (e) =>
      e &&
      typeof e === "object" &&
      (asString(e.degree) || asString(e.institution) || asString(e.score))
  );
  if (eduEntries.length) {
    sectionTitle("Education");
    eduEntries.forEach((entry) => {
      const heading = [asString(entry.degree), asString(entry.institution)]
        .filter(Boolean)
        .join(", ");
      const meta = [
        asString(entry.location),
        [asString(entry.startDate), asString(entry.endDate)].filter(Boolean).join(" - "),
      ]
        .filter(Boolean)
        .join("  |  ");
      if (heading) entryHeading(heading);
      if (meta) entryMeta(meta);
      if (asString(entry.score)) {
        ensureSpace(22);
        body(`CGPA / Percentage: ${asString(entry.score)}`);
        doc.moveDown(0.1);
      }
      doc.moveDown(0.3);
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
        asString(cert.url),
      ].filter(Boolean);
      body(parts.join("   |   "));
      doc.moveDown(0.25);
    });
    doc.moveDown(0.15);
  }

  if (achievements.length) {
    sectionTitle("Achievements");
    achievements.forEach((achievement) => bullet(achievement));
    doc.moveDown(0.25);
  }

  const languages = asStringArray(additional.languages);
  const interests = asStringArray(additional.interests);
  if (languages.length || interests.length) {
    sectionTitle("Additional Information");
    if (languages.length) {
      ensureSpace(24);
      body(`Languages: ${languages.join(", ")}`);
      doc.moveDown(0.25);
    }
    if (interests.length) {
      ensureSpace(24);
      body(`Interests: ${interests.join(", ")}`);
      doc.moveDown(0.25);
    }
  }

  doc.end();
  const buffer = await finished;
  return { buffer, filename: asString(personal.fullName) || "Resume" };
};

module.exports = { generateResumeDraftPdf };