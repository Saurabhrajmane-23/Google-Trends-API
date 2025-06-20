# Google Trends LiteLo V 1.0.0

A lightweight Node.js package for scraping Google Trends data from India, US and UK using Puppeteer. This package provides easy-to-use methods to get trending topics for different time periods. More data will be made accessible with upcoming versions.

## Features

- 🌍 Support for 3 countries: India, US, UK
- ⏰ Multiple time ranges: 4 hours, 24 hours, 48 hours, 7 days
- 📊 Top 25 trending topics
- 🔄 Built-in retry mechanism and rate limiting
- 📦 Simple JSON response format
- 🚀 Easy to integrate into any Node.js project

## Installation

```bash
npm install google-trends-litelo
```

## Quick Start

```javascript
import { googleTrendsAPI } from "google-trends-LiteLo";

// Get India trends for last 24 hours
const indiaTrends = await googleTrendsAPI.getIndiaTrends24h();
console.log(indiaTrends);

// Get US trends for last 4 hours
const usTrends = await googleTrendsAPI.getUSTrends4h();
console.log(usTrends);

// Get UK trends for last 7 days
const ukTrends = await googleTrendsAPI.getUKTrends7d();
console.log(ukTrends);
```

## API Reference

### Available Methods

#### India Trends

- `getIndiaTrends4h()` - Get top 25 trends from India for last 4 hours
- `getIndiaTrends24h()` - Get top 25 trends from India for last 24 hours
- `getIndiaTrends48h()` - Get top 25 trends from India for last 48 hours
- `getIndiaTrends7d()` - Get top 25 trends from India for last 7 days

#### US Trends

- `getUSTrends4h()` - Get top 25 trends from US for last 4 hours
- `getUSTrends24h()` - Get top 25 trends from US for last 24 hours
- `getUSTrends48h()` - Get top 25 trends from US for last 48 hours
- `getUSTrends7d()` - Get top 25 trends from US for last 7 days

#### UK Trends

- `getUKTrends4h()` - Get top 25 trends from UK for last 4 hours
- `getUKTrends24h()` - Get top 25 trends from UK for last 24 hours
- `getUKTrends48h()` - Get top 25 trends from UK for last 48 hours
- `getUKTrends7d()` - Get top 25 trends from UK for last 7 days

#### Generic Method

- `getTrends(country, hours, limit)` - Get trends for any supported country and time period

### Response Format

```javascript
{
  "success": true,
  "country": "IN",
  "timeRange": "24 hours",
  "totalTrends": 25,
  "scrapingDuration": "5432ms",
  "scrapedAt": "2025-06-20T10:30:00.000Z",
  "trends": [
    {
      "rank": 1,
      "title": "Trending Topic Name",
      "country": "IN",
      "timeRange": "24h",
      "scrapedAt": "2025-06-20T10:30:00.000Z"
    },
    // ... more trends
  ]
}
```

### Error Response

```javascript
{
  "success": false,
  "error": "Error message",
  "country": "IN",
  "timeRange": "24 hours"
}
```

## Usage Examples

### Basic Usage

```javascript
import { googleTrendsAPI } from "google-trends-LiteLo";

async function getTrendingTopics() {
  try {
    // Get trending topics from different countries
    const [india, us, uk] = await Promise.all([
      googleTrendsAPI.getIndiaTrends24h(),
      googleTrendsAPI.getUSTrends24h(),
      googleTrendsAPI.getUKTrends24h(),
    ]);

    console.log("India Trends:", india.trends.slice(0, 5));
    console.log("US Trends:", us.trends.slice(0, 5));
    console.log("UK Trends:", uk.trends.slice(0, 5));
  } catch (error) {
    console.error("Error fetching trends:", error);
  }
}

getTrendingTopics();
```

### Class-based Usage

```javascript
import GoogleTrendsAPI from "google-trends-LiteLo";

const trendsAPI = new GoogleTrendsAPI();

async function fetchTrends() {
  try {
    const trends = await trendsAPI.getIndiaTrends4h();
    console.log(trends);
  } catch (error) {
    console.error("Error:", error);
  }
}

fetchTrends();
```

## Requirements

- Node.js >= 16.0.0
- Chrome/Chromium browser

## Supported Countries

- **India**: `IN`
- **United States**: `US`
- **United Kingdom**: `GB`

## Time Periods

- **4 hours**: Recent trending topics
- **24 hours**: Daily trending topics
- **48 hours**: 2-day trending topics
- **7 days**: Weekly trending topics

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Start development mode
npm run dev
```

## Testing

Run the test file to verify the package works correctly:

```bash
npm test
```

This will test all methods and display sample results.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Disclaimer

This package scrapes publicly available data from Google Trends. Please use responsibly and in accordance with Google's Terms of Service. The package includes rate limiting to be respectful of Google's servers.

## Support

If you encounter any issues or have questions, contant me via my email.

Email - iamsaurabhrajmane@gmail.com
