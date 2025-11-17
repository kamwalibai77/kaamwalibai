import db from "../models/index.js";
const ServiceType = db.ServiceType;

export const create = async (data) => {
  return await ServiceType.create(data);
};

export const getAll = async () => {
  return await ServiceType.findAll();
};

export const getById = async (id) => {
  return await ServiceType.findByPk(id);
};

export const update = async (id, data) => {
  const serviceType = await ServiceType.findByPk(id);
  if (!serviceType) return null;
  return await serviceType.update(data);
};

export const remove = async (id) => {
  const serviceType = await ServiceType.findByPk(id);
  if (!serviceType) return null;
  await serviceType.destroy();
  return true;
};
