import api from "./api";

const getAllServices = async ({
  page = 1,
  limit = 10,
  search = "",
  area = "",
  lat, // optional user latitude
  lng, // optional user longitude
  radius, // optional radius in km
}: {
  page?: number;
  limit?: number;
  search?: string;
  area?: string;
  lat?: number | string;
  lng?: number | string;
  radius?: number | string;
}) => {
  const params: any = { page, limit, search, area };
  if (lat !== undefined) params.lat = lat;
  if (lng !== undefined) params.lng = lng;
  if (radius !== undefined) params.radius = radius;

  return await api.get("/service-provider", {
    params,
  });
};

const getAllProviderPostedServices = (id: string) =>
  api.get(`/service-provider/${id}/services`);

const removeProviderService = (id: string) =>
  api.delete(`/service-provider/${id}`);

const createService = (payload: {
  providerId: number;
  serviceTypeIds: number[];
  amount: number;
  rateType: string;
  currency: string;
  contactNumber: string;
}) => api.post("/service-provider", payload);

const editService = (
  id: number,
  payload: {
    providerId: number;
    serviceTypeIds: number[];
    amount: number;
    rateType: string;
    currency: string;
    contactNumber: string;
  }
) => api.put(`/service-provider/${id}`, payload);

export default {
  getAllServices,
  createService,
  getAllProviderPostedServices,
  removeProviderService,
  editService,
};
