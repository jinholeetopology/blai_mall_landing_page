(function () {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const body = document.body;
  const header = $(".site-header");
  const nav = $("#site-nav");
  const menuToggle = $(".menu-toggle");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const state = {
    modalOpen: false,
    lastFocus: null,
    carouselIndex: 0,
    carouselPaused: false,
    carouselTimer: null,
    isSubmitting: false,
    formState: "default"
  };

  const appConfig = {
    inquiryProvider: window.APP_CONFIG?.inquiryProvider || "demo",
    inquiryEndpoint: String(window.APP_CONFIG?.inquiryEndpoint || "").trim(),
    inquiryEndpointMode: window.APP_CONFIG?.inquiryEndpointMode || "no-cors",
    inquiryDebug: Boolean(window.APP_CONFIG?.inquiryDebug)
  };

  function debugLog(...args) {
    if (!appConfig.inquiryDebug) return;
    console.log("[inquiry-debug]", ...args);
  }

  function setHeaderScrolled() {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }

  function closeMobileMenu() {
    if (!menuToggle || !nav) return;
    menuToggle.setAttribute("aria-expanded", "false");
    nav.classList.remove("is-open");
  }

  function openMobileMenu() {
    if (!menuToggle || !nav) return;
    menuToggle.setAttribute("aria-expanded", "true");
    nav.classList.add("is-open");
  }

  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
      if (isOpen) closeMobileMenu();
      else openMobileMenu();
    });
  }

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const scrollLink = target.closest("[data-scroll]");
    if (scrollLink instanceof HTMLAnchorElement) {
      const href = scrollLink.getAttribute("href") || "";
      if (href.startsWith("#")) {
        event.preventDefault();
        const targetSection = document.querySelector(href);
        if (targetSection) {
          targetSection.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
          closeMobileMenu();
        }
      }
    }

    if (!nav || !menuToggle) return;
    if (window.innerWidth > 767) return;
    if (menuToggle.contains(target)) return;
    if (!nav.contains(target)) closeMobileMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 767) closeMobileMenu();
  });

  window.addEventListener("scroll", setHeaderScrolled, { passive: true });
  setHeaderScrolled();

  const rollingKeyword = $("#rolling-keyword");
  const keywords = ["PMO", "LLM", "ERP", "AI", "MES", "CRM"];
  let keywordIndex = 0;

  if (rollingKeyword && !reducedMotion) {
    window.setInterval(() => {
      rollingKeyword.classList.add("is-switching");
      window.setTimeout(() => {
        keywordIndex = (keywordIndex + 1) % keywords.length;
        rollingKeyword.textContent = keywords[keywordIndex];
        rollingKeyword.classList.remove("is-switching");
      }, 180);
    }, 2200);
  }

  const revealTargets = $$("[data-reveal]");
  if ("IntersectionObserver" in window && revealTargets.length) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("revealed");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.16 });
    revealTargets.forEach((node) => revealObserver.observe(node));
  } else {
    revealTargets.forEach((node) => node.classList.add("revealed"));
  }

  const metricNodes = $$(".metric-value[data-target]");
  function formatMetricValue(rawValue, suffix) {
    return `${Math.round(rawValue).toLocaleString("ko-KR")}${suffix || ""}`;
  }

  function animateMetric(node) {
    if (node.dataset.animated === "true") return;
    node.dataset.animated = "true";
    const target = Number(node.dataset.target || 0);
    const suffix = node.dataset.suffix || "";
    if (!Number.isFinite(target)) return;

    if (reducedMotion) {
      node.textContent = formatMetricValue(target, suffix);
      return;
    }

    const duration = 1200;
    const startTime = performance.now();
    function frame(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      node.textContent = formatMetricValue(target * eased, suffix);
      if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  if ("IntersectionObserver" in window && metricNodes.length) {
    const metricObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateMetric(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.35 });
    metricNodes.forEach((node) => metricObserver.observe(node));
  } else {
    metricNodes.forEach(animateMetric);
  }

  const carouselTrack = $("[data-carousel-track]");
  const carouselSlides = $$("[data-carousel-slide]");
  const dotsWrap = $("[data-carousel-dots]");
  const prevBtn = $("[data-carousel-prev]");
  const nextBtn = $("[data-carousel-next]");
  const toggleAutoBtn = $("[data-carousel-toggle]");
  const carouselViewport = $(".carousel-viewport");

  function renderCarouselDots() {
    if (!dotsWrap || !carouselSlides.length) return;
    dotsWrap.innerHTML = "";
    carouselSlides.forEach((_, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "carousel-dot" + (index === state.carouselIndex ? " is-active" : "");
      btn.setAttribute("aria-label", `${index + 1}번 사례로 이동`);
      btn.dataset.index = String(index);
      dotsWrap.appendChild(btn);
    });
  }

  function updateCarousel(announce) {
    if (!carouselTrack) return;
    const slideCount = carouselSlides.length;
    if (!slideCount) return;
    state.carouselIndex = (state.carouselIndex + slideCount) % slideCount;
    carouselTrack.style.transform = `translateX(-${state.carouselIndex * 100}%)`;
    $$(".carousel-dot", dotsWrap || document).forEach((dot, idx) => {
      dot.classList.toggle("is-active", idx === state.carouselIndex);
    });
    if (announce) {
      const carousel = $(".carousel");
      if (carousel) carousel.setAttribute("aria-live", "polite");
      window.setTimeout(() => {
        if (carousel) carousel.setAttribute("aria-live", "off");
      }, 200);
    }
  }

  function nextSlide() {
    state.carouselIndex += 1;
    updateCarousel(true);
  }

  function prevSlide() {
    state.carouselIndex -= 1;
    updateCarousel(true);
  }

  function startCarouselAutoplay() {
    if (reducedMotion || state.carouselPaused || carouselSlides.length < 2) return;
    stopCarouselAutoplay();
    state.carouselTimer = window.setInterval(() => {
      state.carouselIndex += 1;
      updateCarousel(false);
    }, 5000);
  }

  function stopCarouselAutoplay() {
    if (state.carouselTimer) {
      window.clearInterval(state.carouselTimer);
      state.carouselTimer = null;
    }
  }

  function setCarouselPaused(paused) {
    state.carouselPaused = paused;
    if (toggleAutoBtn) {
      toggleAutoBtn.setAttribute("aria-pressed", String(paused));
      toggleAutoBtn.textContent = paused ? "자동재생 재개" : "자동재생 일시정지";
    }
    if (paused) stopCarouselAutoplay();
    else startCarouselAutoplay();
  }

  if (carouselSlides.length && carouselTrack) {
    renderCarouselDots();
    updateCarousel(false);
    startCarouselAutoplay();

    prevBtn?.addEventListener("click", () => {
      prevSlide();
      startCarouselAutoplay();
    });

    nextBtn?.addEventListener("click", () => {
      nextSlide();
      startCarouselAutoplay();
    });

    toggleAutoBtn?.addEventListener("click", () => {
      setCarouselPaused(!state.carouselPaused);
    });

    dotsWrap?.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLButtonElement)) return;
      const index = Number(target.dataset.index);
      if (!Number.isFinite(index)) return;
      state.carouselIndex = index;
      updateCarousel(true);
      startCarouselAutoplay();
    });

    carouselViewport?.addEventListener("mouseenter", () => stopCarouselAutoplay());
    carouselViewport?.addEventListener("mouseleave", () => {
      if (!state.carouselPaused) startCarouselAutoplay();
    });
    carouselViewport?.addEventListener("focusin", () => stopCarouselAutoplay());
    carouselViewport?.addEventListener("focusout", () => {
      if (!state.carouselPaused) startCarouselAutoplay();
    });

    let touchStartX = 0;
    let touchDeltaX = 0;
    carouselViewport?.addEventListener("touchstart", (event) => {
      touchStartX = event.changedTouches[0]?.clientX || 0;
      touchDeltaX = 0;
    }, { passive: true });
    carouselViewport?.addEventListener("touchmove", (event) => {
      touchDeltaX = (event.changedTouches[0]?.clientX || 0) - touchStartX;
    }, { passive: true });
    carouselViewport?.addEventListener("touchend", () => {
      if (Math.abs(touchDeltaX) < 42) return;
      if (touchDeltaX < 0) nextSlide();
      else prevSlide();
      startCarouselAutoplay();
    });
  }

  $$(".faq-item").forEach((faq) => {
    const button = $(".faq-question", faq);
    const answer = $(".faq-answer", faq);
    if (!button || !answer) return;

    button.addEventListener("click", () => {
      const isOpen = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!isOpen));
      answer.hidden = isOpen;
    });
  });

  const modal = $("#inquiry-modal");
  const modalDialog = $(".modal-dialog", modal || document);
  const openModalButtons = $$("[data-open-modal]");
  const closeModalButtons = $$("[data-close-modal]");
  const inquiryForm = $("#inquiry-form");
  const privacyToggleBtn = $("[data-toggle-privacy]");
  const privacyDetail = $("#privacy-detail");
  const formAlert = $("#form-alert");
  const submitButton = $("#submit-button");
  const retrySubmitBtn = $("#retry-submit");
  const formDefault = $("#form-state-default");
  const formSuccess = $("#form-state-success");
  const formError = $("#form-state-error");
  const messageField = $("#message");
  const messageCounter = $("#message-counter");

  function setModalOpen(open) {
    if (!modal || !modalDialog) return;
    state.modalOpen = open;
    modal.setAttribute("aria-hidden", String(!open));
    body.classList.toggle("modal-open", open);

    if (open) {
      state.lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      window.setTimeout(() => $("#name")?.focus(), 0);
    } else {
      closeMobileMenu();
      if (state.lastFocus) state.lastFocus.focus();
    }
  }

  openModalButtons.forEach((button) => button.addEventListener("click", () => setModalOpen(true)));
  closeModalButtons.forEach((button) => button.addEventListener("click", () => setModalOpen(false)));

  modal?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.matches(".modal-dim")) setModalOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.modalOpen) {
      event.preventDefault();
      setModalOpen(false);
      return;
    }

    if (event.key !== "Tab" || !state.modalOpen || !modalDialog) return;
    const focusables = $$(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      modalDialog
    ).filter((el) => !el.hasAttribute("hidden") && el.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  });

  privacyToggleBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const isHidden = privacyDetail?.hasAttribute("hidden");
    if (!privacyDetail) return;
    if (isHidden) {
      privacyDetail.removeAttribute("hidden");
      privacyToggleBtn.textContent = "내용 숨기기";
    } else {
      privacyDetail.setAttribute("hidden", "");
      privacyToggleBtn.textContent = "내용 보기";
    }
  });

  function setResultState(nextState) {
    state.formState = nextState;
    const isDefault = nextState === "default";
    const isSuccess = nextState === "success";
    const isError = nextState === "error";
    formDefault?.toggleAttribute("hidden", !isDefault);
    formSuccess?.toggleAttribute("hidden", !isSuccess);
    formError?.toggleAttribute("hidden", !isError);
  }

  function digitsOnly(value) {
    return value.replace(/\D/g, "");
  }

  function formatPhone(value) {
    const digits = digitsOnly(value).slice(0, 11);
    if (digits.length < 4) return digits;
    if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }

  const validators = {
    name(value) {
      const trimmed = value.trim();
      if (!trimmed) return "이름을 입력해 주세요.";
      if (trimmed.length < 2) return "이름은 2자 이상 입력해 주세요.";
      if (!/^[가-힣a-zA-Z\s]+$/.test(trimmed)) return "이름에는 특수문자를 사용할 수 없습니다.";
      return "";
    },
    phone(value) {
      const digits = digitsOnly(value);
      if (!digits) return "연락처를 입력해 주세요.";
      if (!/^01\d{8,9}$/.test(digits)) return "전화번호는 010-0000-0000 형식으로 입력해 주세요.";
      return "";
    },
    company() {
      return "";
    },
    email(value) {
      const trimmed = value.trim();
      if (!trimmed) return "";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return "올바른 이메일 형식을 입력해 주세요.";
      return "";
    },
    inquiryType() {
      return "";
    },
    message(value) {
      const trimmed = value.trim();
      if (!trimmed) return "요청사항을 입력해 주세요.";
      if (trimmed.length < 10) return "요청사항은 10자 이상 입력해 주세요.";
      if (trimmed.length > 1000) return "요청사항은 1,000자 이하로 입력해 주세요.";
      return "";
    },
    privacyConsent(checked) {
      if (!checked) return "개인정보 수집 및 이용 동의가 필요합니다.";
      return "";
    }
  };

  function getFieldInput(name) {
    return inquiryForm?.elements.namedItem(name);
  }

  function getFieldWrapper(name) {
    const input = getFieldInput(name);
    if (!(input instanceof HTMLElement)) return null;
    return input.closest(".form-field");
  }

  function setFieldError(name, message) {
    const errorNode = document.getElementById(`${name}-error`);
    const input = getFieldInput(name);
    const wrapper = getFieldWrapper(name);
    if (errorNode) errorNode.textContent = message;
    if (wrapper) wrapper.classList.toggle("has-error", Boolean(message));
    if (input instanceof HTMLElement) {
      input.setAttribute("aria-invalid", String(Boolean(message)));
    }
  }

  function validateField(name) {
    if (!inquiryForm) return false;
    const input = getFieldInput(name);
    if (!input) return false;

    let message = "";
    if (name === "privacyConsent" && input instanceof HTMLInputElement) {
      message = validators[name](input.checked);
    } else if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement || input instanceof HTMLSelectElement) {
      message = validators[name](input.value);
    }
    setFieldError(name, message);
    return !message;
  }

  function updateMessageCounter() {
    if (!(messageField instanceof HTMLTextAreaElement) || !messageCounter) return;
    messageCounter.textContent = `${messageField.value.length} / 1000`;
  }

  function requiredFieldsValid() {
    if (!inquiryForm) return false;
    return ["name", "phone", "message", "privacyConsent"].every((name) => validateField(name));
  }

  function updateSubmitState() {
    if (!submitButton || !inquiryForm) return;
    const nameValid = !validators.name(String((getFieldInput("name") || {}).value || ""));
    const phoneValid = !validators.phone(String((getFieldInput("phone") || {}).value || ""));
    const messageValid = !validators.message(String((getFieldInput("message") || {}).value || ""));
    const consentInput = getFieldInput("privacyConsent");
    const consentValid = consentInput instanceof HTMLInputElement && consentInput.checked;
    const canSubmit = nameValid && phoneValid && messageValid && consentValid && !state.isSubmitting;
    submitButton.disabled = !canSubmit;
  }

  function setSubmitting(isSubmitting) {
    state.isSubmitting = isSubmitting;
    if (!submitButton) return;
    submitButton.classList.toggle("is-loading", isSubmitting);
    submitButton.disabled = isSubmitting || submitButton.disabled;
    updateSubmitState();
  }

  function setFormAlert(message, tone) {
    if (!formAlert) return;
    formAlert.textContent = message || "";
    formAlert.classList.remove("error", "success");
    if (tone) formAlert.classList.add(tone);
  }

  function resetFormPresentation() {
    setResultState("default");
    setFormAlert("");
    $$(".form-field", inquiryForm || document).forEach((field) => field.classList.remove("has-error"));
    $$(".field-error", inquiryForm || document).forEach((node) => {
      node.textContent = "";
    });
    if (inquiryForm) {
      $$("input, textarea, select", inquiryForm).forEach((field) => {
        if (field instanceof HTMLElement) field.setAttribute("aria-invalid", "false");
      });
    }
    if (privacyDetail) privacyDetail.setAttribute("hidden", "");
    if (privacyToggleBtn) privacyToggleBtn.textContent = "내용 보기";
    updateMessageCounter();
    updateSubmitState();
  }

  async function submitInquiry(payload) {
    // Google Apps Script Web App integration (Spreadsheet append).
    // If not configured, fallback to local demo mode.
    const isGoogleSheetMode = appConfig.inquiryProvider === "google-apps-script" && Boolean(appConfig.inquiryEndpoint);
    if (!isGoogleSheetMode) {
      const shouldFail = String(payload.message || "").toLowerCase().includes("[fail]");
      await new Promise((resolve) => window.setTimeout(resolve, 1100));
      if (shouldFail) {
        const error = new Error("Temporary failure");
        error.code = "TEMP";
        throw error;
      }
      return {
        ok: true,
        id: `inq_${Date.now()}`,
        mode: "demo"
      };
    }

    const params = new URLSearchParams();
    params.set("name", payload.name || "");
    params.set("phone", payload.phone || "");
    params.set("company", payload.company || "");
    params.set("email", payload.email || "");
    params.set("inquiryType", payload.inquiryType || "");
    params.set("message", payload.message || "");
    params.set("privacyConsent", payload.privacyConsent ? "true" : "false");
    params.set("csrfToken", payload.csrfToken || "");
    params.set("honeypot", payload.honeypot || "");
    params.set("submittedAt", new Date().toISOString());
    params.set("pageUrl", window.location.href);
    params.set("referrer", document.referrer || "");
    params.set("userAgent", navigator.userAgent || "");

    const requestMode = appConfig.inquiryEndpointMode === "cors" ? "cors" : "no-cors";
    debugLog("submit:start", {
      provider: appConfig.inquiryProvider,
      mode: requestMode,
      endpoint: appConfig.inquiryEndpoint
    });
    const response = await fetch(appConfig.inquiryEndpoint, {
      method: "POST",
      mode: requestMode,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
      },
      body: params.toString()
    });
    debugLog("submit:response-meta", {
      ok: response.ok,
      status: response.status,
      type: response.type,
      redirected: response.redirected,
      url: response.url
    });

    // no-cors인 경우 opaque 응답이라 성공/실패 코드를 읽을 수 없습니다.
    // 네트워크 레벨 오류가 없으면 성공으로 간주합니다.
    if (requestMode === "no-cors") {
      return {
        ok: true,
        id: `sheet_${Date.now()}`,
        mode: "google-apps-script",
        opaque: true
      };
    }

    const text = await response.text();
    debugLog("submit:response-text", text);
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (error) {
      data = null;
    }
    if (!response.ok || (data && data.ok === false)) {
      const error = new Error((data && data.message) || "Spreadsheet submit failed");
      error.code = "SHEET_SUBMIT_FAILED";
      throw error;
    }
    return data || { ok: true, id: `sheet_${Date.now()}`, mode: "google-apps-script" };
  }

  function collectFormPayload() {
    if (!inquiryForm) return null;
    const formData = new FormData(inquiryForm);
    return {
      name: String(formData.get("name") || "").trim(),
      phone: digitsOnly(String(formData.get("phone") || "")),
      company: String(formData.get("company") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      inquiryType: String(formData.get("inquiryType") || ""),
      message: String(formData.get("message") || "").trim(),
      privacyConsent: formData.get("privacyConsent") === "on",
      csrfToken: String(formData.get("csrfToken") || ""),
      honeypot: String(formData.get("website") || "")
    };
  }

  if (inquiryForm) {
    const watchedNames = ["name", "phone", "company", "email", "inquiryType", "message", "privacyConsent"];
    watchedNames.forEach((name) => {
      const input = getFieldInput(name);
      if (!input) return;
      const eventType = name === "privacyConsent" || input instanceof HTMLSelectElement ? "change" : "input";
      input.addEventListener(eventType, () => {
        if (name === "phone" && input instanceof HTMLInputElement) {
          const cursorFromEnd = input.value.length - input.selectionStart;
          input.value = formatPhone(input.value);
          const nextPos = Math.max(0, input.value.length - cursorFromEnd);
          try {
            input.setSelectionRange(nextPos, nextPos);
          } catch (error) {
            void error;
          }
        }
        if (name === "message") updateMessageCounter();
        validateField(name);
        updateSubmitState();
      });

      input.addEventListener("blur", () => {
        validateField(name);
        updateSubmitState();
      });
    });

    inquiryForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (state.isSubmitting) return;

      setResultState("default");
      setFormAlert("");

      const payload = collectFormPayload();
      if (!payload) return;

      if (payload.honeypot) {
        setFormAlert("정상적인 접근이 아닌 것으로 감지되었습니다.", "error");
        return;
      }

      const fieldNames = ["name", "phone", "email", "message", "privacyConsent"];
      const isAllValid = fieldNames.every((name) => validateField(name));
      if (!isAllValid) {
        setFormAlert("필수 항목 및 입력 형식을 확인해 주세요.", "error");
        const firstInvalid = $$("[aria-invalid='true']", inquiryForm)[0];
        if (firstInvalid instanceof HTMLElement) firstInvalid.focus();
        updateSubmitState();
        return;
      }

      setSubmitting(true);
      setFormAlert("문의 내용을 전송 중입니다...");

      try {
        debugLog("submit:payload", {
          ...payload,
          csrfToken: payload.csrfToken ? "[present]" : "",
          message: `${payload.message.slice(0, 40)}${payload.message.length > 40 ? "..." : ""}`
        });
        await submitInquiry(payload);
        setSubmitting(false);
        setFormAlert("", "");
        setResultState("success");
        inquiryForm.reset();
        updateMessageCounter();
        resetFormPresentation();
        setResultState("success");
      } catch (error) {
        console.error(error);
        setSubmitting(false);
        setFormAlert("일시적인 오류가 발생했습니다. 다시 시도해 주세요.", "error");
        setResultState("error");
      }
    });
  }

  retrySubmitBtn?.addEventListener("click", () => {
    setResultState("default");
    setFormAlert("다시 시도해 주세요.", "error");
    $("#submit-button")?.focus();
  });

  messageField?.addEventListener("input", updateMessageCounter);
  updateMessageCounter();
  updateSubmitState();
  setResultState("default");

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (!target.matches("[data-open-modal]")) return;
    if (state.formState !== "default") {
      resetFormPresentation();
      if (inquiryForm) inquiryForm.reset();
      updateMessageCounter();
    }
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (!target.matches("[data-close-modal]")) return;
    if (state.formState !== "default") {
      resetFormPresentation();
      if (inquiryForm) inquiryForm.reset();
      updateMessageCounter();
    }
  });

  const yearNode = $("#current-year");
  if (yearNode) yearNode.textContent = String(new Date().getFullYear());

  // Initial phone formatting in case of autofill.
  const phoneInput = $("#phone");
  if (phoneInput instanceof HTMLInputElement) {
    phoneInput.value = formatPhone(phoneInput.value);
  }
})();
