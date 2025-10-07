import * as faqService from "../services/faqService.js";

export const getAllFaqs = async (req, res) => {
  try {
    const faqs = await faqService.getAllFaqs();
    return res.json({ success: true, data: faqs });
  } catch (err) {
    console.error("getAllFaqs error", err && err.stack ? err.stack : err);
    // If the service threw a useful message, include it for easier debugging
    const message = err?.message || "Server error";
    return res.status(500).json({ success: false, message });
  }
};

// Optional: admin create endpoint for quick seeding (not wired to auth here)
export const createFaq = async (req, res) => {
  try {
    const { question, answer } = req.body;
    if (!question || !answer)
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    const faq = await faqService.createFaq({ question, answer });
    return res.status(201).json({ success: true, data: faq });
  } catch (err) {
    console.error("createFaq error", err && err.stack ? err.stack : err);
    const message = err?.message || "Server error";
    return res.status(500).json({ success: false, message });
  }
};
