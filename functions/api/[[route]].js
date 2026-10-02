// ===================================================================
// CLOUDFLARE PAGES EDGE FUNCTION: /api/[[route]] (Public Site)
// Zero-Server Cloudflare-Native Edge APIs for Projects & Inquiries
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

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "");
  const method = request.method;

  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const projectId = env.FIREBASE_PROJECT_ID || "hkevent-522e9";
  const apiKey = env.FIREBASE_API_KEY || "AIzaSyBIyOSZmWlDzgGODjZik44cf-I5e3hxYT0";
  const firestoreBase = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

  try {
    // 1. Fetch Projects
    if (path === "/api/projects" && method === "GET") {
      const res = await fetch(`${firestoreBase}/projects?key=${apiKey}`);
      let projects = [];
      if (res.ok) {
        const data = await res.json();
        projects = (data.documents || []).map(cleanFirestoreDoc);
      }
      // Public site only shows published projects
      projects = projects.filter(p => p.status === "published");
      return jsonResponse({ success: true, projects });
    }

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

    // 2. Submit Inquiry
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
    console.error("Public Edge Function Error:", err);
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}
