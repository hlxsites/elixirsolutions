export function addDropdown(contentBox) {
  if (contentBox == null || contentBox.querySelector('ul') == null) {
    return;
  }

  const dropDownSourceElement = contentBox.querySelector('ul > li:first-child');
  // by convention the title is the first item in the unordered list
  const dropdownTitle = dropDownSourceElement.textContent.split('\n')[0];

  const selectEl = document.createElement('select');
  const ul = contentBox.querySelector('ul > li > ul');
  ul.querySelectorAll('li').forEach((liElement) => {
    const t = liElement.querySelector('a');
    if (t == null) {
      return;
    }
    // Create a new <option> element
    const optionElement = document.createElement('option');
    optionElement.text = t.textContent;
    optionElement.value = t.href;
    selectEl.appendChild(optionElement);
  });
  contentBox.querySelector('ul').remove();
  // insert the button
  const btnContainer = contentBox.querySelector('.button-container');
  const btn = contentBox.querySelector('.button-container > a');
  btn.href = selectEl.options[selectEl.selectedIndex].value;
  contentBox.insertBefore(selectEl, btnContainer);

  // add an event listener to the dropdown to redirect to the selected link
  selectEl.addEventListener('change', () => {
    const selectedOption = selectEl.value;
    btn.href = selectedOption;
  });

  // insert the title of the dropdown
  const titleEl = document.createElement('h5');
  titleEl.textContent = dropdownTitle;
  contentBox.insertBefore(titleEl, selectEl);
}

export function removeEmptyPTags(element) {
  element.querySelectorAll('p').forEach((p) => {
    // get rid of empty p tags
    if (!p.hasChildNodes()) {
      p.remove();
    }
  });
}

export default function decorate(block) {
  const elementContainer = block.querySelector(':scope > div > div');
  const rightBox = document.createElement('div');
  rightBox.classList.add('hero-image-container');
  rightBox.append(elementContainer.querySelector('picture'));
  block.append(rightBox);

  const leftBox = document.createElement('div');
  leftBox.classList.add('hero-content-container');
  leftBox.append(...elementContainer.children);

  addDropdown(leftBox);

  block.prepend(leftBox);
  elementContainer.parentElement.remove();
  removeEmptyPTags(block);
}
