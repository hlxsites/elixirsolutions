import ffetch from '../../scripts/ffetch.js';
import { createOptimizedPicture, decorateIcons } from '../../scripts/lib-franklin.js';
import { createElement } from '../../scripts/scripts.js';

function buildPost(post, eager) {
  const description = post.content.querySelector('h1 + p');
  const title = post.content.querySelector('h1').textContent;

  const postCard = createElement('div', 'news-card', {}, `
      <div class="news-image">
        <a href="${post.path}">${createOptimizedPicture(post.image, `Teaser image for ${title}`, eager).outerHTML}</a>
      </div>
      <div class="news-content">
        <a class="post-title" href="${post.path}">${title}</a>
        <a class="post-description" href="${post.path}">
          <p>${description ? description.textContent : post.description}</p>
          <span>Read More</span>
        </a>
      </div>
    </a>
  `);

  return postCard;
}

async function buildNewsFeed(ul, pageNum, pagesElem) {
  const limit = 5;
  const offset = pageNum * limit;
  let morePages = false;
  const newsFeed = ffetch('/query-index.json')
    .filter((p) => p.path.startsWith('/news/'))
    .slice(offset, offset + limit + 1)
    .follow('path', 'content');

  let i = 0;
  const newUl = createElement('ul');
  // eslint-disable-next-line no-restricted-syntax
  for await (const post of newsFeed) {
    if (i >= limit) {
      // skip render, but know we have more page
      morePages = true;
      break;
    }

    const li = createElement('li');
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
      buildNewsFeed(ul, Number(link.dataset.page), pagesElem);
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
      const ul = createElement('ul', 'news-list');
      block.append(ul);

      const pagesElem = createElement('div', 'news-pages');
      block.append(pagesElem);

      const usp = new URLSearchParams(window.location.search);
      const page = usp.get('page');
      const pageNum = Number(!page ? '0' : page - 1);
      buildNewsFeed(ul, pageNum, pagesElem);
    }
  });
  observer.observe(block);
}
