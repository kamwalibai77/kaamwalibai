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

const createService = (payload: {
  providerId: number;
  serviceTypeIds: number[];
  amount: number;
  rateType: string;
  currency: string;
  contactNumber: string;
}) => api.post("/service-provider", payload);

export default { getAllServices, createService, getAllProviderPostedServices };
