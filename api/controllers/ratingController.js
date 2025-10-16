import db from "../models/index.js";

const Rating = db.Rating;

export const createRating = async (req, res) => {
  try {
    const raterId = req.user?.id || req.body?.raterId;

    // Accept flexible keys from clients: ratedId, rated_id, providerId, provider_id
    // and score or rating.
    let { ratedId, score, comment } = req.body || {};

    // Fallbacks for common alternative keys
    if (!ratedId) ratedId = req.body?.rated_id || req.body?.providerId || req.body?.provider_id;
    if (typeof score === "undefined" || score === null)
      score = req.body?.rating || req.body?.score;

    // Basic auth guard
    if (!raterId) return res.status(400).json({ error: "Missing raterId (auth)" });

    // Helpful debug log to inspect incoming payloads when clients report missing fields
    if (!ratedId) {
      console.debug("rating.createRating missing ratedId - incoming:", {
        body: req.body,
        params: req.params,
        query: req.query,
        user: req.user ? { id: req.user.id, role: req.user.role } : undefined,
      });
      return res.status(400).json({ error: "Missing ratedId" });
    }

    if (typeof score === "undefined" || score === null)
      return res.status(400).json({ error: "Missing score" });

    // coerce types
    ratedId = parseInt(ratedId, 10);
    score = parseInt(score, 10);

    if (Number.isNaN(ratedId) || Number.isNaN(score))
      return res.status(400).json({ error: "Invalid ratedId or score" });

    const rating = await Rating.create({ raterId, ratedId, score, comment });
    return res.json({ success: true, rating });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const getAverage = async (req, res) => {
  try {
    const userId = req.params.id;
    const result = await db.Rating.findAll({
      where: { ratedId: userId },
      attributes: [[db.Sequelize.fn("AVG", db.Sequelize.col("score")), "avgScore"]],
    });
    const avg = result && result[0] && result[0].dataValues ? Number(result[0].dataValues.avgScore) || 0 : 0;
    return res.json({ success: true, avg });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export default { createRating, getAverage };
