import { getMetadata, decorateIcons } from '../../scripts/lib-franklin.js';
import { wrapImgsInLinks } from '../../scripts/scripts.js';
import ffetch from '../../scripts/ffetch.js';

let tId;
function debounce(method, delay) {
  clearTimeout(tId);
  tId = setTimeout(() => {
    method();
  }, delay);
}

async function execSearch(query, resultsContainer) {
  if (query.length === 0) {
    resultsContainer.classList.remove('visible');
  }

  if (query.length >= 3) {
    const regex = new RegExp(query, 'id');
    const results = ffetch('/query-index.json')
      .filter((p) => regex.test(p.title) || regex.test(p.description))
      .limit(10);
    let hasResults = false;
    resultsContainer.innerHTML = '';
    // eslint-disable-next-line no-restricted-syntax
    for await (const res of results) {
      const a = document.createElement('a');
      a.classList.add('search-result');
      a.href = res.path;
      hasResults = true;
      const span = document.createElement('span');
      const titleExec = regex.exec(res.title);
      let titleContent = res.title;
      if (titleExec && titleExec.indices) {
        titleContent = '';
        let lastEnd = 0;
        titleExec.indices.forEach((index) => {
          const [start, end] = index;
          titleContent += res.title.substring(lastEnd, start);
          titleContent += `<mark>${res.title.substring(start, end)}</mark>`;
          lastEnd = end;
        });
        titleContent += res.title.substring(lastEnd);
      }
      span.innerHTML = titleContent;
      a.append(span);
      resultsContainer.append(a);
    }

    if (!hasResults) {
      const span = document.createElement('span');
      span.classList.add('search-no-results');
      span.textContent = 'No Results Found.';
      resultsContainer.append(span);
    }
    resultsContainer.classList.add('visible');
  }
}

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  sections.querySelectorAll('.nav-sections > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // enable nav dropdown keyboard accessibility
  const navDrops = navSections.querySelectorAll('.nav-drop');
  if (isDesktop.matches) {
    navDrops.forEach((drop) => {
      if (!drop.hasAttribute('tabindex')) {
        drop.setAttribute('role', 'button');
        drop.setAttribute('tabindex', 0);
        drop.addEventListener('focus', focusNavSection);
      }
    });
  } else {
    navDrops.forEach((drop) => {
      drop.removeAttribute('role');
      drop.removeAttribute('tabindex');
      drop.removeEventListener('focus', focusNavSection);
    });
  }
  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
  }
}

/**
 * decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // fetch nav content
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta).pathname : '/nav';
  const resp = await fetch(`${navPath}.plain.html`);

  if (resp.ok) {
    const html = await resp.text();

    // decorate nav DOM
    const nav = document.createElement('nav');
    nav.id = 'nav';
    nav.innerHTML = html;

    const classes = ['brand', 'tools', 'sections', 'register'];
    classes.forEach((c, i) => {
      const section = nav.children[i];
      if (section) section.classList.add(`nav-${c}`);
    });

    const navSections = nav.querySelector('.nav-sections');
    if (navSections) {
      navSections.querySelectorAll(':scope > ul > li').forEach((navSection) => {
        if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
        navSection.addEventListener('click', () => {
          if (isDesktop.matches) {
            const expanded = navSection.getAttribute('aria-expanded') === 'true';
            toggleAllNavSections(navSections);
            navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
          }
        });
      });
    }

    const regLink = nav.querySelector('.nav-register a');
    if (regLink) {
      regLink.classList.add('button');
    }

    const search = nav.querySelector('.nav-tools .icon-search');
    if (search) {
      const tools = nav.querySelector('.nav-tools');
      tools.innerHTML = `
      <div class="search-form">
        <label class="sr-only" for="header-search-input">Search</label>
        <input id="header-search-input" class="search-input form-control" type="text" name="fulltext" placeholder="Search" maxlength="100"></input>
        <span class="icon icon-search"></span>
        <div class="search-results"></div>
      </div>`;
      const searchInput = tools.querySelector('.search-input');
      const results = tools.querySelector('.search-results');
      searchInput.addEventListener('keyup', () => {
        debounce(() => {
          const q = searchInput.value;
          execSearch(q, results);
        }, 250);
      });
      document.addEventListener('click', (event) => {
        if (!results.contains(event.target)) {
          results.classList.remove('visible');
        }
      });
    }

    // hamburger for mobile
    const hamburger = document.createElement('div');
    hamburger.classList.add('nav-hamburger');
    hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
        <span class="nav-hamburger-icon"></span>
      </button>`;
    hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
    nav.prepend(hamburger);
    nav.setAttribute('aria-expanded', 'false');
    // prevent mobile nav behavior on window resize
    toggleMenu(nav, navSections, isDesktop.matches);
    isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

    decorateIcons(nav);
    const navWrapper = document.createElement('div');
    navWrapper.className = 'nav-wrapper';
    navWrapper.append(nav);
    wrapImgsInLinks(nav);
    block.insertAdjacentHTML('beforebegin', '<a href="#main" class="sr-only">Skip to main content</a>');
    document.querySelector('main').id = 'main';
    block.append(navWrapper);
  }
}
