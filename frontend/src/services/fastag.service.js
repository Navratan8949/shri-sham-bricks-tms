import api from "./api";

export const createFastag = async (data) => {
  try {
    const response = await api.post("/fastags", data);
    return response.data;
  } catch (error) {
    console.error("createFastag error:", error);
    throw (
      error.response?.data?.message ||
      error.message ||
      "Failed to create FASTag record"
    );
  }
};

export const getFastags = async (params = {}) => {
  try {
    const response = await api.get("/fastags", { params });
    return response.data;
  } catch (error) {
    console.error("getFastags error:", error);
    throw (
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch FASTags"
    );
  }
};

export const getFastagById = async (id) => {
  try {
    const response = await api.get(`/fastags/${id}`);
    return response.data;
  } catch (error) {
    console.error("getFastagById error:", error);
    throw (
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch FASTag details"
    );
  }
};

export const updateFastag = async (id, data) => {
  try {
    const response = await api.put(`/fastags/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("updateFastag error:", error);
    throw (
      error.response?.data?.message ||
      error.message ||
      "Failed to update FASTag record"
    );
  }
};

export const deleteFastag = async (id) => {
  try {
    const response = await api.delete(`/fastags/${id}`);
    return response.data;
  } catch (error) {
    console.error("deleteFastag error:", error);
    throw (
      error.response?.data?.message ||
      error.message ||
      "Failed to delete FASTag"
    );
  }
};

