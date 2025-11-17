import db from "../models/index.js";

const { ServiceType, ServiceCombo, AvailabilityTime, Cost, Area } = db;

export const createServiceType = async (data) => {
  return await ServiceType.create(data);
};

export const createServiceCombo = async (data) => {
  return await ServiceCombo.create(data);
};

export const setAvailability = async (providerId, slots) => {
  const payload = slots.map((s) => ({ ...s, providerId }));
  return await AvailabilityTime.bulkCreate(payload);
};

export const setCost = async (providerId, serviceTypeId, amount, currency) => {
  return await Cost.create({ providerId, serviceTypeId, amount, currency });
};

export const setArea = async (providerId, data) => {
  return await Area.create({ ...data, providerId });
};