import db from "../models/index.js";
const AvailabilityTime = db.AvailabilityTime;

export const create = async (data) => {
  return await AvailabilityTime.create(data);
};

export const getAll = async () => {
  return await AvailabilityTime.findAll();
};

export const getById = async (id) => {
  return await AvailabilityTime.findByPk(id);
};

export const update = async (id, data) => {
  const serviceType = await AvailabilityTime.findByPk(id);
  if (!serviceType) return null;
  return await serviceType.update(data);
};

export const remove = async (id) => {
  const serviceType = await AvailabilityTime.findByPk(id);
  if (!serviceType) return null;
  await serviceType.destroy();
  return true;
};
