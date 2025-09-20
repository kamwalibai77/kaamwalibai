import api from "./api";

const getAllServices = async ({
  page = 1,
  limit = 10,
  search = "",
  area = "",
}) => {
  return await api.get("/service-provider", {
    params: { page, limit, search, area },
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
