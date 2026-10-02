/* ===================================================================
   HK EVENT MANAGEMENT — CLIENT DATA REPOSITORY
   Syncs with Node.js Express REST API (/api/projects & /api/inquiries)
   =================================================================== */

const HKData = {
  cache: null,

  async fetchProjects() {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.projects) {
          this.cache = data.projects;
          localStorage.setItem("hk_projects_cache", JSON.stringify(data.projects));
          return data.projects;
        }
      }
    } catch (e) {
      console.warn("Backend API not reachable, using cached/local projects:", e);
    }

    const cached = localStorage.getItem("hk_projects_cache");
    if (cached) {
      this.cache = JSON.parse(cached);
      return this.cache;
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
    return this.getAll(false).filter(p => p.featured);
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
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inquiryData)
      });
      return await res.json();
    } catch (e) {
      console.error("Inquiry submission error:", e);
      return { success: false, error: "Network error submitting inquiry." };
    }
  }
};

// Initial preload
HKData.fetchProjects();
