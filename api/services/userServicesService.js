import db from "../models/index.js";
import { Op } from "sequelize";

const UserServices = db.UserService;

// Create UserService with associated Service Types
export const create = async (data) => {
  return await db.sequelize.transaction(async (t) => {
    const { serviceTypeIds = [], ...userServiceData } = data;

    const userService = await UserServices.create(userServiceData, {
      transaction: t,
    });

    if (serviceTypeIds.length > 0) {
      await userService.setServiceTypes(serviceTypeIds, { transaction: t });
    }

    return userService;
  });
};

// Get all UserServices with pagination + search + include service types
export const getAll = async ({ page = 1, limit = 10, searchText = "", area = "", lat, lng, radius }) => {
  const offset = (page - 1) * limit;

  let where = {};
  if (searchText) {
    where = {
      [Op.or]: [
        { serviceName: { [Op.iLike]: `%${searchText}%` } },
        { description: { [Op.iLike]: `%${searchText}%` } },
      ],
    };
  }

  // Build provider filter conditions: by area (address) and/or by distance from lat/lng
  const providerConditions = [];
  if (area) {
    providerConditions.push({ address: { [Op.iLike]: `%${area}%` } });
  }

  // If lat, lng and radius are provided, apply Haversine distance filter (radius in kilometers)
  if (lat && lng && radius) {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const radiusNum = parseFloat(radius);

    // Haversine formula in SQL to compute distance (in km) between two lat/lng points
    const haversine = `(
      6371 * acos(
        least(1, cos(radians(${latNum})) * cos(radians("provider"."latitude")) * cos(radians("provider"."longitude") - radians(${lngNum})) + sin(radians(${latNum})) * sin(radians("provider"."latitude")) )
      )
    )`;

    providerConditions.push(db.Sequelize.where(db.Sequelize.literal(haversine), { [Op.lte]: radiusNum }));
  }

  const providerWhere = providerConditions.length ? { [Op.and]: providerConditions } : undefined;

  const { rows, count } = await UserServices.findAndCountAll({
    where,
    limit,
    offset,
    order: [["createdAt", "DESC"]],
    include: [
      { model: db.User, as: "provider", where: providerWhere },
      {
        model: db.ServiceType,
        as: "serviceTypes",
        through: { attributes: [] },
      },
    ],
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

// Get by ID with associated service types
export const getById = async (id) => {
  return await UserServices.findByPk(id, {
    include: [
      { model: db.User, as: "provider" },
      {
        model: db.ServiceType,
        as: "serviceTypes",
        through: { attributes: [] },
      },
    ],
  });
};

// Get by Provider ID
export const getByProviderId = async (providerId) => {
  return await UserServices.findAll({
    where: { providerId },
    order: [["createdAt", "DESC"]],
    include: [
      {
        model: db.ServiceType,
        as: "serviceTypes",
        through: { attributes: [] },
      },
    ],
  });
};

// Update UserService and associated service types
export const update = async (id, data) => {
  return await db.sequelize.transaction(async (t) => {
    const { serviceTypeIds = [], ...userServiceData } = data;
    const userService = await UserServices.findByPk(id, { transaction: t });
    if (!userService) return null;
    await userService.update(userServiceData, { transaction: t });
    await userService.setServiceTypes(serviceTypeIds, { transaction: t });
    return userService;
  });
};

// Delete UserService and associated mappings
export const remove = async (id) => {
  return await db.sequelize.transaction(async (t) => {
    const userService = await UserServices.findByPk(id, { transaction: t });
    if (!userService) return null;

    await userService.setServiceTypes([], { transaction: t }); // clear associations
    await userService.destroy({ transaction: t });

    return true;
  });
};
