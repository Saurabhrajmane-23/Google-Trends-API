import puppeteer from "puppeteer";

class GoogleTrendsAPI {
  constructor() {
    this.browser = null;
    this.rateLimitDelay = 3000; // 3 seconds between requests
    this.maxRetries = 3;
    this.countries = {
      india: "IN",
      us: "US",
      uk: "GB",
    };
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

  // Core scraping method
  async scrapeTrends(geo, hours, limit = 25) {
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

        // Set user agent and headers
        await page.setUserAgent(
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        );

        await page.setExtraHTTPHeaders({
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        });

        await page.setViewport({ width: 1920, height: 1080 });

        const url = `https://trends.google.com/trending?geo=${geo}&hours=${hours}`;
        console.log(`Navigating to: ${url}`);

        await page.goto(url, {
          waitUntil: "networkidle0",
          timeout: 60000,
        });

        await page.waitForSelector("table", { timeout: 30000 });
        await this.delay(2000);

        // Extract trending topics
        const trends = await page.evaluate((limit) => {
          const trends = [];

          try {
            const rows = document.querySelectorAll("tr[jsname]");
            console.log(`Found ${rows.length} trend rows`);

            rows.forEach((row, index) => {
              if (trends.length >= limit) return;

              try {
                const tdElements = row.querySelectorAll("td");
                if (tdElements.length >= 2) {
                  const secondTd = tdElements[1];
                  const trendDiv = secondTd.querySelector(
                    'div[class*="mZ3RIc"]'
                  );

                  if (trendDiv) {
                    const title = trendDiv.textContent.trim();
                    if (title && title.length > 0) {
                      trends.push({
                        rank: index + 1,
                        title: title,
                        country: geo,
                        timeRange: `${hours}h`,
                        scrapedAt: new Date().toISOString(),
                      });
                    }
                  }
                }
              } catch (error) {
                console.error(`Error processing row ${index}:`, error);
              }
            });

            // Fallback selectors if no trends found
            if (trends.length === 0) {
              const alternativeSelectors = [
                "tr td:nth-child(2) div",
                "tr[data-row-id] td:nth-child(2)",
                'tr td div[class*="mZ3RIc"]',
                'tr td div:not([class*="Rz403"])',
              ];

              for (const selector of alternativeSelectors) {
                const elements = document.querySelectorAll(selector);
                elements.forEach((element, index) => {
                  if (trends.length >= limit) return;

                  const text = element.textContent.trim();
                  if (
                    text &&
                    text.length > 2 &&
                    !text.includes("ago") &&
                    !text.includes("searches")
                  ) {
                    trends.push({
                      rank: index + 1,
                      title: text,
                      country: geo,
                      timeRange: `${hours}h`,
                      scrapedAt: new Date().toISOString(),
                    });
                  }
                });
                if (trends.length > 0) break;
              }
            }
          } catch (error) {
            console.error("Error in page evaluation:", error);
          }

          return trends.slice(0, limit);
        }, limit);

        if (trends.length === 0) {
          throw new Error(
            "No trends found - page structure might have changed"
          );
        }

        console.log(`Successfully scraped ${trends.length} trends`);
        await page.close();

        const scrapingDuration = Date.now() - startTime;

        return {
          success: true,
          country: geo,
          timeRange: `${hours} hours`,
          totalTrends: trends.length,
          scrapingDuration: `${scrapingDuration}ms`,
          scrapedAt: new Date().toISOString(),
          trends: trends,
        };
      } catch (error) {
        console.error(
          `Error scraping Google Trends (attempt ${scrapingAttempts}):`,
          error.message
        );

        if (scrapingAttempts < this.maxRetries) {
          console.log(`Retrying in ${this.rateLimitDelay}ms...`);
          await this.delay(this.rateLimitDelay * scrapingAttempts);
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

  // India trends methods
  async getIndiaTrends4h() {
    try {
      return await this.scrapeTrends(this.countries.india, 4, 25);
    } catch (error) {
      return {
        success: false,
        error: error.message,
        country: "IN",
        timeRange: "4 hours",
      };
    } finally {
      await this.closeBrowser();
    }
  }

  async getIndiaTrends24h() {
    try {
      return await this.scrapeTrends(this.countries.india, 24, 25);
    } catch (error) {
      return {
        success: false,
        error: error.message,
        country: "IN",
        timeRange: "24 hours",
      };
    } finally {
      await this.closeBrowser();
    }
  }

  async getIndiaTrends48h() {
    try {
      return await this.scrapeTrends(this.countries.india, 48, 25);
    } catch (error) {
      return {
        success: false,
        error: error.message,
        country: "IN",
        timeRange: "48 hours",
      };
    } finally {
      await this.closeBrowser();
    }
  }

  async getIndiaTrends7d() {
    try {
      return await this.scrapeTrends(this.countries.india, 168, 25); // 7 days = 168 hours
    } catch (error) {
      return {
        success: false,
        error: error.message,
        country: "IN",
        timeRange: "7 days",
      };
    } finally {
      await this.closeBrowser();
    }
  }

  // US trends methods
  async getUSTrends4h() {
    try {
      return await this.scrapeTrends(this.countries.us, 4, 25);
    } catch (error) {
      return {
        success: false,
        error: error.message,
        country: "US",
        timeRange: "4 hours",
      };
    } finally {
      await this.closeBrowser();
    }
  }

  async getUSTrends24h() {
    try {
      return await this.scrapeTrends(this.countries.us, 24, 25);
    } catch (error) {
      return {
        success: false,
        error: error.message,
        country: "US",
        timeRange: "24 hours",
      };
    } finally {
      await this.closeBrowser();
    }
  }

  async getUSTrends48h() {
    try {
      return await this.scrapeTrends(this.countries.us, 48, 25);
    } catch (error) {
      return {
        success: false,
        error: error.message,
        country: "US",
        timeRange: "48 hours",
      };
    } finally {
      await this.closeBrowser();
    }
  }

  async getUSTrends7d() {
    try {
      return await this.scrapeTrends(this.countries.us, 168, 25);
    } catch (error) {
      return {
        success: false,
        error: error.message,
        country: "US",
        timeRange: "7 days",
      };
    } finally {
      await this.closeBrowser();
    }
  }

  // UK trends methods
  async getUKTrends4h() {
    try {
      return await this.scrapeTrends(this.countries.uk, 4, 25);
    } catch (error) {
      return {
        success: false,
        error: error.message,
        country: "GB",
        timeRange: "4 hours",
      };
    } finally {
      await this.closeBrowser();
    }
  }

  async getUKTrends24h() {
    try {
      return await this.scrapeTrends(this.countries.uk, 24, 25);
    } catch (error) {
      return {
        success: false,
        error: error.message,
        country: "GB",
        timeRange: "24 hours",
      };
    } finally {
      await this.closeBrowser();
    }
  }

  async getUKTrends48h() {
    try {
      return await this.scrapeTrends(this.countries.uk, 48, 25);
    } catch (error) {
      return {
        success: false,
        error: error.message,
        country: "GB",
        timeRange: "48 hours",
      };
    } finally {
      await this.closeBrowser();
    }
  }

  async getUKTrends7d() {
    try {
      return await this.scrapeTrends(this.countries.uk, 168, 25);
    } catch (error) {
      return {
        success: false,
        error: error.message,
        country: "GB",
        timeRange: "7 days",
      };
    } finally {
      await this.closeBrowser();
    }
  }

  // Generic method for custom usage
  async getTrends(country, hours, limit = 25) {
    const countryCode =
      this.countries[country.toLowerCase()] || country.toUpperCase();
    try {
      return await this.scrapeTrends(countryCode, hours, limit);
    } catch (error) {
      return {
        success: false,
        error: error.message,
        country: countryCode,
        timeRange: `${hours} hours`,
      };
    } finally {
      await this.closeBrowser();
    }
  }
}

export default GoogleTrendsAPI;
