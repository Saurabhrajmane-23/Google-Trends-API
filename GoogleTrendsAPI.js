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

        // Wait for the trending content to load
        console.log("Waiting for table to load...");
        await page.waitForSelector("table", { timeout: 30000 });

        // Additional wait for dynamic content and JavaScript to execute
        await this.delay(5000);

        // Try to wait for specific trend content
        try {
          await page.waitForSelector('tbody[jsname="cC57zf"]', {
            timeout: 10000,
          });
          console.log("Found tbody with trends data");
        } catch (e) {
          console.log("tbody not found, trying alternative selectors");
          try {
            await page.waitForSelector("tr[jsname]", { timeout: 10000 });
            console.log("Found tr elements with jsname");
          } catch (e2) {
            console.log("No tr elements with jsname found");
          }
        }

        // Extract trending topics with detailed debugging
        const result = await page.evaluate(
          (limit, geo, hours) => {
            const trends = [];
            const debugInfo = [];

            try {
              debugInfo.push("Starting page evaluation...");

              // First, let's try to find the table body
              const tbody = document.querySelector('tbody[jsname="cC57zf"]');
              if (tbody) {
                debugInfo.push('Found tbody with jsname="cC57zf"');
                const rows = tbody.querySelectorAll("tr[jsname]");
                debugInfo.push(`Found ${rows.length} trend rows in tbody`);

                rows.forEach((row, index) => {
                  if (trends.length >= limit) return;

                  try {
                    // Look for the trend content in the second td
                    const tds = row.querySelectorAll("td");
                    debugInfo.push(
                      `Row ${index}: Found ${tds.length} td elements`
                    );

                    if (tds.length >= 2) {
                      const secondTd = tds[1];
                      debugInfo.push(`Row ${index}: Processing second td`);

                      // Try multiple selectors for the trend text
                      let trendText = null;

                      // Try div with class containing "mZ3RIc"
                      const mZ3RIcDiv = secondTd.querySelector(
                        'div[class*="mZ3RIc"]'
                      );
                      if (mZ3RIcDiv) {
                        trendText = mZ3RIcDiv.textContent.trim();
                        debugInfo.push(
                          `Row ${index}: Found mZ3RIc div with text: "${trendText}"`
                        );
                      }

                      // Fallback: try any div that's not a metadata div
                      if (!trendText) {
                        const divs = secondTd.querySelectorAll("div");
                        debugInfo.push(
                          `Row ${index}: Fallback - found ${divs.length} divs in second td`
                        );

                        for (let i = 0; i < divs.length; i++) {
                          const div = divs[i];
                          const text = div.textContent.trim();
                          debugInfo.push(
                            `Row ${index}, Div ${i}: "${text}" (classes: "${div.className}")`
                          );

                          // Skip divs that contain metadata like "ago" or "searches"
                          if (
                            text &&
                            text.length > 2 &&
                            !text.includes("ago") &&
                            !text.includes("searches") &&
                            !text.includes("24h") &&
                            !text.includes("48h") &&
                            !text.includes("7d") &&
                            !div.classList.contains("Rz403")
                          ) {
                            trendText = text;
                            debugInfo.push(
                              `Row ${index}: Selected trend text: "${trendText}"`
                            );
                            break;
                          }
                        }
                      }

                      if (trendText && trendText.length > 0) {
                        trends.push({
                          rank: index + 1,
                          title: trendText,
                          country: geo,
                          timeRange: `${hours}h`,
                          scrapedAt: new Date().toISOString(),
                        });
                        debugInfo.push(
                          `Successfully added trend ${index + 1}: ${trendText}`
                        );
                      } else {
                        debugInfo.push(
                          `Row ${index}: No valid trend text found`
                        );
                      }
                    }
                  } catch (error) {
                    debugInfo.push(
                      `Error processing row ${index}: ${error.message}`
                    );
                  }
                });
              } else {
                debugInfo.push('tbody with jsname="cC57zf" not found');
              }

              // Fallback: try alternative methods if tbody approach didn't work
              if (trends.length === 0) {
                debugInfo.push("Trying alternative selectors...");

                // Try direct table row selectors
                const alternativeSelectors = [
                  'table tr[jsname] td:nth-child(2) div[class*="mZ3RIc"]',
                  'table tr[jsname] td:nth-child(2) div:not([class*="Rz403"])',
                  "tr[jsname] td:nth-child(2) div",
                  'table tr td div[class*="mZ3RIc"]',
                  "tbody tr td:nth-child(2) div",
                ];

                for (const selector of alternativeSelectors) {
                  const elements = document.querySelectorAll(selector);
                  debugInfo.push(
                    `Selector "${selector}" found ${elements.length} elements`
                  );

                  elements.forEach((element, index) => {
                    if (trends.length >= limit) return;

                    const text = element.textContent.trim();
                    debugInfo.push(
                      `Alternative selector element ${index}: "${text}"`
                    );

                    if (
                      text &&
                      text.length > 2 &&
                      !text.includes("ago") &&
                      !text.includes("searches") &&
                      !text.includes("24h") &&
                      !text.includes("48h") &&
                      !text.includes("7d")
                    ) {
                      trends.push({
                        rank: trends.length + 1,
                        title: text,
                        country: geo,
                        timeRange: `${hours}h`,
                        scrapedAt: new Date().toISOString(),
                      });
                      debugInfo.push(`Alternative method found trend: ${text}`);
                    }
                  });

                  if (trends.length > 0) {
                    debugInfo.push(
                      `Successfully found ${trends.length} trends using selector: ${selector}`
                    );
                    break;
                  }
                }
              }

              // Debug: log page structure if still no trends found
              if (trends.length === 0) {
                debugInfo.push("No trends found, debugging page structure...");

                // Log table structure
                const tables = document.querySelectorAll("table");
                debugInfo.push(`Found ${tables.length} tables`);

                tables.forEach((table, tableIndex) => {
                  if (tableIndex < 2) {
                    // Only check first 2 tables
                    const rows = table.querySelectorAll("tr");
                    debugInfo.push(`Table ${tableIndex}: ${rows.length} rows`);

                    rows.forEach((row, rowIndex) => {
                      if (rowIndex < 3) {
                        // Log first 3 rows
                        const tds = row.querySelectorAll("td");
                        debugInfo.push(`  Row ${rowIndex}: ${tds.length} tds`);

                        tds.forEach((td, tdIndex) => {
                          if (tdIndex === 1) {
                            // Focus on second td
                            const divs = td.querySelectorAll("div");
                            debugInfo.push(
                              `    TD ${tdIndex}: ${divs.length} divs`
                            );

                            divs.forEach((div, divIndex) => {
                              if (divIndex < 5) {
                                // Only log first 5 divs
                                const text = div.textContent.trim();
                                if (text && text.length > 0) {
                                  debugInfo.push(
                                    `      Div ${divIndex}: "${text}" (classes: ${div.className})`
                                  );
                                }
                              }
                            });
                          }
                        });
                      }
                    });
                  }
                });
              }
            } catch (error) {
              debugInfo.push(`Error in page evaluation: ${error.message}`);
            }

            return {
              trends: trends.slice(0, limit),
              debugInfo: debugInfo,
            };
          },
          limit,
          geo,
          hours
        );

        // Log debug information
        result.debugInfo.forEach((info) => console.log(`[PAGE DEBUG] ${info}`));

        const trends = result.trends;

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
