import GoogleTrendsAPI from "./GoogleTrendsAPI.js";
import { TrendsUtils } from "./utils.js";

// Export the main class
export default GoogleTrendsAPI;

// Export utilities
export { TrendsUtils };

// Export an instance for direct usage
export const googleTrendsAPI = new GoogleTrendsAPI();

// Export individual methods for convenience
export const {
  // India methods
  getIndiaTrends4h,
  getIndiaTrends24h,
  getIndiaTrends48h,
  getIndiaTrends7d,

  // US methods
  getUSTrends4h,
  getUSTrends24h,
  getUSTrends48h,
  getUSTrends7d,

  // UK methods
  getUKTrends4h,
  getUKTrends24h,
  getUKTrends48h,
  getUKTrends7d,

  // Generic method
  getTrends,
} = googleTrendsAPI;
