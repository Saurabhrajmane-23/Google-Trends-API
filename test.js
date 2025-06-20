import { googleTrendsAPI } from "./index.js";

console.log("🧪 Testing Google Trends LiteLo API");
console.log("─".repeat(40));

async function runTests() {
  try {
    console.log("Testing India trends (24h)...");
    const result = await googleTrendsAPI.getIndiaTrends24h();

    if (result.success) {
      console.log("✅ Test passed!");
      console.log(`📊 Found ${result.totalTrends} trends`);
      console.log("Top 3 trends:");
      result.trends.slice(0, 3).forEach((trend) => {
        console.log(`  ${trend.rank}. ${trend.title}`);
      });
    } else {
      console.log("❌ Test failed:", result.error);
    }
  } catch (error) {
    console.log("💥 Test error:", error.message);
  }
}

runTests();
