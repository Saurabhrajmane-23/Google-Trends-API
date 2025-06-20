import express from "express";
import { googleTrendsAPI } from "./index.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Enable CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    name: "Google Trends API",
    version: "1.0.0",
    description: "API for scraping Google Trends data from India, US, and UK",
    endpoints: {
      india: {
        "4h": "/api/trends/india/4h",
        "24h": "/api/trends/india/24h",
        "48h": "/api/trends/india/48h",
        "7d": "/api/trends/india/7d",
      },
      us: {
        "4h": "/api/trends/us/4h",
        "24h": "/api/trends/us/24h",
        "48h": "/api/trends/us/48h",
        "7d": "/api/trends/us/7d",
      },
      uk: {
        "4h": "/api/trends/uk/4h",
        "24h": "/api/trends/uk/24h",
        "48h": "/api/trends/uk/48h",
        "7d": "/api/trends/uk/7d",
      },
      generic: "/api/trends/:country/:hours",
    },
  });
});

// India endpoints
app.get("/api/trends/india/4h", async (req, res) => {
  try {
    const trends = await googleTrendsAPI.getIndiaTrends4h();
    res.json(trends);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/trends/india/24h", async (req, res) => {
  try {
    const trends = await googleTrendsAPI.getIndiaTrends24h();
    res.json(trends);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/trends/india/48h", async (req, res) => {
  try {
    const trends = await googleTrendsAPI.getIndiaTrends48h();
    res.json(trends);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/trends/india/7d", async (req, res) => {
  try {
    const trends = await googleTrendsAPI.getIndiaTrends7d();
    res.json(trends);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// US endpoints
app.get("/api/trends/us/4h", async (req, res) => {
  try {
    const trends = await googleTrendsAPI.getUSTrends4h();
    res.json(trends);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/trends/us/24h", async (req, res) => {
  try {
    const trends = await googleTrendsAPI.getUSTrends24h();
    res.json(trends);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/trends/us/48h", async (req, res) => {
  try {
    const trends = await googleTrendsAPI.getUSTrends48h();
    res.json(trends);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/trends/us/7d", async (req, res) => {
  try {
    const trends = await googleTrendsAPI.getUSTrends7d();
    res.json(trends);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// UK endpoints
app.get("/api/trends/uk/4h", async (req, res) => {
  try {
    const trends = await googleTrendsAPI.getUKTrends4h();
    res.json(trends);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/trends/uk/24h", async (req, res) => {
  try {
    const trends = await googleTrendsAPI.getUKTrends24h();
    res.json(trends);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/trends/uk/48h", async (req, res) => {
  try {
    const trends = await googleTrendsAPI.getUKTrends48h();
    res.json(trends);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/trends/uk/7d", async (req, res) => {
  try {
    const trends = await googleTrendsAPI.getUKTrends7d();
    res.json(trends);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generic endpoint
app.get("/api/trends/:country/:hours", async (req, res) => {
  try {
    const { country, hours } = req.params;
    const limit = parseInt(req.query.limit) || 25;

    // Validate country
    const validCountries = ["india", "us", "uk"];
    if (!validCountries.includes(country.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid country. Supported countries: ${validCountries.join(
          ", "
        )}`,
      });
    }

    // Convert time periods to hours
    const timeMap = {
      "4h": 4,
      "24h": 24,
      "48h": 48,
      "7d": 168,
    };

    const hoursNum = timeMap[hours] || parseInt(hours);
    if (!hoursNum || hoursNum < 1) {
      return res.status(400).json({
        success: false,
        error:
          "Invalid time period. Supported: 4h, 24h, 48h, 7d or number of hours",
      });
    }

    const trends = await googleTrendsAPI.getTrends(country, hoursNum, limit);
    res.json(trends);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Server error:", error);
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
  });
});

app.listen(PORT, () => {
  console.log(
    `🚀 Google Trends API Server running on http://localhost:${PORT}`
  );
  console.log(`📊 Available endpoints:`);
  console.log(`   Health check: http://localhost:${PORT}/`);
  console.log(`   India trends: http://localhost:${PORT}/api/trends/india/24h`);
  console.log(`   US trends: http://localhost:${PORT}/api/trends/us/24h`);
  console.log(`   UK trends: http://localhost:${PORT}/api/trends/uk/24h`);
  console.log(`   Generic: http://localhost:${PORT}/api/trends/india/4h`);
});

export default app;
