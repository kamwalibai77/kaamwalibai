import api from "./api";

const subscribe = () => api.put("/profile/subscribe");

export default { subscribe };
