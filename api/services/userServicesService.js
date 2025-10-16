import { Op } from "sequelize";
import db from "../models/index.js";

const UserServices = db.UserService;

// Create UserService with associated Service Types
export const create = async (data) => {
  return await db.sequelize.transaction(async (t) => {
    const { serviceTypeIds = [], ...userServiceData } = data;

    // allow availabilitySlots to be stored in JSON column
    const userService = await UserServices.create(userServiceData, {
      transaction: t,
    });

    if (serviceTypeIds.length > 0) {
      await userService.setServiceTypes(serviceTypeIds, { transaction: t });
    }

    // If availabilitySlots provided, persist via AvailabilityTime table
    if (userServiceData.availabilitySlots && userServiceData.providerId) {
      // normalize slots: expect array of slot keys like ['morning','evening']
      const slots = (userServiceData.availabilitySlots || []).map((s) => ({
        providerId: userServiceData.providerId,
        dayOfWeek: "any",
        startTime: "00:00:00",
        endTime: "23:59:59",
        slotKey: s,
      }));
      const AvailabilityTime = db.AvailabilityTime;
      // delete previous availability for provider and insert new
      await AvailabilityTime.destroy({ where: { providerId: userServiceData.providerId }, transaction: t });
      if (slots.length) await AvailabilityTime.bulkCreate(slots, { transaction: t });
    }

    return userService;
  });
};

// Get all UserServices with pagination + search + include service types
export const getAll = async ({
  page = 1,
  limit = 10,
  searchText = "",
  area = "",
  lat,
  lng,
  radius,
  gender,
  serviceTypeIds,
}) => {
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
  if (lat !== undefined && lng !== undefined && radius !== undefined) {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const radiusNum = parseFloat(radius);

    if (
      !Number.isNaN(latNum) &&
      !Number.isNaN(lngNum) &&
      !Number.isNaN(radiusNum)
    ) {
      // Bounding-box approximation: compute min/max lat/lng for the given radius (in km)
      // 1 deg latitude ~= 110.574 km
      const latDegreeKm = 110.574;
      const deltaLat = radiusNum / latDegreeKm;

      // 1 deg longitude ~= 111.320*cos(lat)
      const lngDegreeKm = 111.32 * Math.cos((latNum * Math.PI) / 180);
      const deltaLng = lngDegreeKm > 0 ? radiusNum / lngDegreeKm : 0;

      const minLat = latNum - deltaLat;
      const maxLat = latNum + deltaLat;
      const minLng = lngNum - deltaLng;
      const maxLng = lngNum + deltaLng;

      // match providers inside bounding-box OR providers missing coordinates (fallback)
      const bboxAnd = {
        [Op.and]: [
          { latitude: { [Op.between]: [minLat, maxLat] } },
          { longitude: { [Op.between]: [minLng, maxLng] } },
        ],
      };

      providerConditions.push({
        [Op.or]: [
          bboxAnd,
          { latitude: { [Op.is]: null } },
          { longitude: { [Op.is]: null } },
        ],
      });
    }
  }

  let providerWhere = providerConditions.length
    ? { [Op.and]: providerConditions }
    : undefined;

  // apply gender filter to provider if passed
  if (gender) {
    if (providerWhere) {
      providerWhere.gender = gender;
    } else {
      providerWhere = { gender };
    }
  }

  // If serviceTypeIds provided, filter services that are associated with any of the given ids
  const serviceTypeFilter = serviceTypeIds
    ? {
        model: db.ServiceType,
        as: "serviceTypes",
        through: { attributes: [] },
        where: {
          id: Array.isArray(serviceTypeIds)
            ? serviceTypeIds
            : String(serviceTypeIds).split(","),
        },
      }
    : {
        model: db.ServiceType,
        as: "serviceTypes",
        through: { attributes: [] },
      };

  const include = [
    { model: db.User, as: "provider", where: providerWhere },
    serviceTypeFilter,
  ];

  // When filtering by serviceTypeIds we want distinct provider services
  const findOpts = {
    where,
    limit,
    offset,
    order: [["createdAt", "DESC"]],
    include,
    distinct: true,
  };

  const { rows, count } = await UserServices.findAndCountAll(findOpts);

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

    // handle availabilitySlots similar to create
    if (userServiceData.availabilitySlots && userServiceData.providerId) {
      const slots = (userServiceData.availabilitySlots || []).map((s) => ({
        providerId: userServiceData.providerId,
        dayOfWeek: "any",
        startTime: "00:00:00",
        endTime: "23:59:59",
        slotKey: s,
      }));
      const AvailabilityTime = db.AvailabilityTime;
      await AvailabilityTime.destroy({ where: { providerId: userServiceData.providerId }, transaction: t });
      if (slots.length) await AvailabilityTime.bulkCreate(slots, { transaction: t });
    }
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
