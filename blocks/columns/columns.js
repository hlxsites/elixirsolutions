import { createElement } from '../../scripts/scripts.js';

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);
  const imgColClass = 'columns-img-col';

  const isTeaser = block.classList.contains('teaser');

  // teaser is also a variation of thirds
  if (isTeaser) {
    block.classList.add('thirds');
  }

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        // less than or equals to two in case image is wrapped with <a> tag
        if (picWrapper && picWrapper.children.length <= 2) {
          // picture is only content in column
          picWrapper.classList.add(imgColClass);
        }

        if (isTeaser) {
          const teaserWrapper = createElement('div', 'teaser-wrapper');
          ['style-a', 'style-b', 'style-c'].forEach((style) => {
            const bubble = createElement('span', ['bubble', style], {
              'aria-hidden': 'true',
            });
            teaserWrapper.appendChild(bubble);
          });
          teaserWrapper.appendChild(pic);
          col.appendChild(teaserWrapper);
        }
      }
    });
  });
}
