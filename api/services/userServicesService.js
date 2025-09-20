import db from "../models/index.js";
import { Op } from "sequelize";

const UserServices = db.UserService;

// Create
export const create = async (data) => {
  return await UserServices.create(data);
};

// Get All with pagination + search
export const getAll = async ({ page = 1, limit = 10, searchText = "" }) => {
  const offset = (page - 1) * limit;

  let where = {};
  if (searchText) {
    where = {
      [Op.or]: [
        { serviceNameIds: { [Op.iLike]: `%${searchText}%` } }, // example field
        { description: { [Op.iLike]: `%${searchText}%` } }, // adapt fields as per your model
      ],
    };
  }

  const { rows, count } = await UserServices.findAndCountAll({
    where,
    limit,
    offset,
    order: [["createdAt", "DESC"]],
    include: [{ model: db.User, as: "provider" }],
  });

  return {
    data: rows,
    pagination: {
      total: count,
      page,
      pages: Math.ceil(count / limit),
    },
  };
};

// Get by ID
export const getById = async (id) => {
  return await UserServices.findById(id);
};

// Get by ID
export const getByProviderId = async (id) => {
  return await UserServices.findAll({
    where: { providerId: id },
    order: [["createdAt", "DESC"]],
  });
};

// Update
export const update = async (id, data) => {
  const userService = await UserServices.findByPk(id);
  if (!userService) return null;
  return await userService.update(data);
};

// Delete
export const remove = async (id) => {
  const userService = await UserServices.findByPk(id);
  if (!userService) return null;
  await userService.destroy();
  return true;
};
