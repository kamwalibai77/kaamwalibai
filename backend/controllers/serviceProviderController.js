import * as service from "../services/serviceProviderService.js";

export const addServiceType = async (req, res) => {
  try {
    const type = await service.createServiceType(req.body);
    res.json({ success: true, type });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const addServiceCombo = async (req, res) => {
  try {
    const combo = await service.createServiceCombo(req.body);
    res.json({ success: true, combo });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateAvailability = async (req, res) => {
  try {
    const slots = await service.setAvailability(req.user?.id || req.body.providerId, req.body.slots);
    res.json({ success: true, slots });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateCost = async (req, res) => {
  try {
    const cost = await service.setCost(
      req.user?.id || req.body.providerId,
      req.body.serviceTypeId,
      req.body.amount,
      req.body.currency
    );
    res.json({ success: true, cost });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateArea = async (req, res) => {
  try {
    const area = await service.setArea(req.user?.id || req.body.providerId, req.body);
    res.json({ success: true, area });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};