import ffetch from '../../scripts/ffetch.js';
import { createOptimizedPicture, decorateIcons } from '../../scripts/lib-franklin.js';

function buildSmallPost(post) {
  const postCard = document.createElement('div');
  postCard.classList.add('blog-post-card', 'blog-post-mini-card');

  postCard.innerHTML = `
    <div class="blog-post-content">
      <a class="post-title" href="${post.path}">${post.title}</a>
      <p class="post-description">${post.description}</p>
    </div>
  `;

  return postCard;
}

function buildPost(post, eager) {
  const postCard = document.createElement('div');
  postCard.classList.add('blog-post-card');

  postCard.innerHTML = `
      <div class="blog-post-image">
        <a href="${post.path}">${createOptimizedPicture(post.image, `Teaser image for ${post.title}`, eager).outerHTML}</a>
      </div>
      <div class="blog-post-content">
        <a class="post-title" href="${post.path}">${post.title}</a>
        <ul class="post-tags">
        </ul>
        <a class="post-description" href="${post.path}">
          <p>${post.description}</p>
          <span>Read More</span>
        </a>
      </div>
    </a>
  `;

  const tagsUl = postCard.querySelector('.post-tags');
  const tags = JSON.parse(post.tags);
  tags.forEach((tag) => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="/blog/tag?tag=${encodeURIComponent(tag)}"><span class="icon icon-tag"></span>${tag}</a>`;
    tagsUl.append(li);
  });

  decorateIcons(postCard);
  return postCard;
}

async function buildMiniFeed(block, ul) {
  const blogPosts = ffetch('/query-index.json')
    .filter((p) => p.path.startsWith('/blog/'))
    .slice(0, 4);

  let i = 0;
  // eslint-disable-next-line no-restricted-syntax
  for await (const post of blogPosts) {
    const li = document.createElement('li');
    if (i === 0) {
      const callout = buildPost(post);
      callout.classList.add('blog-post-callout-card');
      block.prepend(callout);
    } else {
      li.append(buildSmallPost(post));
      ul.append(li);
    }

    i += 1;
  }

  const formWrapper = document.createElement('div');
  // todo add insight form block
  block.append(formWrapper);
}

async function buildBlogFeed(ul, pageNum, pagesElem) {
  const limit = 10;
  const offset = pageNum * limit;
  let morePages = false;
  const usp = new URLSearchParams(window.location.search);
  const tag = usp.get('tag');
  const blogPosts = ffetch('/query-index.json')
    .filter((p) => (tag ? p.path.startsWith('/blog/') && p.tags.includes(tag) : p.path.startsWith('/blog/')))
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
    li.append(buildPost(post, i < 1));
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
      buildBlogFeed(ul, Number(link.dataset.page), pagesElem);
    });
  });

  decorateIcons(pagesElem);
  ul.innerHTML = newUl.innerHTML;
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
}

export default function decorate(block) {
  const observer = new IntersectionObserver(async (entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      observer.disconnect();
      const small = block.classList.contains('mini');
      const ul = document.createElement('ul');
      ul.classList.add('blog-list');
      block.append(ul);

      if (small) {
        await buildMiniFeed(block, ul);
        return;
      }

      const pagesElem = document.createElement('div');
      pagesElem.classList.add('blog-pages');
      block.append(pagesElem);

      const usp = new URLSearchParams(window.location.search);
      const page = usp.get('page');
      const pageNum = Number(!page ? '0' : page - 1);
      buildBlogFeed(ul, pageNum, pagesElem);
    }
  });
  observer.observe(block);
}
