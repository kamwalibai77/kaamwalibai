import api from "./api";
const getAll = () => api.get("/service-types");
export default { getAll };
