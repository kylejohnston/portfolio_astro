document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('overlay');
  const overlayBackground = document.getElementById('overlayBackground');
  const closeOverlayBtn = document.getElementById('closeOverlay');
  const overlayContent = document.getElementById('overlayPageContent');
  const siteHeader = document.querySelector('.site-header');
  const siteMain = document.querySelector('main');
  const originalTitle = document.title;

  const OVERLAY_PATH_PREFIX = '/work/';
  const TRANSITION_MS = 350;

  const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const contentCache = {};
  let lastFocusedElement = null;

  function isOverlayTarget(href) {
    if (!href) return false;
    let path;
    try {
      path = new URL(href, window.location.origin).pathname;
    } catch {
      return false;
    }
    return path.startsWith(OVERLAY_PATH_PREFIX) && path !== OVERLAY_PATH_PREFIX;
  }

  function setBackgroundInert(isInert) {
    if (siteHeader) siteHeader.inert = isInert;
    if (siteMain) siteMain.inert = isInert;
  }

  function showOverlay() {
    overlayBackground.style.display = 'block';
    overlay.style.display = 'block';
    overlay.setAttribute('aria-hidden', 'false');
    overlayBackground.setAttribute('aria-hidden', 'false');
    document.body.classList.add('overlay-open');
    setBackgroundInert(true);
    overlay.scrollTop = 0;

    if (prefersReducedMotion()) {
      overlay.classList.add('active');
    } else {
      requestAnimationFrame(() => overlay.classList.add('active'));
    }
  }

  function hideOverlay() {
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    overlayBackground.setAttribute('aria-hidden', 'true');
    setBackgroundInert(false);
    document.title = originalTitle;

    const timeoutDuration = prefersReducedMotion() ? 0 : TRANSITION_MS;
    setTimeout(() => {
      overlay.style.display = 'none';
      overlayBackground.style.display = 'none';
      document.body.classList.remove('overlay-open');
      overlayContent.innerHTML = '';
    }, timeoutDuration);

    if (lastFocusedElement) {
      lastFocusedElement.focus();
      lastFocusedElement = null;
    }
  }

  function loadOverlayContent(url) {
    overlayContent.innerHTML = '<div class="overlay-loader">Loading content…</div>';

    if (contentCache[url]) {
      displayContent(contentCache[url].html, contentCache[url].title);
      return;
    }

    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load page (${response.status}: ${response.statusText})`);
        }
        return response.text();
      })
      .then((html) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const mainContent = doc.querySelector('main');

        if (!mainContent) {
          throw new Error('Main content not found on the page');
        }

        const title = doc.querySelector('title')?.textContent || document.title;
        contentCache[url] = { html: mainContent.innerHTML, title };
        displayContent(mainContent.innerHTML, title);
      })
      .catch((error) => displayError(url, error.message));
  }

  function displayContent(html, title) {
    overlayContent.innerHTML = html;
    if (title) {
      document.title = title;
      overlay.setAttribute('aria-label', title);
    }
  }

  function displayError(url, message) {
    overlayContent.innerHTML = `
      <div class="error-message">
        <p>Sorry, we couldn't load the requested content.</p>
        <p>Error: ${message}</p>
        <p><button id="retryButton">Try again</button></p>
      </div>
    `;
    document.getElementById('retryButton')?.addEventListener('click', () => loadOverlayContent(url));
  }

  function openOverlay(link) {
    const href = link.getAttribute('href');
    lastFocusedElement = link;
    showOverlay();
    loadOverlayContent(href);
    history.pushState({ overlayUrl: href }, '', href);
  }

  document.addEventListener('click', (event) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    const link = event.target.closest('a');
    if (!link || !isOverlayTarget(link.getAttribute('href'))) return;

    event.preventDefault();
    openOverlay(link);
  });

  closeOverlayBtn.addEventListener('click', (event) => {
    event.preventDefault();
    history.back();
  });

  overlayBackground.addEventListener('click', (event) => {
    if (event.target === overlayBackground) {
      history.back();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && overlay.classList.contains('active')) {
      history.back();
    }
  });

  window.addEventListener('popstate', (event) => {
    if (event.state && event.state.overlayUrl) {
      showOverlay();
      loadOverlayContent(event.state.overlayUrl);
    } else if (overlay.classList.contains('active')) {
      hideOverlay();
    }
  });
});
