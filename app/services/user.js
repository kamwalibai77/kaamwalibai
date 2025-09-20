import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://localhost:5000/api/users";

const getToken = async () => {
  const token = await AsyncStorage.getItem("token");
  console.log("Fetched token from storage:", token);
  return token;
};

const subscribe = async () => {
  try {
    const token = await getToken();
    const response = await axios.put(
      `${API_URL}/subscribe`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (err) {
    console.log(
      "Subscription error in user.js:",
      err.response?.data || err.message
    );
    throw err;
  }
};

const userApi = { subscribe };

export default userApi;
