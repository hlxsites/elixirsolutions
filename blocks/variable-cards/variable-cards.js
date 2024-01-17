import { decorateIcons } from '../../scripts/lib-franklin.js';
import { createOptimizedPicture } from '../../scripts/scripts.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');

  if (block.children.length % 4 === 0) {
    block.classList.add('cards-four-up');
  } else {
    block.classList.add('cards-three-up');
  }

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    const cardLink = row.querySelector('.button-container > a');
    if (cardLink) {
      const cardButtonContainer = cardLink.closest('.button-container');

      const cardLinkTitle = cardLink.textContent;
      cardLink.innerHTML = '';
      cardLink.className = 'card-link-wrapper';
      li.append(cardLink);

      [...row.children].forEach((div) => {
        if (div.children.length === 1 && div.querySelector('picture')) {
          div.className = 'cards-card-image';
          const imgEl = div.querySelector('img');
          imgEl.setAttribute('alt', '');
        } else {
          div.className = 'cards-card-body';
          if (div !== cardButtonContainer) cardButtonContainer.remove();
          div.insertAdjacentHTML('beforeEnd', `<span class="card-more-cta">${cardLinkTitle}<span class="icon icon-arrow-right"></span></span>`);
        }

        cardLink.append(div);
      });
    } else {
      [...row.children].forEach((div) => {
        if (div.children.length === 1 && div.querySelector('picture')) {
          div.className = 'cards-card-image';
        } else {
          div.className = 'cards-card-body';
        }

        li.append(div);
      });
    }
    ul.append(li);
  });
  decorateIcons(ul);
  ul.querySelectorAll('img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.textContent = '';
  block.append(ul);

}
