import { createOptimizedPicture } from '../../scripts/lib-franklin.js';

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
    const cardButtonContainer = row.querySelector('.button-container');
    const cardLink = cardButtonContainer.querySelector('a');
    const clonedLink = cardLink.cloneNode(false);
    clonedLink.className = 'card-link-wrapper';
    cardButtonContainer.remove();
    li.append(clonedLink);

    [...row.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'cards-card-image';
      } else {
        div.className = 'cards-card-body';
        div.insertAdjacentHTML('beforeEnd', `<span class="card-more-cta">${clonedLink.title}</span>`);
      }

      clonedLink.append(div);
    });
    ul.append(li);
  });
  ul.querySelectorAll('img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.textContent = '';
  block.append(ul);
}
