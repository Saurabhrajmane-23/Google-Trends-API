/**
 * Utility functions for Google Trends API
 */

export class TrendsUtils {
  /**
   * Format trends data for different output formats
   */
  static formatTrends(trendsData, format = "json") {
    if (!trendsData || !trendsData.success) {
      return trendsData;
    }

    switch (format.toLowerCase()) {
      case "csv":
        return this.formatAsCSV(trendsData);
      case "text":
        return this.formatAsText(trendsData);
      case "markdown":
        return this.formatAsMarkdown(trendsData);
      default:
        return trendsData;
    }
  }

  /**
   * Convert trends data to CSV format
   */
  static formatAsCSV(trendsData) {
    const headers = "Rank,Title,Country,Time Range,Scraped At";
    const rows = trendsData.trends.map(
      (trend) =>
        `${trend.rank},"${trend.title}",${trend.country},${trend.timeRange},${trend.scrapedAt}`
    );
    return [headers, ...rows].join("\n");
  }

  /**
   * Convert trends data to plain text format
   */
  static formatAsText(trendsData) {
    const header =
      `Google Trends - ${trendsData.country} (${trendsData.timeRange})\n` +
      `Scraped at: ${new Date(trendsData.scrapedAt).toLocaleString()}\n` +
      `Total trends: ${trendsData.totalTrends}\n` +
      "─".repeat(50);

    const trends = trendsData.trends
      .map((trend) => `${trend.rank.toString().padStart(2)}. ${trend.title}`)
      .join("\n");

    return `${header}\n${trends}`;
  }

  /**
   * Convert trends data to Markdown format
   */
  static formatAsMarkdown(trendsData) {
    const header =
      `# Google Trends - ${trendsData.country}\n\n` +
      `**Time Range:** ${trendsData.timeRange}\n` +
      `**Scraped At:** ${new Date(trendsData.scrapedAt).toLocaleString()}\n` +
      `**Total Trends:** ${trendsData.totalTrends}\n\n`;

    const table =
      "| Rank | Trend Title |\n|------|-------------|\n" +
      trendsData.trends
        .map((trend) => `| ${trend.rank} | ${trend.title} |`)
        .join("\n");

    return header + table;
  }

  /**
   * Filter trends by keywords
   */
  static filterByKeywords(trendsData, keywords, caseSensitive = false) {
    if (!trendsData || !trendsData.success || !Array.isArray(keywords)) {
      return trendsData;
    }

    const filteredTrends = trendsData.trends.filter((trend) => {
      const title = caseSensitive ? trend.title : trend.title.toLowerCase();
      return keywords.some((keyword) => {
        const searchKeyword = caseSensitive ? keyword : keyword.toLowerCase();
        return title.includes(searchKeyword);
      });
    });

    return {
      ...trendsData,
      trends: filteredTrends,
      totalTrends: filteredTrends.length,
      filtered: true,
      filterKeywords: keywords,
    };
  }

  /**
   * Group trends by categories based on keywords
   */
  static categorizeByKeywords(trendsData, categories) {
    if (!trendsData || !trendsData.success) {
      return trendsData;
    }

    const categorized = {
      ...trendsData,
      categories: {},
      uncategorized: [],
    };

    // Initialize categories
    Object.keys(categories).forEach((category) => {
      categorized.categories[category] = [];
    });

    // Categorize trends
    trendsData.trends.forEach((trend) => {
      let categorized_trend = false;

      for (const [category, keywords] of Object.entries(categories)) {
        if (
          keywords.some((keyword) =>
            trend.title.toLowerCase().includes(keyword.toLowerCase())
          )
        ) {
          categorized.categories[category].push(trend);
          categorized_trend = true;
          break;
        }
      }

      if (!categorized_trend) {
        categorized.uncategorized.push(trend);
      }
    });

    return categorized;
  }

  /**
   * Get trends statistics
   */
  static getStatistics(trendsData) {
    if (!trendsData || !trendsData.success) {
      return null;
    }

    const titles = trendsData.trends.map((trend) => trend.title);
    const titleLengths = titles.map((title) => title.length);

    return {
      totalTrends: trendsData.totalTrends,
      averageTitleLength:
        titleLengths.reduce((sum, len) => sum + len, 0) / titleLengths.length,
      shortestTitle: titles.reduce((shortest, current) =>
        current.length < shortest.length ? current : shortest
      ),
      longestTitle: titles.reduce((longest, current) =>
        current.length > longest.length ? current : longest
      ),
      uniqueWords: this.getUniqueWords(titles),
      scrapingDuration: trendsData.scrapingDuration,
      country: trendsData.country,
      timeRange: trendsData.timeRange,
    };
  }

  /**
   * Extract unique words from trend titles
   */
  static getUniqueWords(titles) {
    const allWords = titles
      .join(" ")
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 2);

    const wordCount = {};
    allWords.forEach((word) => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    return Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));
  }

  /**
   * Compare trends between different time periods or countries
   */
  static compareTrends(trendsData1, trendsData2) {
    if (!trendsData1?.success || !trendsData2?.success) {
      return null;
    }

    const titles1 = new Set(trendsData1.trends.map((trend) => trend.title));
    const titles2 = new Set(trendsData2.trends.map((trend) => trend.title));

    const common = [...titles1].filter((title) => titles2.has(title));
    const unique1 = [...titles1].filter((title) => !titles2.has(title));
    const unique2 = [...titles2].filter((title) => !titles1.has(title));

    return {
      dataset1: {
        country: trendsData1.country,
        timeRange: trendsData1.timeRange,
        totalTrends: trendsData1.totalTrends,
      },
      dataset2: {
        country: trendsData2.country,
        timeRange: trendsData2.timeRange,
        totalTrends: trendsData2.totalTrends,
      },
      commonTrends: common,
      uniqueToDataset1: unique1,
      uniqueToDataset2: unique2,
      similarity: (common.length / Math.max(titles1.size, titles2.size)) * 100,
    };
  }
  /**
   * Export trends data to file
   */
  static async exportToFile(trendsData, filename, format = "json") {
    const fs = await import("fs");

    let content;
    let extension;

    switch (format.toLowerCase()) {
      case "csv":
        content = this.formatAsCSV(trendsData);
        extension = "csv";
        break;
      case "text":
        content = this.formatAsText(trendsData);
        extension = "txt";
        break;
      case "markdown":
        content = this.formatAsMarkdown(trendsData);
        extension = "md";
        break;
      default:
        content = JSON.stringify(trendsData, null, 2);
        extension = "json";
    }

    const fullFilename = `${filename}.${extension}`;
    fs.writeFileSync(fullFilename, content, "utf8");

    return {
      success: true,
      filename: fullFilename,
      size: content.length,
      format: extension,
    };
  }

  /**
   * Validate trends data structure
   */
  static validateTrendsData(trendsData) {
    const errors = [];

    if (!trendsData) {
      errors.push("Trends data is null or undefined");
      return { valid: false, errors };
    }

    if (typeof trendsData.success !== "boolean") {
      errors.push("Missing or invalid success field");
    }

    if (trendsData.success) {
      if (!trendsData.country) {
        errors.push("Missing country field");
      }

      if (!trendsData.timeRange) {
        errors.push("Missing timeRange field");
      }

      if (!Array.isArray(trendsData.trends)) {
        errors.push("Trends field is not an array");
      } else {
        trendsData.trends.forEach((trend, index) => {
          if (!trend.title) {
            errors.push(`Trend ${index} missing title`);
          }
          if (typeof trend.rank !== "number") {
            errors.push(`Trend ${index} missing or invalid rank`);
          }
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export default TrendsUtils;
