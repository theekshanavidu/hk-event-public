/* ===================================================================
   HK EVENT MANAGEMENT — MAIN INTERACTION CONTROLLER
   Clean URLs Support & Server API Integration
   =================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initHeader();
  initMobileNav();
  initContactForm();
  initFAQAccordion();
  highlightActiveNav();
});

// Sticky Header with Scroll Effect
function initHeader() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  const onScroll = () => {
    if (window.scrollY > 30) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

// Mobile Drawer Navigation
function initMobileNav() {
  const toggleBtn = document.getElementById("mobile-toggle-btn");
  const closeBtn = document.getElementById("mobile-close-btn");
  const drawer = document.getElementById("mobile-drawer");
  const backdrop = document.getElementById("mobile-backdrop");

  if (!toggleBtn || !drawer || !backdrop) return;

  const openDrawer = () => {
    drawer.classList.add("active");
    backdrop.classList.add("active");
    document.body.style.overflow = "hidden";
  };

  const closeDrawer = () => {
    drawer.classList.remove("active");
    backdrop.classList.remove("active");
    document.body.style.overflow = "";
  };

  toggleBtn.addEventListener("click", openDrawer);
  if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
  backdrop.addEventListener("click", closeDrawer);

  const drawerLinks = drawer.querySelectorAll("a");
  drawerLinks.forEach(link => {
    link.addEventListener("click", closeDrawer);
  });
}

// Active Nav Highlighting for Clean URLs
function highlightActiveNav() {
  const currentPath = window.location.pathname.replace(/\/$/, "") || "/";
  const navLinks = document.querySelectorAll(".nav-link, .mobile-nav-links a");

  navLinks.forEach(link => {
    const href = link.getAttribute("href");
    if (!href) return;
    const cleanHref = href.replace(/\/$/, "") || "/";

    if (cleanHref === currentPath) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

// Interactive FAQ Accordion
function initFAQAccordion() {
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach(item => {
    const question = item.querySelector(".faq-question");
    const answer = item.querySelector(".faq-answer");
    if (!question || !answer) return;

    question.addEventListener("click", () => {
      const isActive = item.classList.contains("active");

      // Close all other items
      faqItems.forEach(other => {
        other.classList.remove("active");
        const otherAnswer = other.querySelector(".faq-answer");
        if (otherAnswer) otherAnswer.style.maxHeight = null;
      });

      if (!isActive) {
        item.classList.add("active");
        answer.style.maxHeight = answer.scrollHeight + "px";
      }
    });
  });
}

// Contact / Consultation Form Submission to Node.js /api/inquiries
function initContactForm() {
  const form = document.getElementById("event-inquiry-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector("button[type='submit']");
    const originalText = submitBtn.innerHTML;

    const name = form.querySelector("[name='name']").value.trim();
    const phone = form.querySelector("[name='phone']").value.trim();
    const email = form.querySelector("[name='email']") ? form.querySelector("[name='email']").value.trim() : "";
    const type = form.querySelector("[name='type']") ? form.querySelector("[name='type']").value : "Weddings";
    const date = form.querySelector("[name='date']") ? form.querySelector("[name='date']").value : "";
    const guests = form.querySelector("[name='guests']") ? form.querySelector("[name='guests']").value : "";
    const location = form.querySelector("[name='location']") || form.querySelector("[name='venue']");
    const locationVal = location ? location.value.trim() : "";
    const message = form.querySelector("[name='message']") ? form.querySelector("[name='message']").value.trim() : "";

    if (!name || !phone) {
      if (typeof showToast === "function") {
        showToast("Please provide your name and phone number.", "error");
      } else {
        alert("Please provide your name and phone number.");
      }
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Submitting Inquiry...</span>`;

    const inquiryPayload = {
      name,
      phone,
      email,
      type,
      date,
      guests,
      location: locationVal,
      message
    };

    const res = await HKData.submitInquiry(inquiryPayload);
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;

    if (res.success) {
      form.reset();
      if (typeof showToast === "function") {
        showToast("Your inquiry has been received by Keshara Sahan & the HK Event team!", "success");
      } else {
        alert("Thank you! Your inquiry has been submitted to HK Event Management.");
      }
    } else {
      if (typeof showToast === "function") {
        showToast(res.error || "Failed to submit inquiry. Please try again.", "error");
      } else {
        alert("Could not submit inquiry. Please try again.");
      }
    }
  });
}
