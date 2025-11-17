import db from "../models/index.js";

// Try to resolve the model using common name variants. Some model files
// define the model name as "Faq" while others (older/plural) may use "Faqs".
const FaqModel = db.Faq;

export async function getAllFaqs() {
  if (!FaqModel) throw new Error("Faq model not found");
  return await FaqModel.findAll({ order: [["id", "ASC"]] });
}

export async function createFaq({ question, answer }) {
  if (!FaqModel) throw new Error("Faq model not found");
  return await FaqModel.create({ question, answer });
}
