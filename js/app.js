/**
 * Practical Explorer — Personal Branding App Script
 * 
 * 윈도우 환경에서 index.html을 더블 클릭(file://)하여 로컬 브라우저로
 * 직접 실행할 때에도 모든 기능이 100% 정상 작동하도록 클라이언트 사이드에서만 연산합니다.
 */

(function () {
  "use strict";

  // 로컬 스토리지 키
  const STORAGE_KEY = "practical_explorer_custom_profile";

  // 앱 전역 상태
  const state = {
    profile: null,
    activeCategory: "all",
    selectedJournal: null
  };

  // --------------------------------------------------------------------------
  // 1. 초기화 및 상태 로드
  // --------------------------------------------------------------------------
  function init() {
    // 1-1. 저장된 프로필이 있으면 로드, 없으면 BRAND_DATA의 기본값 복제
    const rawSaved = localStorage.getItem(STORAGE_KEY);
    if (rawSaved) {
      try {
        state.profile = JSON.parse(rawSaved);
      } catch (e) {
        state.profile = JSON.parse(JSON.stringify(window.BRAND_DATA.profile));
      }
    } else {
      state.profile = JSON.parse(JSON.stringify(window.BRAND_DATA.profile));
    }

    // 1-2. 각 섹션 렌더링
    renderProfile();
    renderFramework();
    renderCategories();
    renderJournals();
    renderFooterYear();

    // 1-3. 이벤트 바인딩
    bindNavigation();
    bindFilterTabs();
    bindModalEvents();
    bindCopyEmail();
    bindContactForm();
    bindCustomizer();
  }

  // --------------------------------------------------------------------------
  // 2. 프로필 및 개인화 반영
  // --------------------------------------------------------------------------
  function renderProfile() {
    const p = state.profile;

    // 헤더 로고
    const headerName = document.getElementById("header-brand-name");
    if (headerName) headerName.textContent = p.name || "[이름]";

    // 푸터 브랜드
    const footerName = document.getElementById("footer-brand-name");
    if (footerName) footerName.textContent = p.name || "[이름]";

    // 연락처 섹션 이메일 표시
    const emailVal = document.getElementById("contact-email-val");
    const copyBtn = document.getElementById("btn-copy-email");
    if (emailVal) {
      if (p.contact && p.contact.email && p.contact.email.trim() !== "") {
        emailVal.textContent = p.contact.email;
        emailVal.classList.remove("is-empty");
        if (copyBtn) copyBtn.style.display = "inline-flex";
      } else {
        emailVal.textContent = "아직 등록된 이메일이 없습니다 (상단 [내 정보 설정]에서 입력 가능)";
        emailVal.classList.add("is-empty");
        if (copyBtn) copyBtn.style.display = "none";
      }
    }

    // 소셜 링크 바인딩
    updateSocialLinks(p.contact);
  }

  function updateSocialLinks(contact) {
    const list = document.getElementById("social-links-list");
    if (!list) return;

    list.innerHTML = "";
    const items = [
      { key: "github", label: "GitHub", url: contact?.github },
      { key: "blog", label: "Journal / Blog", url: contact?.blog },
      { key: "linkedin", label: "LinkedIn", url: contact?.linkedin }
    ];

    let hasLink = false;
    items.forEach(item => {
      if (item.url && item.url.trim() !== "") {
        hasLink = true;
        const a = document.createElement("a");
        a.href = item.url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.className = "social-btn";
        a.innerHTML = `<span>${item.label}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="7" y1="17" x2="17" y2="7"></line>
            <polyline points="7 7 17 7 17 17"></polyline>
          </svg>`;
        list.appendChild(a);
      }
    });

    if (!hasLink) {
      const notice = document.createElement("div");
      notice.className = "contact-item-label";
      notice.style.textTransform = "none";
      notice.style.fontSize = "0.9rem";
      notice.innerHTML = `등록된 소셜 링크가 없습니다. <button type="button" id="btn-open-customizer-social" style="color:var(--color-accent); font-weight:600; text-decoration:underline;">[내 정보 설정]</button>에서 링크를 추가할 수 있습니다.`;
      list.appendChild(notice);

      const btn = document.getElementById("btn-open-customizer-social");
      if (btn) {
        btn.addEventListener("click", openCustomizerModal);
      }
    }
  }

  // --------------------------------------------------------------------------
  // 3. Section 03: About Me (Framework 4 Cards)
  // --------------------------------------------------------------------------
  function renderFramework() {
    const container = document.getElementById("framework-container");
    if (!container) return;

    const data = window.BRAND_DATA.framework || [];
    container.innerHTML = data.map(item => `
      <div class="framework-card">
        <div class="framework-step">${item.step}</div>
        <div class="framework-keyword">${item.keyword}</div>
        <h4 class="framework-title">${item.title}</h4>
        <p class="framework-desc">${item.description}</p>
        <span class="framework-metric">${item.metric}</span>
      </div>
    `).join("");
  }

  // --------------------------------------------------------------------------
  // 4. Section 04: Interests (4 Categories)
  // --------------------------------------------------------------------------
  function renderCategories() {
    const container = document.getElementById("categories-container");
    if (!container) return;

    const categories = window.BRAND_DATA.categories || [];
    container.innerHTML = categories.map(cat => `
      <div class="interest-card" data-cat-id="${cat.id}">
        <div class="interest-top">
          <span class="interest-badge">${cat.badge}</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
          </svg>
        </div>
        <h3 class="interest-name">${cat.name}</h3>
        <h4 class="interest-name-ko">${cat.nameKo}</h4>
        <p class="interest-desc">${cat.description}</p>
        <ul class="interest-list">
          ${cat.items.map(it => `<li>${it}</li>`).join("")}
        </ul>
      </div>
    `).join("");

    // 카테고리 카드 클릭 시 해당 탐색 기록 필터링으로 부드럽게 점프
    container.querySelectorAll(".interest-card").forEach(card => {
      card.addEventListener("click", () => {
        const catId = card.getAttribute("data-cat-id");
        if (catId) {
          filterJournalByCategory(catId);
          const journalSec = document.getElementById("journal");
          if (journalSec) {
            journalSec.scrollIntoView({ behavior: "smooth" });
          }
        }
      });
    });
  }

  // --------------------------------------------------------------------------
  // 5. Section 05: Exploration Journal
  // --------------------------------------------------------------------------
  function renderJournals() {
    const grid = document.getElementById("journal-grid");
    const countEl = document.getElementById("journal-total-count");
    if (!grid) return;

    const allJournals = window.BRAND_DATA.journals || [];
    const filtered = state.activeCategory === "all"
      ? allJournals
      : allJournals.filter(j => j.categoryId === state.activeCategory);

    if (countEl) {
      countEl.textContent = `${filtered.length}개의 기록`;
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="journal-empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          <h3>탐색 기록을 준비하고 있습니다.</h3>
          <p>선택하신 카테고리의 새로운 관점과 경험을 정리 중입니다. 다른 카테고리를 확인해 보세요.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(item => `
      <article class="journal-card" data-journal-id="${item.id}">
        <div class="journal-card-meta">
          <span class="journal-card-category">${item.categoryKo}</span>
          <span class="journal-card-time">${item.readTime}</span>
        </div>
        <h3 class="journal-card-title">${item.title}</h3>
        <p class="journal-card-summary">${item.summary}</p>
        <div class="journal-card-footer">
          <span class="journal-sample-badge">샘플 탐색 기록</span>
          <span class="journal-card-btn">
            자세히 읽기
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </span>
        </div>
      </article>
    `).join("");

    // 카드 클릭 시 상세 모달 열기
    grid.querySelectorAll(".journal-card").forEach(card => {
      card.addEventListener("click", () => {
        const jId = card.getAttribute("data-journal-id");
        openJournalModal(jId);
      });
    });
  }

  function bindFilterTabs() {
    const tabs = document.querySelectorAll(".filter-tab");
    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        const cat = tab.getAttribute("data-filter");
        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        state.activeCategory = cat;
        renderJournals();
      });
    });
  }

  function filterJournalByCategory(catId) {
    state.activeCategory = catId;
    const tabs = document.querySelectorAll(".filter-tab");
    tabs.forEach(t => {
      if (t.getAttribute("data-filter") === catId) {
        t.classList.add("active");
      } else {
        t.classList.remove("active");
      }
    });
    renderJournals();
  }

  // --------------------------------------------------------------------------
  // 6. Journal Reader Modal
  // --------------------------------------------------------------------------
  function openJournalModal(journalId) {
    const journals = window.BRAND_DATA.journals || [];
    const item = journals.find(j => j.id === journalId);
    if (!item) return;

    state.selectedJournal = item;
    const overlay = document.getElementById("journal-modal-overlay");
    const catEl = document.getElementById("modal-article-category");
    const titleEl = document.getElementById("modal-article-title");
    const metaEl = document.getElementById("modal-article-meta");
    const bodyEl = document.getElementById("modal-article-body");

    if (catEl) catEl.textContent = `${item.categoryName} (${item.categoryKo})`;
    if (titleEl) titleEl.textContent = item.title;
    if (metaEl) {
      metaEl.innerHTML = `
        <span>작성월: ${item.date}</span>
        <span>•</span>
        <span>${item.readTime}</span>
        <span>•</span>
        <span style="color:var(--color-accent); font-weight:600;">샘플 콘텐츠</span>
      `;
    }

    if (bodyEl) {
      bodyEl.innerHTML = item.content.map(sec => `
        <section>
          <h4>${sec.heading}</h4>
          <p>${sec.text}</p>
        </section>
      `).join("");
    }

    if (overlay) {
      overlay.classList.add("open");
      document.body.style.overflow = "hidden";
    }
  }

  function closeJournalModal() {
    const overlay = document.getElementById("journal-modal-overlay");
    if (overlay) {
      overlay.classList.remove("open");
      document.body.style.overflow = "";
    }
  }

  // --------------------------------------------------------------------------
  // 7. Customizer (내 정보 설정) Modal
  // --------------------------------------------------------------------------
  function openCustomizerModal() {
    const overlay = document.getElementById("customizer-modal-overlay");
    if (!overlay) return;

    const inputName = document.getElementById("custom-input-name");
    const inputEmail = document.getElementById("custom-input-email");
    const inputGithub = document.getElementById("custom-input-github");
    const inputBlog = document.getElementById("custom-input-blog");
    const inputLinkedin = document.getElementById("custom-input-linkedin");

    const p = state.profile;
    if (inputName) inputName.value = p.name === "[이름]" ? "" : p.name;
    if (inputEmail) inputEmail.value = p.contact?.email || "";
    if (inputGithub) inputGithub.value = p.contact?.github || "";
    if (inputBlog) inputBlog.value = p.contact?.blog || "";
    if (inputLinkedin) inputLinkedin.value = p.contact?.linkedin || "";

    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeCustomizerModal() {
    const overlay = document.getElementById("customizer-modal-overlay");
    if (overlay) {
      overlay.classList.remove("open");
      document.body.style.overflow = "";
    }
  }

  function saveCustomizerData() {
    const inputName = document.getElementById("custom-input-name");
    const inputEmail = document.getElementById("custom-input-email");
    const inputGithub = document.getElementById("custom-input-github");
    const inputBlog = document.getElementById("custom-input-blog");
    const inputLinkedin = document.getElementById("custom-input-linkedin");

    const newName = inputName?.value.trim() || "[이름]";
    const newEmail = inputEmail?.value.trim() || "";
    const newGithub = inputGithub?.value.trim() || "";
    const newBlog = inputBlog?.value.trim() || "";
    const newLinkedin = inputLinkedin?.value.trim() || "";

    state.profile.name = newName;
    state.profile.contact = {
      email: newEmail,
      github: newGithub,
      blog: newBlog,
      linkedin: newLinkedin
    };

    // 로컬 스토리지에 저장
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.profile));

    renderProfile();
    closeCustomizerModal();
    showToast("프로필 정보가 저장되었습니다.");
  }

  function resetCustomizerData() {
    localStorage.removeItem(STORAGE_KEY);
    state.profile = JSON.parse(JSON.stringify(window.BRAND_DATA.profile));
    renderProfile();
    closeCustomizerModal();
    showToast("기본값([이름])으로 초기화되었습니다.");
  }

  function bindCustomizer() {
    const openBtn = document.getElementById("btn-open-customizer");
    if (openBtn) openBtn.addEventListener("click", openCustomizerModal);

    const saveBtn = document.getElementById("btn-save-customizer");
    if (saveBtn) saveBtn.addEventListener("click", saveCustomizerData);

    const resetBtn = document.getElementById("btn-reset-customizer");
    if (resetBtn) resetBtn.addEventListener("click", resetCustomizerData);
  }

  // --------------------------------------------------------------------------
  // 8. 모달 공통 닫기 이벤트 (ESC, 바깥 배경 클릭)
  // --------------------------------------------------------------------------
  function bindModalEvents() {
    // 저널 모달 닫기
    const jCloseBtn = document.getElementById("btn-close-journal-modal");
    if (jCloseBtn) jCloseBtn.addEventListener("click", closeJournalModal);

    const jOverlay = document.getElementById("journal-modal-overlay");
    if (jOverlay) {
      jOverlay.addEventListener("click", (e) => {
        if (e.target === jOverlay) closeJournalModal();
      });
    }

    // 커스터마이저 모달 닫기
    const cCloseBtn = document.getElementById("btn-close-customizer-modal");
    if (cCloseBtn) cCloseBtn.addEventListener("click", closeCustomizerModal);

    const cCancelBtn = document.getElementById("btn-cancel-customizer");
    if (cCancelBtn) cCancelBtn.addEventListener("click", closeCustomizerModal);

    const cOverlay = document.getElementById("customizer-modal-overlay");
    if (cOverlay) {
      cOverlay.addEventListener("click", (e) => {
        if (e.target === cOverlay) closeCustomizerModal();
      });
    }

    // ESC 키로 열려있는 모달 닫기
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeJournalModal();
        closeCustomizerModal();
      }
    });
  }

  // --------------------------------------------------------------------------
  // 9. 이메일 클립보드 복사
  // --------------------------------------------------------------------------
  function bindCopyEmail() {
    const copyBtn = document.getElementById("btn-copy-email");
    if (!copyBtn) return;

    copyBtn.addEventListener("click", () => {
      const email = state.profile.contact?.email;
      if (!email || email.trim() === "") {
        openCustomizerModal();
        return;
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(() => {
          showToast("이메일 주소가 클립보드에 복사되었습니다.");
        }).catch(() => {
          fallbackCopyText(email);
        });
      } else {
        fallbackCopyText(email);
      }
    });
  }

  function fallbackCopyText(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
      showToast("이메일 주소가 클립보드에 복사되었습니다.");
    } catch (err) {
      showToast("복사에 실패했습니다. 직접 복사해 주세요.");
    }
    document.body.removeChild(textArea);
  }

  // --------------------------------------------------------------------------
  // 10. 문의 폼 시뮬레이션
  // --------------------------------------------------------------------------
  function bindContactForm() {
    const form = document.getElementById("contact-form");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const nameInput = document.getElementById("form-sender-name");
      const msgInput = document.getElementById("form-sender-message");

      const senderName = nameInput?.value.trim();
      const message = msgInput?.value.trim();

      if (!senderName || !message) {
        showToast("이름과 메시지를 모두 입력해 주세요.");
        return;
      }

      const recipient = state.profile.contact?.email;
      if (recipient && recipient.trim() !== "") {
        // mailto 링크 생성
        const subject = encodeURIComponent(`[Practical Explorer] ${senderName}님의 문의`);
        const body = encodeURIComponent(`${message}\n\n- 보낸 사람: ${senderName}`);
        window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
        showToast("메일 클라이언트를 실행합니다.");
      } else {
        showToast("메시지가 준비되었습니다. (실제 전송을 위해 이메일 등록 필요)");
      }

      form.reset();
    });
  }

  // --------------------------------------------------------------------------
  // 11. 토스트 알림 유틸리티
  // --------------------------------------------------------------------------
  function showToast(message) {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.className = "toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-dark-accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    // 트리거 트랜지션
    requestAnimationFrame(() => {
      toast.classList.add("show");
    });

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        if (toast.parentElement) {
          toast.parentElement.removeChild(toast);
        }
      }, 300);
    }, 3200);
  }

  // --------------------------------------------------------------------------
  // 12. 네비게이션 & 스크롤 & 모바일 메뉴
  // --------------------------------------------------------------------------
  function bindNavigation() {
    const mobileBtn = document.getElementById("mobile-menu-btn");
    const navLinks = document.getElementById("nav-links");

    if (mobileBtn && navLinks) {
      mobileBtn.addEventListener("click", () => {
        navLinks.classList.toggle("open");
      });

      // 메뉴 클릭 시 모바일 메뉴 자동 닫기
      navLinks.querySelectorAll("a").forEach(a => {
        a.addEventListener("click", () => {
          navLinks.classList.remove("open");
        });
      });
    }

    // Top 스크롤 버튼
    const topBtn = document.getElementById("btn-back-to-top");
    if (topBtn) {
      topBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  }

  // --------------------------------------------------------------------------
  // 13. 푸터 저작권 연도 동적 표시
  // --------------------------------------------------------------------------
  function renderFooterYear() {
    const yearEl = document.getElementById("footer-current-year");
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    }
  }

  // DOM 로드 완료 후 실행
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
