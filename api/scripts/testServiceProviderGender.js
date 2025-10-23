#!/usr/bin/env node
// Simple test script to GET /api/service-provider?gender=<gender>
// Usage: node scripts/testServiceProviderGender.js female

const http = require("http");
const https = require("https");

const gender = process.argv[2] || "female";

const tryUrls = [
  `http://localhost:5000/api/service-provider?gender=${encodeURIComponent(
    gender
  )}`,
  `http://127.0.0.1:5000/api/service-provider?gender=${encodeURIComponent(
    gender
  )}`,
];

async function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    const req = lib.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () =>
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        })
      );
    });
    req.on("error", (err) => reject(err));
    req.setTimeout(5000, () => {
      req.abort();
      reject(new Error("Request timed out"));
    });
  });
}

(async () => {
  for (const url of tryUrls) {
    try {
      console.log("Trying", url);
      const res = await fetchUrl(url);
      console.log("Status:", res.statusCode);
      try {
        const parsed = JSON.parse(res.body);
        console.log("JSON response:", JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log("Raw response:", res.body);
      }
      return;
    } catch (err) {
      console.warn("Failed to fetch", url, "-", err.message);
    }
  }
  console.error(
    "All attempts failed. Ensure the API server is running on port 5000 and accessible from this machine."
  );
  process.exit(1);
})();
