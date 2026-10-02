/* ===================================================================
   HK EVENT MANAGEMENT — GALLERY & LIGHTBOX CONTROLLER
   Full-featured Lightbox, Image Download, Touch Swipe & Keyboard Nav
   =================================================================== */

class HKGallery {
  constructor(images = [], projectTitle = "HK Event") {
    this.images = images;
    this.projectTitle = projectTitle;
    this.currentIndex = 0;
    this.modal = null;
    this.imgEl = null;
    this.captionEl = null;
    this.counterEl = null;
    this.touchStartX = 0;
    this.touchEndX = 0;
    
    this.initDOM();
    this.bindEvents();
  }

  initDOM() {
    let existingModal = document.getElementById("hk-lightbox");
    if (!existingModal) {
      const modalHTML = `
        <div id="hk-lightbox" class="lightbox-modal" role="dialog" aria-modal="true" aria-label="Photo Gallery Lightbox">
          <div class="lightbox-topbar">
            <div class="lightbox-counter" id="lightbox-counter">Photo 1 of 1</div>
            <div class="lightbox-actions">
              <button class="lightbox-btn" id="lightbox-download-btn" title="Download Image">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>Download</span>
              </button>
              <button class="lightbox-close-btn" id="lightbox-close-btn" aria-label="Close Lightbox">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
          
          <div class="lightbox-body" id="lightbox-body">
            <button class="lightbox-nav-btn lightbox-prev-btn" id="lightbox-prev-btn" aria-label="Previous Image">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            
            <div class="lightbox-image-container">
              <img id="lightbox-img" class="lightbox-img" src="" alt="Gallery Image" />
            </div>

            <button class="lightbox-nav-btn lightbox-next-btn" id="lightbox-next-btn" aria-label="Next Image">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>

          <div class="lightbox-bottombar">
            <div class="lightbox-caption" id="lightbox-caption"></div>
            <div class="lightbox-hints">Use ← and → arrow keys to navigate | Esc to exit</div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML("beforeend", modalHTML);
      existingModal = document.getElementById("hk-lightbox");
    }

    this.modal = existingModal;
    this.imgEl = document.getElementById("lightbox-img");
    this.captionEl = document.getElementById("lightbox-caption");
    this.counterEl = document.getElementById("lightbox-counter");
  }

  bindEvents() {
    document.getElementById("lightbox-close-btn").addEventListener("click", () => this.close());
    document.getElementById("lightbox-prev-btn").addEventListener("click", () => this.prev());
    document.getElementById("lightbox-next-btn").addEventListener("click", () => this.next());
    document.getElementById("lightbox-download-btn").addEventListener("click", () => this.downloadCurrent());

    // Close when clicking outside image
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal || e.target.id === "lightbox-body") {
        this.close();
      }
    });

    // Keyboard navigation
    document.addEventListener("keydown", (e) => {
      if (!this.modal.classList.contains("active")) return;
      if (e.key === "Escape") this.close();
      if (e.key === "ArrowLeft") this.prev();
      if (e.key === "ArrowRight") this.next();
    });

    // Touch Swipe support for Mobile
    const bodyEl = document.getElementById("lightbox-body");
    bodyEl.addEventListener("touchstart", (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    bodyEl.addEventListener("touchend", (e) => {
      this.touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe();
    }, { passive: true });
  }

  handleSwipe() {
    const threshold = 50;
    if (this.touchEndX < this.touchStartX - threshold) {
      this.next(); // swipe left
    }
    if (this.touchEndX > this.touchStartX + threshold) {
      this.prev(); // swipe right
    }
  }

  open(index = 0) {
    if (!this.images || this.images.length === 0) return;
    this.currentIndex = index;
    this.updateContent();
    this.modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  close() {
    this.modal.classList.remove("active");
    document.body.style.overflow = "";
  }

  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    } else {
      this.currentIndex = this.images.length - 1;
    }
    this.updateContent();
  }

  next() {
    if (this.currentIndex < this.images.length - 1) {
      this.currentIndex++;
    } else {
      this.currentIndex = 0;
    }
    this.updateContent();
  }

  updateContent() {
    const imgData = this.images[this.currentIndex];
    if (!imgData) return;

    let src = imgData.url || imgData.thumbnailUrl || "";
    if (src) {
      src = src.trim();
      if (src.startsWith("//")) src = "https:" + src;
      else if (!src.startsWith("http://") && !src.startsWith("https://") && !src.startsWith("data:") && !src.startsWith("/")) {
        src = "https://" + src;
      }
    }

    this.imgEl.style.opacity = "0.4";
    this.imgEl.src = src;
    this.imgEl.alt = imgData.altText || imgData.caption || `Image ${this.currentIndex + 1}`;
    
    this.imgEl.onload = () => {
      this.imgEl.style.opacity = "1";
    };

    this.counterEl.textContent = `Photo ${this.currentIndex + 1} of ${this.images.length}`;
    this.captionEl.textContent = imgData.caption || this.projectTitle;
  }

  async downloadCurrent() {
    const imgData = this.images[this.currentIndex];
    if (!imgData) return;

    const downloadBtn = document.getElementById("lightbox-download-btn");
    const originalText = downloadBtn.innerHTML;
    downloadBtn.innerHTML = `<span>Saving...</span>`;

    try {
      const cleanProj = this.projectTitle.replace(/[^a-zA-Z0-9]/g, "_");
      const filename = `HK_Event_${cleanProj}_Photo_${this.currentIndex + 1}.jpg`;
      
      const response = await fetch(imgData.url, { mode: "cors" });
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);

      showToast("Photo downloaded successfully!", "success");
    } catch (err) {
      console.warn("Direct blob download failed, opening direct image link:", err);
      window.open(imgData.url, "_blank");
      showToast("Opened high-res image for direct download.", "success");
    } finally {
      downloadBtn.innerHTML = originalText;
    }
  }
}

// Global Toast notification utility
function showToast(message, type = "success") {
  let container = document.getElementById("hk-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "hk-toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      ${type === 'success' 
        ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>'
        : '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>'
      }
    </svg>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(50px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
