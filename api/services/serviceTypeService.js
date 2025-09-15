import db from "../models/index.js";
const ServiceType = db.ServiceType;

export const create = async (data) => {
  return await Area.create(data);
};

export const getAll = async () => {
  return await Area.findAll();
};

export const getById = async (id) => {
  return await Area.findByPk(id);
};

export const update = async (id, data) => {
  const serviceType = await Area.findByPk(id);
  if (!serviceType) return null;
  return await serviceType.update(data);
};

export const remove = async (id) => {
  const serviceType = await Area.findByPk(id);
  if (!serviceType) return null;
  await serviceType.destroy();
  return true;
};
