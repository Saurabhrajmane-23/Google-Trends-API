import { googleTrendsAPI } from "./index.js";

// Example 1: Basic usage - Get trends from different countries
async function example1_basicUsage() {
  console.log("📊 Example 1: Basic Usage");
  console.log("─".repeat(40));

  try {
    // Get India trends for last 24 hours
    const indiaTrends = await googleTrendsAPI.getIndiaTrends24h();

    if (indiaTrends.success) {
      console.log(`🇮🇳 India - Top 5 trends (${indiaTrends.timeRange}):`);
      indiaTrends.trends.slice(0, 5).forEach((trend) => {
        console.log(`   ${trend.rank}. ${trend.title}`);
      });
    }
  } catch (error) {
    console.error("Error:", error.message);
  }

  console.log();
}

// Example 2: Parallel requests for multiple countries
async function example2_parallelRequests() {
  console.log("📊 Example 2: Parallel Requests");
  console.log("─".repeat(40));

  try {
    console.log("⏳ Fetching trends from multiple countries...");

    const [india, us, uk] = await Promise.all([
      googleTrendsAPI.getIndiaTrends4h(),
      googleTrendsAPI.getUSTrends4h(),
      googleTrendsAPI.getUKTrends4h(),
    ]);

    // Display results
    const countries = [
      { name: "🇮🇳 India", data: india },
      { name: "🇺🇸 United States", data: us },
      { name: "🇬🇧 United Kingdom", data: uk },
    ];

    countries.forEach((country) => {
      if (country.data.success) {
        console.log(`${country.name} - Top 3 trends:`);
        country.data.trends.slice(0, 3).forEach((trend) => {
          console.log(`   ${trend.rank}. ${trend.title}`);
        });
      } else {
        console.log(`${country.name} - Failed: ${country.data.error}`);
      }
      console.log();
    });
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Example 3: Using the generic method with custom parameters
async function example3_genericMethod() {
  console.log("📊 Example 3: Generic Method");
  console.log("─".repeat(40));

  try {
    // Get top 10 trends from India for last 4 hours
    const trends = await googleTrendsAPI.getTrends("india", 4, 10);

    if (trends.success) {
      console.log(`📈 Custom request results:`);
      console.log(`   Country: ${trends.country}`);
      console.log(`   Time Range: ${trends.timeRange}`);
      console.log(`   Total Trends: ${trends.totalTrends}`);
      console.log(`   Scraping Duration: ${trends.scrapingDuration}`);
      console.log();

      console.log("🔥 Trending topics:");
      trends.trends.forEach((trend) => {
        console.log(`   ${trend.rank}. ${trend.title}`);
      });
    } else {
      console.log(`❌ Failed to fetch trends: ${trends.error}`);
    }
  } catch (error) {
    console.error("Error:", error.message);
  }

  console.log();
}

// Example 4: Different time periods comparison
async function example4_timePeriods() {
  console.log("📊 Example 4: Different Time Periods");
  console.log("─".repeat(40));

  try {
    console.log("⏳ Comparing trends across different time periods...");

    const [trends4h, trends24h, trends48h] = await Promise.all([
      googleTrendsAPI.getIndiaTrends4h(),
      googleTrendsAPI.getIndiaTrends24h(),
      googleTrendsAPI.getIndiaTrends48h(),
    ]);

    const periods = [
      { name: "Last 4 hours", data: trends4h },
      { name: "Last 24 hours", data: trends24h },
      { name: "Last 48 hours", data: trends48h },
    ];

    periods.forEach((period) => {
      if (period.data.success) {
        console.log(`⏰ ${period.name} - Top 3 trends:`);
        period.data.trends.slice(0, 3).forEach((trend) => {
          console.log(`   ${trend.rank}. ${trend.title}`);
        });
      } else {
        console.log(`⏰ ${period.name} - Failed: ${period.data.error}`);
      }
      console.log();
    });
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Example 5: Error handling
async function example5_errorHandling() {
  console.log("📊 Example 5: Error Handling");
  console.log("─".repeat(40));

  try {
    // This will demonstrate error handling
    const trends = await googleTrendsAPI.getTrends("invalid_country", 24);

    if (trends.success) {
      console.log("✅ Trends fetched successfully:");
      console.log(`   Total trends: ${trends.totalTrends}`);
    } else {
      console.log("❌ Error occurred:");
      console.log(`   Error: ${trends.error}`);
      console.log(`   Country: ${trends.country}`);
      console.log(`   Time Range: ${trends.timeRange}`);
    }
  } catch (error) {
    console.log("💥 Exception caught:");
    console.log(`   Message: ${error.message}`);
  }

  console.log();
}

// Example 6: Working with trend data
async function example6_dataProcessing() {
  console.log("📊 Example 6: Data Processing");
  console.log("─".repeat(40));

  try {
    const trends = await googleTrendsAPI.getIndiaTrends24h();

    if (trends.success) {
      // Process the data
      const trendTitles = trends.trends.map((trend) => trend.title);
      const avgTitleLength =
        trendTitles.reduce((sum, title) => sum + title.length, 0) /
        trendTitles.length;
      const longestTrend = trendTitles.reduce((longest, current) =>
        current.length > longest.length ? current : longest
      );
      const shortestTrend = trendTitles.reduce((shortest, current) =>
        current.length < shortest.length ? current : shortest
      );

      console.log("📈 Trend Analysis:");
      console.log(`   Total trends: ${trends.totalTrends}`);
      console.log(
        `   Average title length: ${avgTitleLength.toFixed(1)} characters`
      );
      console.log(`   Longest trend: "${longestTrend}"`);
      console.log(`   Shortest trend: "${shortestTrend}"`);
      console.log(
        `   Scraped at: ${new Date(trends.scrapedAt).toLocaleString()}`
      );

      // Find trends containing specific keywords
      const sportsKeywords = [
        "cricket",
        "football",
        "soccer",
        "tennis",
        "sports",
        "match",
        "game",
      ];
      const sportsRelated = trends.trends.filter((trend) =>
        sportsKeywords.some((keyword) =>
          trend.title.toLowerCase().includes(keyword.toLowerCase())
        )
      );

      if (sportsRelated.length > 0) {
        console.log("\n🏏 Sports-related trends found:");
        sportsRelated.forEach((trend) => {
          console.log(`   ${trend.rank}. ${trend.title}`);
        });
      }
    }
  } catch (error) {
    console.error("Error:", error.message);
  }

  console.log();
}

// Main function to run all examples
async function runAllExamples() {
  console.log("🚀 Google Trends API - Usage Examples");
  console.log("━".repeat(60));
  console.log(`📅 Started at: ${new Date().toLocaleString()}`);
  console.log("━".repeat(60));
  console.log();

  const examples = [
    example1_basicUsage,
    example2_parallelRequests,
    example3_genericMethod,
    example4_timePeriods,
    example5_errorHandling,
    example6_dataProcessing,
  ];

  for (let i = 0; i < examples.length; i++) {
    await examples[i]();

    // Add delay between examples to avoid rate limiting
    if (i < examples.length - 1) {
      console.log("⏳ Waiting 3 seconds before next example...\n");
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  console.log("━".repeat(60));
  console.log("✅ All examples completed!");
  console.log(`📅 Finished at: ${new Date().toLocaleString()}`);
  console.log("━".repeat(60));
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Examples interrupted by user");
  process.exit(0);
});

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples().catch((error) => {
    console.error("💥 Examples failed:", error);
    process.exit(1);
  });
}

export {
  example1_basicUsage,
  example2_parallelRequests,
  example3_genericMethod,
  example4_timePeriods,
  example5_errorHandling,
  example6_dataProcessing,
  runAllExamples,
};
