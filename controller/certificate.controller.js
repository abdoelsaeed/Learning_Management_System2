const AppError = require("./../error/err");
const catchAsync = require("./../error/catchAsyn");
const Certificate = require("../models/certificate.Model");
const puppeteer = require("puppeteer");

// استرجاع كل شهادات الطالب الحالي
exports.getMyCertificates = async (req, res, next) => {
  const certificates = await Certificate.find({ receiver_id: req.user._id })
    .populate("course_id", "title")
    .populate("sender_id", "name");
  res.status(200).json({
    status: "success",
    results: certificates.length,
    data: { certificates },
  });
};

// استرجاع شهادة معينة لطالب في كورس
exports.getCertificateForCourse = async (req, res, next) => {
  const { courseId } = req.params;
  const certificate = await Certificate.findOne({
    receiver_id: req.user._id,
    course_id: courseId,
  })
    .populate("course_id", "title")
    .populate("sender_id", "name");
  if (!certificate) {
    return res
      .status(404)
      .json({ status: "fail", message: "Certificate not found" });
  }
  res.status(200).json({
    status: "success",
    data: { certificate },
  });
};

exports.renderCertificate = async (req, res, next) => {
  const { certificateId } = req.params;
  const certificate = await Certificate.findById(certificateId)
    .populate("course_id", "title")
    .populate("receiver_id", "name");
  if (!certificate) return res.status(404).send("Certificate not found");

  res.render("certificate", {
    studentName: certificate.receiver_id.name,
    courseTitle: certificate.course_id.title,
    date: certificate.issuedAt.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    logoUrl:
      "https://thumbs.dreamstime.com/z/lms-letter-technology-logo-design-white-background-lms-creative-initials-letter-logo-concept-lms-letter-design-lms-letter-252935662.jpg?ct=jpeg", // ضع هنا رابط لوجو منصتك أو احذفه لو مش عايز لوجو
    certificateId: certificate._id,
  });
};


exports.downloadCertificatePDF = async (req, res, next) => {
  const { certificateId } = req.params;
  const certUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/certificates/view/${certificateId}`;
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(certUrl, { waitUntil: "networkidle2", timeout: 0 });  const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
  await browser.close();

  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename=certificate-${certificateId}.pdf`,
  });
  res.send(pdfBuffer);
};

