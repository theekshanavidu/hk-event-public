// ===================================================================
// CLOUDFLARE WORKER: HK EVENT MANAGEMENT PUBLIC SITE & EDGE API
// Zero-Server Cloudflare Edge Architecture (Cloudflare Workers & Assets)
// ===================================================================

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json"
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS_HEADERS
  });
}

function cleanFirestoreDoc(doc) {
  if (!doc || !doc.fields) return { id: doc.name?.split("/").pop() };
  const obj = { id: doc.name.split("/").pop() };
  for (const [k, v] of Object.entries(doc.fields)) {
    if (v.stringValue !== undefined) obj[k] = v.stringValue;
    else if (v.booleanValue !== undefined) obj[k] = v.booleanValue;
    else if (v.integerValue !== undefined) obj[k] = parseInt(v.integerValue, 10);
    else if (v.doubleValue !== undefined) obj[k] = parseFloat(v.doubleValue);
    else if (v.timestampValue !== undefined) obj[k] = v.timestampValue;
    else if (v.arrayValue !== undefined) {
      obj[k] = (v.arrayValue.values || []).map(item => {
        if (item.mapValue) return cleanFirestoreDoc(item.mapValue);
        return item.stringValue || item;
      });
    } else if (v.mapValue !== undefined) {
      obj[k] = cleanFirestoreDoc(v.mapValue);
    }
  }
  return obj;
}

function toFirestoreFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k === "id") continue;
    if (typeof v === "string") fields[k] = { stringValue: v };
    else if (typeof v === "boolean") fields[k] = { booleanValue: v };
    else if (typeof v === "number") fields[k] = { doubleValue: v };
    else if (Array.isArray(v)) {
      fields[k] = {
        arrayValue: {
          values: v.map(item => {
            if (typeof item === "object" && item !== null) {
              return { mapValue: { fields: toFirestoreFields(item) } };
            }
            return { stringValue: String(item) };
          })
        }
      };
    } else if (typeof v === "object" && v !== null) {
      fields[k] = { mapValue: { fields: toFirestoreFields(v) } };
    }
  }
  return fields;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    const method = request.method;

    // 1. CORS Preflight
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // 2. API Routes
    if (path.startsWith("/api")) {
      const projectId = (env && env.FIREBASE_PROJECT_ID) || "hkevent-522e9";
      const apiKey = (env && env.FIREBASE_API_KEY) || "AIzaSyBIyOSZmWlDzgGODjZik44cf-I5e3hxYT0";
      const firestoreBase = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

      try {
        // GET /api/projects
        if (path === "/api/projects" && method === "GET") {
          const res = await fetch(`${firestoreBase}/projects?key=${apiKey}`);
          let projects = [];
          if (res.ok) {
            const data = await res.json();
            projects = (data.documents || []).map(cleanFirestoreDoc);
          }
          // Only show published projects on public site
          projects = projects.filter(p => p.status === "published");
          return jsonResponse({ success: true, projects });
        }

        // GET /api/projects/:idOrSlug
        const projMatch = path.match(/^\/api\/projects\/([^/]+)$/);
        if (projMatch && method === "GET") {
          const idOrSlug = projMatch[1];
          const res = await fetch(`${firestoreBase}/projects?key=${apiKey}`);
          let project = null;
          if (res.ok) {
            const data = await res.json();
            const list = (data.documents || []).map(cleanFirestoreDoc);
            project = list.find(p => p.id === idOrSlug || p.slug === idOrSlug);
          }
          if (!project) return jsonResponse({ success: false, error: "Project not found" }, 404);
          return jsonResponse({ success: true, project });
        }

        // POST /api/inquiries
        if (path === "/api/inquiries" && method === "POST") {
          const body = await request.json();
          const id = "inq_" + Date.now();
          const newInquiry = {
            id,
            name: (body.name || "").trim(),
            phone: (body.phone || "").trim(),
            email: (body.email || "").trim(),
            type: body.type || "Weddings",
            date: body.date || "",
            guests: body.guests || "",
            location: (body.venue || body.location || "").trim(),
            message: (body.message || "").trim(),
            status: "new",
            createdAt: new Date().toISOString()
          };

          await fetch(`${firestoreBase}/inquiries?documentId=${id}&key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fields: toFirestoreFields(newInquiry) })
          });

          return jsonResponse({
            success: true,
            message: "Inquiry received and submitted to Keshara Sahan!",
            inquiry: newInquiry
          }, 201);
        }

        return jsonResponse({ error: "Endpoint not found" }, 404);
      } catch (err) {
        console.error("Public Worker API Error:", err);
        return jsonResponse({ success: false, error: err.message }, 500);
      }
    }

    // 3. Clean URL Routing for Static Assets
    if (env && env.ASSETS) {
      if (path === "/about") {
        return env.ASSETS.fetch(new Request(new URL("/about.html", request.url), request));
      }
      if (path === "/projects") {
        return env.ASSETS.fetch(new Request(new URL("/projects.html", request.url), request));
      }
      if (path === "/contact") {
        return env.ASSETS.fetch(new Request(new URL("/contact.html", request.url), request));
      }
      if (path === "/project" || path.startsWith("/project/")) {
        return env.ASSETS.fetch(new Request(new URL("/project.html", request.url), request));
      }

      // Serve static asset
      return env.ASSETS.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  }
};
