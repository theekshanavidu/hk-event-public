require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_API_URL = (process.env.API_URL || "http://localhost:5000").replace(/\/+$/, "");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets
app.use("/assets", express.static(path.join(__dirname, "public", "assets")));
app.use("/logo.png", express.static(path.join(__dirname, "public", "logo.png")));
app.use("/sahan.png", express.static(path.join(__dirname, "public", "sahan.png")));

// ===================================================================
// API REVERSE PROXY TO ADMIN BACKEND
// (Forwards /api requests to the Admin API server seamlessly)
// ===================================================================
app.all("/api/*", async (req, res) => {
  try {
    const targetUrl = `${ADMIN_API_URL}${req.originalUrl}`;
    const options = {
      method: req.method,
      headers: {
        ...req.headers,
        host: new URL(ADMIN_API_URL).host
      }
    };

    if (["POST", "PUT", "PATCH"].includes(req.method)) {
      options.body = JSON.stringify(req.body);
      options.headers["content-type"] = "application/json";
    }

    const response = await fetch(targetUrl, options);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.warn(`[Proxy Notice] Could not connect to Admin API at ${ADMIN_API_URL}: ${err.message}`);
    res.status(502).json({
      success: false,
      error: "Admin API Backend is not reachable. Check API_URL in .env."
    });
  }
});

// ===================================================================
// CLEAN PUBLIC ROUTES (NO .HTML IN URLS)
// ===================================================================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "about.html"));
});

app.get("/projects", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "projects.html"));
});

app.get("/project", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "project.html"));
});

app.get("/project/:slug", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "project.html"));
});

app.get("/contact", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "contact.html"));
});

// 404 Fallback
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "public", "404.html"));
});

app.listen(PORT, () => {
  console.log("=================================================");
  console.log(`HK Event Management — Public Client Website`);
  console.log(`Live at: http://localhost:${PORT}`);
  console.log(`Connected Admin API: ${ADMIN_API_URL}`);
  console.log("=================================================");
});
