import axios from "axios";

// Create an Axios instance for organization routes
const organizationAPI = axios.create({
  baseURL: "http://localhost:5000/api/organization",
});

// Add request interceptor for token
organizationAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Stage 5: Organization management functions

/**
 * Create/initialize organization profile
 * @param {Object} companyInfo - Organization company information
 * @param {string} companyInfo.companyName - Company name (required)
 * @param {string} [companyInfo.industry] - Industry
 * @param {string} [companyInfo.address] - Address
 * @param {string} [companyInfo.logoUrl] - Logo URL (must be valid URL)
 * @returns {Promise} API response
 */
export const createOrganization = async (companyInfo) => {
  return organizationAPI.post('/', { companyInfo });
};

/**
 * Update organization profile
 * @param {Object} companyInfo - Organization company information (all fields optional)
 * @param {string} [companyInfo.companyName] - Company name
 * @param {string} [companyInfo.industry] - Industry
 * @param {string} [companyInfo.address] - Address
 * @param {string} [companyInfo.logoUrl] - Logo URL (must be valid URL)
 * @returns {Promise} API response
 */
export const updateOrganization = async (companyInfo) => {
  return organizationAPI.put('/', { companyInfo });
};

/**
 * Close/deactivate organization account
 * @returns {Promise} API response
 */
export const closeOrganization = async () => {
  return organizationAPI.patch('/close');
};

export default organizationAPI;

