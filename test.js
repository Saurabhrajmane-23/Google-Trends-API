import { googleTrendsAPI } from "./index.js";

async function testAPI() {
  console.log("🚀 Testing Google Trends API...\n");

  try {
    // Test India trends
    console.log("📊 Testing India Trends (24h)...");
    const indiaTrends = await googleTrendsAPI.getIndiaTrends24h();
    console.log("India Results:", JSON.stringify(indiaTrends, null, 2));
    console.log("\n" + "=".repeat(50) + "\n");

    // Test US trends
    console.log("📊 Testing US Trends (24h)...");
    const usTrends = await googleTrendsAPI.getUSTrends24h();
    console.log("US Results:", JSON.stringify(usTrends, null, 2));
    console.log("\n" + "=".repeat(50) + "\n");

    // Test UK trends
    console.log("📊 Testing UK Trends (24h)...");
    const ukTrends = await googleTrendsAPI.getUKTrends24h();
    console.log("UK Results:", JSON.stringify(ukTrends, null, 2));
    console.log("\n" + "=".repeat(50) + "\n");

    // Test generic method
    console.log("📊 Testing Generic getTrends method (India, 4h)...");
    const genericTrends = await googleTrendsAPI.getTrends("india", 4);
    console.log("Generic Results:", JSON.stringify(genericTrends, null, 2));
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run tests
testAPI();
