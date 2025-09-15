import db from "../models/index.js";
const UserServiceCombo = db.UserServiceCombo;

export const create = async (data) => {
  return await UserServiceCombo.create(data);
};

export const getAll = async () => {
  return await UserServiceCombo.findAll();
};

export const getById = async (id) => {
  return await UserServiceCombo.findByPk(id);
};

export const update = async (id, data) => {
  const serviceType = await UserServiceCombo.findByPk(id);
  if (!serviceType) return null;
  return await serviceType.update(data);
};

export const remove = async (id) => {
  const serviceType = await UserServiceCombo.findByPk(id);
  if (!serviceType) return null;
  await serviceType.destroy();
  return true;
};
