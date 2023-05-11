export default function decorate(block) {
  const elementContainer = block.querySelector(':scope > div > div');
  const rightBox = document.createElement('div');
  rightBox.classList.add('hero-image-container');
  rightBox.append(elementContainer.querySelector('picture'));
  block.append(rightBox);

  const leftBox = document.createElement('div');
  leftBox.classList.add('hero-content-container');
  leftBox.append(...elementContainer.children);
  block.prepend(leftBox);
  elementContainer.parentElement.remove();

  // leftBox.append(h1);
  // if (h2 !== null) leftBox.append(h2);
  // if (cta !== null) {
  //   leftBox.append(cta);
  //   cta.classList.add('button');
  // }
  // add two divs for two background circles
  const c1 = document.createElement('div');
  c1.classList.add('bg-circle-1', 'bg-circle');
  leftBox.append(c1);
  const c2 = document.createElement('div');
  c2.classList.add('bg-circle-2', 'bg-circle');
  leftBox.append(c2);
}
