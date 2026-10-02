/* ===================================================================
   HK EVENT MANAGEMENT — CLIENT DATA REPOSITORY
   Syncs with Cloudflare Edge API (/api/projects & /api/inquiries)
   With seamless direct Firestore REST API fallback for 100% uptime
   =================================================================== */

const HKData = {
  cache: null,

  parseFirestoreDoc(doc) {
    if (!doc || !doc.fields) return { id: doc.name ? doc.name.split("/").pop() : "" };
    const f = doc.fields;
    const obj = { id: doc.name.split("/").pop() };
    for (const [k, v] of Object.entries(f)) {
      if (v.stringValue !== undefined) obj[k] = v.stringValue;
      else if (v.booleanValue !== undefined) obj[k] = v.booleanValue;
      else if (v.integerValue !== undefined) obj[k] = parseInt(v.integerValue, 10);
      else if (v.doubleValue !== undefined) obj[k] = parseFloat(v.doubleValue);
      else if (v.timestampValue !== undefined) obj[k] = v.timestampValue;
      else if (v.arrayValue !== undefined) {
        obj[k] = (v.arrayValue.values || []).map(item => {
          if (item.mapValue) {
            const m = {};
            for (const [mk, mv] of Object.entries(item.mapValue.fields || {})) {
              m[mk] = mv.stringValue !== undefined ? mv.stringValue : (mv.integerValue || mv.booleanValue || mv);
            }
            return m;
          }
          return item.stringValue || item;
        });
      } else if (v.mapValue !== undefined) {
        const m = {};
        for (const [mk, mv] of Object.entries(v.mapValue.fields || {})) {
          m[mk] = mv.stringValue !== undefined ? mv.stringValue : (mv.integerValue || mv.booleanValue || mv);
        }
        obj[k] = m;
      }
    }
    return obj;
  },

  async fetchProjects() {
    // 1. Try Primary Cloudflare Edge API
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.projects && data.projects.length > 0) {
          this.cache = data.projects;
          localStorage.setItem("hk_projects_cache", JSON.stringify(data.projects));
          return data.projects;
        }
      }
    } catch (e) {
      console.warn("Edge API not responding, trying direct Firestore fallback:", e);
    }

    // 2. Direct Firestore REST Fallback (100% Uptime Guaranteed)
    try {
      const fbUrl = "https://firestore.googleapis.com/v1/projects/hkevent-522e9/databases/(default)/documents/projects?key=AIzaSyBIyOSZmWlDzgGODjZik44cf-I5e3hxYT0";
      const fbRes = await fetch(fbUrl);
      if (fbRes.ok) {
        const fbData = await fbRes.json();
        const rawDocs = fbData.documents || [];
        const projects = rawDocs.map(doc => this.parseFirestoreDoc(doc)).filter(p => p.status === "published");
        if (projects.length > 0) {
          this.cache = projects;
          localStorage.setItem("hk_projects_cache", JSON.stringify(projects));
          return projects;
        }
      }
    } catch (fbErr) {
      console.warn("Direct Firestore fallback warning:", fbErr);
    }

    // 3. Browser Cache Fallback
    const cached = localStorage.getItem("hk_projects_cache");
    if (cached) {
      try {
        this.cache = JSON.parse(cached);
        return this.cache;
      } catch (e) {}
    }

    return [];
  },

  getAll(includeDrafts = false) {
    if (!this.cache) {
      const cached = localStorage.getItem("hk_projects_cache");
      this.cache = cached ? JSON.parse(cached) : [];
    }
    if (includeDrafts) return this.cache;
    return this.cache.filter(p => p.status === "published");
  },

  getFeatured() {
    const featured = this.getAll(false).filter(p => p.featured);
    if (featured.length > 0) return featured;
    return this.getAll(false).slice(0, 6);
  },

  getBySlugOrId(identifier) {
    const all = this.getAll(true);
    return all.find(p => p.slug === identifier || p.id === identifier);
  },

  getAdjacent(currentId) {
    const list = this.getAll(false);
    const index = list.findIndex(p => p.id === currentId || p.slug === currentId);
    if (index === -1) return { prev: null, next: null };
    const prev = index > 0 ? list[index - 1] : list[list.length - 1];
    const next = index < list.length - 1 ? list[index + 1] : list[0];
    return { prev, next };
  },

  async submitInquiry(inquiryData) {
    // 1. Try Cloudflare Edge API
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inquiryData)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Edge inquiry failed, submitting to Firestore directly:", e);
    }

    // 2. Direct Firestore REST Fallback
    try {
      const id = "inq_" + Date.now();
      const newInquiry = {
        id,
        name: (inquiryData.name || "").trim(),
        phone: (inquiryData.phone || "").trim(),
        email: (inquiryData.email || "").trim(),
        type: inquiryData.type || "Weddings",
        date: inquiryData.date || "",
        guests: inquiryData.guests || "",
        location: (inquiryData.venue || inquiryData.location || "").trim(),
        message: (inquiryData.message || "").trim(),
        status: "new",
        createdAt: new Date().toISOString()
      };

      const fields = {};
      for (const [k, v] of Object.entries(newInquiry)) {
        fields[k] = { stringValue: String(v) };
      }

      const fbUrl = `https://firestore.googleapis.com/v1/projects/hkevent-522e9/databases/(default)/documents/inquiries?documentId=${id}&key=AIzaSyBIyOSZmWlDzgGODjZik44cf-I5e3hxYT0`;
      const fbRes = await fetch(fbUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields })
      });

      if (fbRes.ok) {
        return {
          success: true,
          message: "Inquiry received and submitted to Keshara Sahan!",
          inquiry: newInquiry
        };
      }
    } catch (fbErr) {
      console.error("Firestore inquiry fallback error:", fbErr);
    }

    return { success: false, error: "Network error submitting inquiry." };
  }
};

// Initial preload
HKData.fetchProjects();
