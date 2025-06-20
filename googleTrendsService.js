import puppeteer from "puppeteer";
import { GoogleTrend } from "../models/googleTrend.model.js";
import { categorizeEvent, extractTags } from "../utils/eventUtils.js";

class GoogleTrendsService {
  constructor() {
    this.browser = null;
    this.rateLimitDelay = 3000; // 3 seconds between requests to avoid rate limiting
    this.maxRetries = 3;
  }

  // Initialize browser
  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: "new",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
          "--disable-blink-features=AutomationControlled",
          "--disable-extensions",
        ],
      });
    }
    return this.browser;
  }

  // Close browser
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // Rate limiting delay
  async delay(ms = this.rateLimitDelay) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Scrape Google Trends data
  async scrapeGoogleTrends(geo = "IN", hours = 24) {
    const startTime = Date.now();
    let scrapingAttempts = 0;

    while (scrapingAttempts < this.maxRetries) {
      const browser = await this.initBrowser();
      const page = await browser.newPage();

      try {
        scrapingAttempts++;
        console.log(
          `Scraping Google Trends for ${geo} (${hours}h) - Attempt ${scrapingAttempts}`
        );

        // Set user agent and headers to mimic real browser
        await page.setUserAgent(
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        );

        await page.setExtraHTTPHeaders({
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        });

        // Set viewport
        await page.setViewport({ width: 1920, height: 1080 });

        const url = `https://trends.google.com/trending?geo=${geo}&hours=${hours}`;
        console.log(`Navigating to: ${url}`);

        // Navigate to page with extended timeout
        await page.goto(url, {
          waitUntil: "networkidle0",
          timeout: 60000,
        });

        // Wait for the trending content to load
        await page.waitForSelector("table", { timeout: 30000 });
        await this.delay(2000); // Additional wait for dynamic content

        // Extract trending topics based on the HTML structure you provided
        const trends = await page.evaluate(() => {
          const trends = [];

          try {
            // Look for table rows
            const rows = document.querySelectorAll("tr[jsname]");

            console.log(`Found ${rows.length} trend rows`);

            rows.forEach((row, index) => {
              try {
                // Get all td elements in the row
                const tdElements = row.querySelectorAll("td");

                // According to your image, the trending topic is in the second td
                if (tdElements.length >= 2) {
                  const secondTd = tdElements[1];

                  // Look for the div containing the trend text
                  const trendDiv = secondTd.querySelector(
                    'div[class*="mZ3RIc"]'
                  );

                  if (trendDiv) {
                    const title = trendDiv.textContent.trim();

                    if (title && title.length > 0) {
                      trends.push({
                        title: title,
                        rank: index,
                        rawHtml: secondTd.innerHTML, // For debugging
                      });
                    }
                  }
                }
              } catch (error) {
                console.error(`Error processing row ${index}:`, error);
              }
            });

            // Fallback: try alternative selectors if no trends found
            if (trends.length === 0) {
              console.log("Trying alternative selectors...");

              // Try finding trends in different ways
              const alternativeSelectors = [
                "tr td:nth-child(2) div",
                "tr[data-row-id] td:nth-child(2)",
                'tr td div[class*="mZ3RIc"]',
                'tr td div:not([class*="Rz403"])',
              ];

              for (const selector of alternativeSelectors) {
                const elements = document.querySelectorAll(selector);
                console.log(
                  `Selector "${selector}" found ${elements.length} elements`
                );

                elements.forEach((element, index) => {
                  const text = element.textContent.trim();
                  if (
                    text &&
                    text.length > 2 &&
                    !text.includes("ago") &&
                    !text.includes("searches")
                  ) {
                    trends.push({
                      title: text,
                      rank: index + 1,
                      selector: selector,
                    });
                  }
                });

                if (trends.length > 0) break;
              }
            }
          } catch (error) {
            console.error("Error in page evaluation:", error);
          }

          return trends.slice(0, 50); // Limit to top 50
        });

        if (trends.length === 0) {
          throw new Error(
            "No trends found - page structure might have changed"
          );
        }

        console.log(`Successfully scraped ${trends.length} trends`);

        const scrapingDuration = Date.now() - startTime;
        const userAgent = await page.evaluate(() => navigator.userAgent);

        await page.close();

        // Process and categorize trends
        const processedTrends = trends.map((trend, index) => ({
          ...trend,
          geo,
          timeRange: `${hours}h`,
          scrapedAt: new Date(),
          category: categorizeEvent(trend.title),
          tags: extractTags(trend.title),
          trendingScore: Math.max(0, 100 - index * 2),
          source: "google-trends",
          metadata: {
            scrapingDuration,
            userAgent,
            pageUrl: url,
          },
        }));

        return processedTrends;
      } catch (error) {
        console.error(
          `Error scraping Google Trends (attempt ${scrapingAttempts}):`,
          error.message
        );

        if (scrapingAttempts < this.maxRetries) {
          console.log(`Retrying in ${this.rateLimitDelay}ms...`);
          await this.delay(this.rateLimitDelay * scrapingAttempts); // Exponential backoff
        } else {
          throw new Error(
            `Failed to scrape Google Trends after ${this.maxRetries} attempts: ${error.message}`
          );
        }
      } finally {
        if (page && !page.isClosed()) {
          await page.close();
        }
      }
    }
  }

  // Save trends to database
  async saveTrends(trends) {
    try {
      const savedTrends = [];
      const errors = [];

      for (const trendData of trends) {
        try {
          // Check if trend already exists (same title, geo, and recent time)
          const existingTrend = await GoogleTrend.findOne({
            title: trendData.title,
            geo: trendData.geo,
            scrapedAt: {
              $gte: new Date(Date.now() - 2 * 60 * 60 * 1000), // Within last 2 hours
            },
          });

          if (existingTrend) {
            // Update existing trend
            Object.assign(existingTrend, trendData);
            const savedTrend = await existingTrend.save();
            savedTrends.push(savedTrend);
          } else {
            // Create new trend
            const newTrend = new GoogleTrend(trendData);
            const savedTrend = await newTrend.save();
            savedTrends.push(savedTrend);
          }
        } catch (error) {
          console.error(`Error saving trend "${trendData.title}":`, error);
          errors.push({
            trend: trendData.title,
            error: error.message,
          });
        }
      }

      return {
        success: true,
        saved: savedTrends.length,
        errors: errors.length,
        trends: savedTrends,
        errorDetails: errors,
      };
    } catch (error) {
      console.error("Error in saveTrends:", error);
      return {
        success: false,
        error: error.message,
        saved: 0,
        errors: trends.length,
      };
    }
  }

  // Update Google Trends for current period
  async updateGoogleTrends(geo = "IN", hours = 24) {
    try {
      console.log(`Starting Google Trends update for ${geo} (${hours}h)`);

      const trends = await this.scrapeGoogleTrends(geo, hours);

      if (!trends || trends.length === 0) {
        return {
          success: false,
          message: "No trends found",
          totalFound: 0,
          saved: 0,
          errors: 1,
        };
      }

      const result = await this.saveTrends(trends);

      console.log(
        `Google Trends update completed: ${result.saved} saved, ${result.errors} errors`
      );

      return {
        success: result.success,
        message: `Google Trends update completed for ${geo}`,
        totalFound: trends.length,
        saved: result.saved,
        errors: result.errors,
        errorDetails: result.errorDetails,
      };
    } catch (error) {
      console.error("Error in updateGoogleTrends:", error);
      return {
        success: false,
        message: error.message,
        totalFound: 0,
        saved: 0,
        errors: 1,
      };
    } finally {
      await this.closeBrowser();
    }
  }

  // Get trends with filters
  async getTrends(filters = {}) {
    try {
      const {
        geo = "IN",
        category,
        timeRange,
        limit = 50,
        page = 1,
        sortBy = "rank",
        sortOrder = "asc",
        hoursAgo = 24,
      } = filters;

      // Build query
      const query = { geo, isActive: true };

      if (category) query.category = category;
      if (timeRange) query.timeRange = timeRange;

      // Filter by time
      if (hoursAgo) {
        query.scrapedAt = {
          $gte: new Date(Date.now() - hoursAgo * 60 * 60 * 1000),
        };
      }

      // Build sort options
      const sortOptions = {};
      if (sortBy === "rank") {
        sortOptions.rank = sortOrder === "desc" ? -1 : 1;
        sortOptions.scrapedAt = -1; // Secondary sort by most recent
      } else if (sortBy === "trendingScore") {
        sortOptions.trendingScore = sortOrder === "desc" ? -1 : 1;
      } else if (sortBy === "scrapedAt") {
        sortOptions.scrapedAt = sortOrder === "desc" ? -1 : 1;
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query
      const trends = await GoogleTrend.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean();

      // Get total count for pagination
      const total = await GoogleTrend.countDocuments(query);

      return {
        success: true,
        trends,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("Error in getTrends:", error);
      return {
        success: false,
        message: error.message,
        trends: [],
      };
    }
  }

  // Clean old trends (older than 7 days)
  async cleanOldTrends(daysToKeep = 7) {
    try {
      const cutoffDate = new Date(
        Date.now() - daysToKeep * 24 * 60 * 60 * 1000
      );

      const result = await GoogleTrend.deleteMany({
        scrapedAt: { $lt: cutoffDate },
      });

      console.log(`Cleaned ${result.deletedCount} old Google Trends records`);
      return result.deletedCount;
    } catch (error) {
      console.error("Error cleaning old trends:", error);
      return 0;
    }
  }

  // Get trending statistics
  async getTrendingStats(geo = "IN") {
    try {
      const stats = await GoogleTrend.aggregate([
        {
          $match: {
            geo,
            isActive: true,
            scrapedAt: {
              $gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        },
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
            avgTrendingScore: { $avg: "$trendingScore" },
            topTrend: { $first: "$title" },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]);

      const totalTrends = await GoogleTrend.countDocuments({
        geo,
        isActive: true,
        scrapedAt: {
          $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      });

      return {
        success: true,
        stats: {
          total: totalTrends,
          byCategory: stats,
          lastUpdated: new Date(),
        },
      };
    } catch (error) {
      console.error("Error getting trending stats:", error);
      return {
        success: false,
        message: error.message,
      };
    }
  }
}

export default new GoogleTrendsService();
