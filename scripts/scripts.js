import {
  sampleRUM,
  buildBlock,
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateTemplateAndTheme,
  waitForLCP,
  loadBlocks,
  loadCSS,
  decorateBlock,
} from './lib-franklin.js';

const PRODUCTION_DOMAINS = ['www.elixirsolutions.com'];
const LCP_BLOCKS = []; // add your LCP blocks to the list

function buildNewsColumns(main) {
  if (!document.body.classList.contains('news')) {
    return;
  }

  const h1 = main.querySelector('h1');
  if (!h1) {
    return;
  }
  const section = h1.closest('div');
  const firstColElems = [];
  const secondColElems = [];
  let h1found = false;
  [...section.children].forEach((elem) => {
    if (elem === h1) {
      h1found = true;
    }

    if (h1found) {
      firstColElems.push(elem);
    } else {
      secondColElems.push(elem);
    }
  });
  const columns = buildBlock('columns', [[{ elems: firstColElems }, { elems: secondColElems }]]);
  columns.classList.add('thirds');
  section.append(columns);
}

/**
 * Builds hero block and prepends to main in a new section.
 * A Hero block is only displayed is there's at least
 *   1. an H1 title
 *   2. a picture
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
  if (document.body.classList.contains('news')) {
    return;
  }

  const h1 = main.querySelector('h1');
  if (!h1) {
    return;
  }

  const section = h1.closest('div');
  const picture = section.querySelector('picture');
  if (!picture) {
    return;
  }

  const elems = [...section.childNodes];
  section.append(buildBlock('hero', { elems }));
  main.prepend(section);
}

/**
 * Builds breadcrumb block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildBreadcrumbBlock(main) {
  const title = document.querySelector('head title');

  if (title.innerText !== 'Elixir-Home' && window.isErrorPage !== true) {
    const section = document.createElement('div');
    section.append(buildBlock('breadcrumb', { elems: [] }));
    main.prepend(section);
  }
}

/**
 * Builds accordion blocks from default content
 * @param {Element} main The container element
 */
function buildAccordions(main) {
  const accordions = main.querySelectorAll('.section.accordion');
  accordions.forEach((accordion) => {
    const content = accordion.querySelector('.default-content-wrapper');
    const blockTable = [];
    let row;
    [...content.children].forEach((child) => {
      if (child.nodeName === 'H2') {
        if (row) {
          blockTable.push([{ elems: row }]);
        }
        row = [];
      }
      row.push(child);
    });
    // add last row
    if (row) {
      blockTable.push([{ elems: row }]);
    }

    const block = buildBlock('accordion', blockTable);
    content.append(block);
    content.classList.remove('default-content-wrapper');
  });
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    buildNewsColumns(main);
    buildHeroBlock(main);
    buildBreadcrumbBlock(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * Distinct from buildAutoBlocks because this runs after section decoration
 * for blocks that need to be created after section classes are added
 * @param {Element} main The container element
 */
function buildSectionAutoBlocks(main) {
  try {
    buildAccordions(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Section Auto Blocking failed', error);
  }
}

/**
 * adds container divs to each section and other additional section decoration activities
 * @param {Element} main The container element
 */
function decorateSectionsExt(main) {
  main.querySelectorAll('.section').forEach((section) => {
    const container = document.createElement('div');
    container.classList.add('section-container');
    [...section.children].forEach((child) => container.append(child));
    section.append(container);
  });
}

/**
 * Decorates all blocks in a container element.
 * @param {Element} main The container element
 */
export function decorateBlocks(main) {
  main
    .querySelectorAll('div.section > div > div > div')
    .forEach(decorateBlock);
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateSectionsExt(main);
  buildSectionAutoBlocks(main);
  decorateBlocks(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await waitForLCP(LCP_BLOCKS);
  }
}

/**
 * Adds the favicon.
 * @param {string} href The favicon URL
 */
export function addFavIcon(href) {
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/x-icon';
  link.href = href;
  const existingLink = document.querySelector('head link[rel="icon"]');
  if (existingLink) {
    existingLink.parentElement.replaceChild(link, existingLink);
  } else {
    document.getElementsByTagName('head')[0].appendChild(link);
  }
}

export function decorateLinks(element) {
  const hosts = ['localhost', 'hlx.page', 'hlx.live', ...PRODUCTION_DOMAINS];
  element.querySelectorAll('a').forEach((a) => {
    try {
      if (a.href) {
        const url = new URL(a.href);

        // local links are relative
        // non local links open in a new tab
        const hostMatch = hosts.some((host) => url.hostname.includes(host));
        if (hostMatch) {
          a.href = `${url.pathname.replace('.html', '')}${url.search}${url.hash}`;
        } else {
          a.target = '_blank';
        }
      }
    } catch (e) {
      // something went wrong
      // eslint-disable-next-line no-console
      console.log(e);
    }
  });
}

/**
 * Wraps images followed by links within a matching <a> tag.
 * @param {Element} container The container element
 */
export function wrapImgsInLinks(container) {
  const pictures = container.querySelectorAll('p picture');
  pictures.forEach((pic) => {
    const parent = pic.parentNode;
    if (!parent.nextElementSibling) {
      // eslint-disable-next-line no-console
      console.warn('no next element');
      return;
    }
    const link = parent.nextElementSibling.querySelector('a');
    if (link && link.textContent.includes(link.getAttribute('href'))) {
      link.parentElement.remove();
      link.innerHTML = pic.outerHTML;
      parent.replaceWith(link);
    }
  });
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadBlocks(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  addFavIcon(`${window.hlx.codeBasePath}/icons/favicon_icon.png`);
  decorateLinks(main);
  wrapImgsInLinks(main);

  sampleRUM('lazy');
  sampleRUM.observe(main.querySelectorAll('div[data-block-name]'));
  sampleRUM.observe(main.querySelectorAll('picture > img'));
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
