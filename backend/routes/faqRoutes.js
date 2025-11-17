import express from "express";
import { getAllFaqs, createFaq } from "../controllers/faqController.js";

const router = express.Router();

router.get("/", getAllFaqs);
// Optional create route (could be protected later)
router.post("/", createFaq);

export default router;
