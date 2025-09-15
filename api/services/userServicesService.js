import db from "../models/index.js";
const UserServices = db.UserServices;

export const create = async (data) => {
  return await UserServices.create(data);
};

export const getAll = async () => {
  return await UserServices.findAll();
};

export const getById = async (id) => {
  return await UserServices.findByPk(id);
};

export const update = async (id, data) => {
  const serviceType = await UserServices.findByPk(id);
  if (!serviceType) return null;
  return await serviceType.update(data);
};

export const remove = async (id) => {
  const serviceType = await UserServices.findByPk(id);
  if (!serviceType) return null;
  await serviceType.destroy();
  return true;
};
