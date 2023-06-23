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
  getMetadata,
} from './lib-franklin.js';

const PRODUCTION_DOMAINS = ['www.elixirsolutions.com'];
const LCP_BLOCKS = ['hero']; // add your LCP blocks to the list

/**
 * create an element.
 * @param {string} tagName the tag for the element
 * @param {string|Array<string>} classes classes to apply
 * @param {object} props properties to apply
 * @param {string|Element} html content to add
 * @returns the element
 */
export function createElement(tagName, classes, props, html) {
  const elem = document.createElement(tagName);
  if (classes) {
    const classesArr = (typeof classes === 'string') ? [classes] : classes;
    elem.classList.add(...classesArr);
  }
  if (props) {
    Object.keys(props).forEach((propName) => {
      elem.setAttribute(propName, props[propName]);
    });
  }

  if (html) {
    const appendEl = (el) => {
      if (el instanceof HTMLElement || el instanceof SVGElement) {
        elem.append(el);
      } else {
        elem.insertAdjacentHTML('beforeend', el);
      }
    };

    if (Array.isArray(html)) {
      html.forEach(appendEl);
    } else {
      appendEl(html);
    }
  }

  return elem;
}

/**
 * load a script by adding to page head
 * @param {string} url the script src url
 * @param {string} type the script type
 * @param {function} callback a funciton to callback after loading
 */
export function loadScript(url, type, callback) {
  const head = document.querySelector('head');
  let script = head.querySelector(`script[src="${url}"]`);
  if (!script) {
    script = document.createElement('script');
    script.src = url;
    if (type) script.setAttribute('type', type);
    head.append(script);
    script.onload = callback;
    return script;
  }
  return script;
}

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
  if (document.body.classList.contains('news') || document.body.classList.contains('blog')) {
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

  const elems = [...section.children];
  const filtered = elems.filter((el) => !el.classList.contains('section-metadata'));
  const block = buildBlock('hero', { elems: filtered });
  section.append(block);
  main.prepend(section);
}

/**
 * Builds breadcrumb block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildBreadcrumbBlock(main) {
  if (window.location.pathname !== '/' && window.isErrorPage !== true && !getMetadata('hideBreadcrumb')) {
    const section = createElement('div');
    section.append(buildBlock('breadcrumb', { elems: [] }));
    main.prepend(section);
  }
}

async function buildBlogFormBlock(main) {
  if (document.body.classList.contains('blog')) {
    const section = main.querySelector('main > div:last-child');
    const fragment = buildBlock('blog-email-form', '');
    section.append(fragment);
  }
}

/**
 * Builds blog topics blocks from default content
 * @param {Element} main The container element
 */
function buildBlogTopicsBlock(main) {
  const blogFeed = main.querySelector('.blog-feed:not(.mini)');
  if (blogFeed) {
    const section = createElement('div');
    const block = buildBlock('blog-topics', '');
    section.append(block);
    main.append(section);
  } else if (document.body.classList.contains('blog')) {
    const section = main.querySelector('main > div:last-child');
    section.prepend(buildBlock('blog-topics', ''));
  }
}

/**
 * Builds blog topics blocks from default content
 * @param {Element} main The container element
 */
function buildBlogSocialsBlock(main) {
  const blogFeed = main.querySelector('.blog-feed:not(.mini)');
  if (!blogFeed && document.body.classList.contains('blog')) {
    const lastSection = main.querySelector(':scope > div:last-child');
    const section = createElement('div');
    section.append(buildBlock('blog-socials', ''));
    lastSection.insertAdjacentElement('beforebegin', section);
  }
}

/**
 * Builds accordion blocks from default content
 * @param {Element} main The container element
 */
function buildAccordions(main) {
  const accordionSectionContainers = main.querySelectorAll('.section.accordion > .section-container');
  accordionSectionContainers.forEach((accordion) => {
    const contentWrappers = accordion.querySelectorAll(':scope > div');
    const blockTable = [];
    let row;
    const newWrapper = createElement('div');
    contentWrappers.forEach((wrapper) => {
      let removeWrapper = true;
      [...wrapper.children].forEach((child) => {
        if (child.nodeName === 'H2') {
          if (row) {
            blockTable.push([{ elems: row }]);
          }
          row = [];
        }
        if (row) {
          row.push(child);
        } else {
          // if there is content in the section before the first h2
          // then that content is preserver
          // otherwise, we remove the wrapper
          removeWrapper = false;
        }
      });

      if (removeWrapper) wrapper.remove();
    });
    // add last row
    if (row) {
      blockTable.push([{ elems: row }]);
    }

    const block = buildBlock('accordion', blockTable);
    newWrapper.append(block);
    accordion.append(newWrapper);
    decorateBlock(block);
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
    buildBlogSocialsBlock(main);
    buildBlogTopicsBlock(main);
    buildBlogFormBlock(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * adds container divs to each section and other additional section decoration activities
 * @param {Element} main The container element
 */
function decorateSectionsExt(main) {
  main.querySelectorAll('.section').forEach((section) => {
    const container = createElement('div', 'section-container');
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

export default function decorateBlogImage(main) {
  if (!document.body.classList.contains('blog')) return;
  main
    .querySelectorAll('.default-content-wrapper picture')
    .forEach((pic, i) => {
      const parent = pic.parentNode;
      if (i === 0) return; // hero image

      const textContent = parent.innerText.replaceAll('\n', '').trim();
      // inline image
      if (textContent.length !== 0 || parent.children.length > 1) {
        parent.classList.add('blog-img-inline');
        const link = pic.nextSibling;
        // inline image with link (wrap image in link)
        if (link && link.tagName === 'A' && link.textContent.includes(link.getAttribute('href'))) {
          link.innerHTML = pic.outerHTML;
          pic.replaceWith(link);
        }
      } else if (textContent.length === 0 && parent.children.length === 1) {
        parent.classList.add('blog-img-center');
      }
    });
}

/**
 * redecorate button to make some changes after franklion default decoration runs
 * @param {Element} element container element
 */
function reDecorateButtons(element) {
  element.querySelectorAll('a').forEach((a) => {
    // remove redundant titles
    if (a.title === a.textContent) {
      a.title = '';
    }
  });
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
          a.rel = 'noopener noreferrer';
          const icon = createElement('span', ['icon', 'icon-external-link']);
          a.insertAdjacentElement('beforeend', icon);
          const linkTitle = a.title;
          a.title = linkTitle ? `${linkTitle} (opens an external site)` : 'Link opens an external site';
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
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main, isFragment) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  reDecorateButtons(main);
  decorateLinks(main);
  decorateIcons(main);
  if (!isFragment) {
    buildAutoBlocks(main);
  }
  decorateSections(main);
  decorateSectionsExt(main);
  decorateBlocks(main);
  decorateBlogImage(main);
  buildAccordions(main);
}

/**
 * Set the focus to main or the hero (if it exists) when LCP is reached.
 * @param {Element} elem the container element to set focus on
 */
function setFocus(elem) {
  const hero = elem.querySelector('.block.hero');
  const focusElem = hero || elem;
  focusElem.focus();
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
    setFocus(main);
  }
}

/**
 * Adds the favicon.
 * @param {string} href The favicon URL
 */
export function addFavIcon(href) {
  const link = createElement('link', '', {
    rel: 'icon',
    type: 'image/x-icon',
    href,
  });

  const existingLink = document.querySelector('head link[rel="icon"]');
  if (existingLink) {
    existingLink.parentElement.replaceChild(link, existingLink);
  } else {
    document.getElementsByTagName('head')[0].appendChild(link);
  }
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
      pic.replaceWith(link);
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
