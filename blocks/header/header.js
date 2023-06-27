import { getMetadata, decorateIcons } from '../../scripts/lib-franklin.js';
import { createElement, wrapImgsInLinks } from '../../scripts/scripts.js';
import ffetch from '../../scripts/ffetch.js';

let tId;
function debounce(method, delay) {
  clearTimeout(tId);
  tId = setTimeout(() => {
    method();
  }, delay);
}

function getSearchResultsContainer(searchInput) {
  let resultsContainer;
  let nextSibling = searchInput.nextElementSibling;
  while (!resultsContainer && nextSibling) {
    if (nextSibling.classList.contains('search-results')) {
      resultsContainer = nextSibling;
    }
    nextSibling = nextSibling.nextElementSibling;
  }

  return resultsContainer;
}

function clearSelectedSearchOption(searchInput, resultsContainer) {
  searchInput.removeAttribute('aria-activedescendant');
  resultsContainer.querySelector('[aria-selected]')?.removeAttribute('aria-selected');
}

function setSelectedSearchOption(searchInput, resultsContainer, option) {
  clearSelectedSearchOption(searchInput, resultsContainer);
  option.setAttribute('aria-selected', true);
  searchInput.setAttribute('aria-activedescendant', option.id);
  // option.querySelector('a').focus();
}

function incrementSelectedSearchOption(searchInput, resultsContainer, forward) {
  const selected = resultsContainer.querySelector('[aria-selected]');
  let newSelected;
  if (forward) {
    newSelected = (selected && selected.nextElementSibling) ? selected.nextElementSibling : resultsContainer.querySelector('.search-result:first-child');
  } else {
    newSelected = (selected && selected.previousElementSibling) ? selected.previousElementSibling : resultsContainer.querySelector('.search-result:last-child');
  }

  clearSelectedSearchOption(searchInput, resultsContainer);
  if (newSelected) {
    // console.log('incremented');
    newSelected.setAttribute('aria-selected', true);
    // newSelected.querySelector('a').focus();
    searchInput.setAttribute('aria-activedescendant', newSelected.id);
  }
}

async function execSearch(searchInput, resultsContainer) {
  const query = searchInput.value;
  if (query.length === 0) {
    searchInput.setAttribute('aria-expanded', false);
  }

  if (query.length >= 3) {
    const regex = new RegExp(query, 'id');
    const results = ffetch('/query-index.json')
      .filter((p) => regex.test(p.title) || regex.test(p.description))
      .limit(10);
    let hasResults = false;
    resultsContainer.innerHTML = '';
    let i = 0;
    // eslint-disable-next-line no-restricted-syntax
    for await (const res of results) {
      const li = createElement('li', 'search-result', {
        id: `search-option-${i}`,
        role: 'option',
      });
      i += 1;
      const a = document.createElement('a');
      a.href = res.path;
      li.append(a);
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
      resultsContainer.append(li);

      li.addEventListener('mouseover', () => {
        setSelectedSearchOption(searchInput, resultsContainer, li);
      });
    }

    if (!hasResults) {
      const li = createElement('li', ['search-result', 'search-no-results'], {
        id: 'search-option-0',
        role: 'option',
      }, 'No Results Found.');
      resultsContainer.append(li);
    }
    incrementSelectedSearchOption(searchInput, resultsContainer, true);
    searchInput.setAttribute('aria-expanded', true);
  }
}

function searchKeyDown(event) {
  const {
    key,
    altKey,
    ctrlKey,
    shiftKey,
  } = event;
  let stop = false;
  const searchInput = event.target;
  const resultsContainer = getSearchResultsContainer(searchInput);

  if (ctrlKey || shiftKey) {
    return;
  }

  switch (key) {
    case 'Down':
    case 'ArrowDown':
      if (!altKey) {
        incrementSelectedSearchOption(searchInput, resultsContainer, true);
      }
      stop = true;
      break;
    case 'Up':
    case 'ArrowUp':
      if (!altKey) {
        incrementSelectedSearchOption(searchInput, resultsContainer, false);
      }
      stop = true;
      break;
    case 'Esc':
    case 'Escape': {
      const expanded = searchInput.getAttribute('aria-expanded') === 'true';
      searchInput.setAttribute('aria-expanded', false);
      clearSelectedSearchOption(searchInput, resultsContainer);
      if (expanded) {
        stop = true;
      }
      break;
    }
    case 'Tab':
      searchInput.setAttribute('aria-expanded', false);
      clearSelectedSearchOption(searchInput, resultsContainer);
      break;
    default:
      break;
  }

  if (stop) {
    event.stopPropagation();
    event.preventDefault();
  }
}

function searchKeyUp(event) {
  const {
    key,
  } = event;
  const searchInput = event.target;
  const resultsContainer = getSearchResultsContainer(searchInput);
  let stop = false;

  switch (key) {
    case 'Enter': {
      const expanded = searchInput.getAttribute('aria-expanded') === 'true';
      const selected = resultsContainer.querySelector('[aria-selected] a');
      if (expanded && selected) {
        window.location = selected.href;
        stop = true;
      }
      break;
    }
    case 'Down':
    case 'ArrowDown':
    case 'Up':
    case 'ArrowUp': {
      const expanded = searchInput.getAttribute('aria-expanded') === 'true';
      if (expanded) {
        stop = true;
      }
      break;
    }
    case 'Left':
    case 'ArrowLeft':
    case 'Right':
    case 'ArrowRight':
    case 'Tab':
    case 'Esc':
    case 'Escape':
      stop = true;
      break;
    default:
      break;
  }

  if (!stop) {
    debounce(() => {
      execSearch(searchInput, resultsContainer);
    }, 250);
  } else {
    event.stopPropagation();
    event.preventDefault();
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
      <label class="sr-only" for="header-search-input">Search</label>
      <div class="search-form">
        <input id="header-search-input" class="search-input form-control" type="text" name="fulltext" placeholder="Search" maxlength="100"
          role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="header-search-results-grid"></input>
        <span class="icon icon-search"></span>
        <ul class="search-results" id="header-search-results-grid" role="listbox" aria-label="Search Results"></div>
      </div>`;
      const searchInput = tools.querySelector('.search-input');
      const results = tools.querySelector('.search-results');
      searchInput.addEventListener('keyup', searchKeyUp);
      searchInput.addEventListener('keydown', searchKeyDown);
      document.addEventListener('click', (event) => {
        if (!results.contains(event.target)) {
          searchInput.setAttribute('aria-expanded', false);
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
