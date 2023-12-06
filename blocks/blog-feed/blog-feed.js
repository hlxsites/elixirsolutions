import ffetch from '../../scripts/ffetch.js';
import {
  decorateIcons,
  decorateBlock,
  loadBlock,
  buildBlock,
  readBlockConfig,
} from '../../scripts/lib-franklin.js';
import {
  getBlogLongDateFormat,
  getTimeElementFormat,
  updateUTCDateToMatchWordDocDate,
} from '../../scripts/date.js';
import { createElement, createOptimizedPicture } from '../../scripts/scripts.js';

function buildSmallPost(post) {
  const postCard = createElement('article', ['blog-post-card', 'blog-post-mini-card']);
  const postDate = new Date(post.date * 1000); /* Unix timestamp convert to UTC date format */
  updateUTCDateToMatchWordDocDate(postDate);

  const longDateFormat = getBlogLongDateFormat(postDate);
  const dashedDateFormat = getTimeElementFormat(postDate);

  postCard.innerHTML = `
    <div class="blog-post-content">
      <a class="post-title" href="${post.path}">${post.title}</a>
      <time class="post-date" datetime="${dashedDateFormat}">${longDateFormat}</time>      
      <p class="post-description">${post.description}</p>
    </div>
  `;

  return postCard;
}

function buildPost(blogPath, post, eager) {
  const postCard = createElement('article', 'blog-post-card');
  const postDate = new Date(post.date * 1000); /* Unix timestamp convert to UTC date format */
  updateUTCDateToMatchWordDocDate(postDate);

  const longDateFormat = getBlogLongDateFormat(postDate);
  const dashedDateFormat = getTimeElementFormat(postDate);

  postCard.innerHTML = `
      <div class="blog-post-image">
        <a href="${post.path}">${createOptimizedPicture(post.image, '', eager).outerHTML}</a>
      </div>
      <div class="blog-post-content">
        <a class="post-title" href="${post.path}">${post.title}</a>
        <time class="post-date" datetime="${dashedDateFormat}">${longDateFormat}</time>
        <ul class="post-tags">
        </ul>
        <div class="post-description">
          <p>${post.description}</p>
          <a href="${post.path}">Read More<span class="sr-only"> about ${post.title}</span></a>
        </div>
      </div>
    </a>
  `;

  const tagsUl = postCard.querySelector('.post-tags');
  const tags = JSON.parse(post.tags);
  tags.forEach((tag) => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="/${blogPath}/tag?tag=${encodeURIComponent(tag)}"><span class="icon icon-tag"></span>${tag}</a>`;
    tagsUl.append(li);
  });

  return postCard;
}

async function buildMiniFeed(block, ul) {
  const limit = block.dataset.limit ? Number(block.dataset.limit) : 4;
  const blogPath = block.dataset.blogPath ? block.dataset.blogPath : 'blog';
  const hideEmailForm = block.dataset.hideBlogEmailForm ? block.dataset.hideBlogEmailForm.toLowerCase() === 'true' : false;

  const blogPosts = ffetch('/query-index.json')
    .filter((p) => p.path.startsWith(`/${blogPath}/`))
    .filter((p) => !p.path.endsWith(`/${blogPath}/tag`))
    .slice(0, limit + 1);

  let i = 0;
  // eslint-disable-next-line no-restricted-syntax
  for await (const post of blogPosts) {
    const li = document.createElement('li');
    if (i === 0) {
      const callout = buildPost(blogPath, post);
      callout.classList.add('blog-post-callout-card');
      block.prepend(callout);
    } else {
      li.append(buildSmallPost(post));
      ul.append(li);
    }

    i += 1;
  }

  if (!hideEmailForm) {
    const formFragmentWrapper = createElement('div');
    block.append(formFragmentWrapper);
    const fragment = buildBlock('blog-email-form', '');
    formFragmentWrapper.append(fragment);
    decorateBlock(fragment);
    await loadBlock(fragment);
    formFragmentWrapper.classList.add('appear');
  } else {
    const emptyWrapper = createElement('div');
    block.append(emptyWrapper);
  }
}

async function buildBlogFeed(blogPath, ul, pageNum, pagesElem) {
  const limit = 10;
  const offset = pageNum * limit;
  let morePages = false;
  const usp = new URLSearchParams(window.location.search);
  const tag = usp.get('tag');

  // update page title
  if (tag) document.title += ` "${tag}"`;

  const blogPosts = ffetch('/query-index.json')
    .filter((p) => (tag ? p.path.startsWith(`/${blogPath}/`) && p.tags.includes(tag) : p.path.startsWith(`/${blogPath}/`)))
    .filter((p) => !p.path.endsWith(`/${blogPath}/tag`))
    .slice(offset, offset + limit + 1);

  let i = 0;
  const newUl = document.createElement('ul');
  // eslint-disable-next-line no-restricted-syntax
  for await (const post of blogPosts) {
    if (i >= limit) {
      // skip render, but know we have more page
      morePages = true;
      break;
    }

    const li = document.createElement('li');
    li.append(buildPost(blogPath, post, i < 1));
    newUl.append(li);

    i += 1;
  }

  // pageNum is stored as a 0-based index
  // but when passed as a url param, it's normalized to be 1 based
  // thus the difference b/w data-page (-1 | +1) and page (0 || +2)
  // see also where pageNum is initialized in decorate
  pagesElem.innerHTML = `
      <ul class="pages">
        <li class="prev"><a data-page="${pageNum - 1}" href="${window.location.pathname}?page=${pageNum}"><span class="icon icon-next"><span class="sr-only">Previous Page</span></a></li>
        <li class="cur"><span>${pageNum + 1}</span></li>
        <li class="next"><a data-page="${pageNum + 1}" href="${window.location.pathname}?page=${pageNum + 2}"><span class="icon icon-next"></span><span class="sr-only">Next Page</span></a></li>
      </ul>
    `;

  if (pageNum === 0) {
    pagesElem.querySelector('.prev').remove();
  }

  if (!morePages) {
    pagesElem.querySelector('.next').remove();
  }

  pagesElem.querySelectorAll('li > a').forEach((link) => {
    link.addEventListener('click', (evt) => {
      evt.preventDefault();
      buildBlogFeed(blogPath, ul, Number(link.dataset.page), pagesElem);
    });
  });

  await decorateIcons(pagesElem);
  await decorateIcons(newUl);

  ul.innerHTML = newUl.innerHTML;
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
}

export default function decorate(block) {
  const blogPathByUrl = window.location.pathname.startsWith('/member-blog') ? 'member-blog' : 'blog';
  const cfg = readBlockConfig(block);
  block.dataset.limit = cfg.limit || 4;
  block.dataset.blogPath = cfg.blogpath || blogPathByUrl;
  block.innerHTML = '';
  const observer = new IntersectionObserver(async (entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      observer.disconnect();
      const small = block.classList.contains('mini');
      const ul = document.createElement('ul');
      ul.classList.add('blog-list');
      block.append(ul);

      if (small) {
        block.dataset.hideBlogEmailForm = cfg.hideblogemailform ? cfg.hideblogemailform.toLowerCase() === 'true' : false;
        await buildMiniFeed(block, ul);
        return;
      }

      const pagesElem = document.createElement('div');
      pagesElem.classList.add('blog-pages');
      block.append(pagesElem);

      const usp = new URLSearchParams(window.location.search);
      const page = usp.get('page');
      const pageNum = Number(!page ? '0' : page - 1);
      buildBlogFeed(block.dataset.blogPath, ul, pageNum, pagesElem);
    }
  });
  observer.observe(block);
}
