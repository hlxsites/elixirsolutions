import ffetch from '../../scripts/ffetch.js';
import { createElement } from '../../scripts/scripts.js';

const RXBIN_REGISTRY = '/register-login/register-login.json';
//   const GROUP_REGISTRY = '/register-login.json?sheet=groups';

function buildStep1(rows) {
  rows[1].remove();
  rows[2].remove();
  const cols = [...rows[0].children];
  // 0. step1 container
  const step1Container = createElement('div', 'registration-form-step');
  // 1. build the form
  const formContainer = createElement('div', 'form-container');
  formContainer.append(cols[0]);
  step1Container.append(formContainer);
  // add form input
  const textBox = createElement('input', 'registration-form-input', {
    required: true,
    placeholder: 'e.g. 012718',
  });
  formContainer.append(textBox);

  const textBoxTooltipContainers = createElement('div');
  const textBoxTooltip = createElement('span', 'registration-form-input-tooltip');
  textBoxTooltip.innerText = 'TEXXTTTT';
  formContainer.append(textBoxTooltipContainers);
  textBoxTooltipContainers.append(textBoxTooltip);

  // add button
  const searchBtn = createElement('button', 'button', {
    type: 'submit',
  });
  searchBtn.innerText = 'Search';
  formContainer.append(searchBtn);

  searchBtn.addEventListener('click', async (event) => {
    event.preventDefault();
    const rxInput = textBox.value.toLowerCase();
    // {
    //     Rx Bin: "3585",
    //     Requires Group Lookup: "No",
    //     URL: "https://member.envisionpharmacies.com/PortalUser/EpharmPortalSignin"
    // }
    const rxItems = await ffetch(RXBIN_REGISTRY).all();
    const rxItem = rxItems.filter((rx) => rx['Rx Bin'] === rxInput).pop();
    if (rxItem === null || typeof (rxItem) === 'undefined') {
      textBoxTooltip.innerText = 'Please provide a valid Rx Bin Number.';
      textBoxTooltip.style.visibility = 'visible';
      textBoxTooltip.style.opacity = 1;
      // Hide the tooltip after 5 seconds
      setTimeout(() => {
        textBoxTooltip.style.opacity = 0;
      }, 5000);
      return;
    }
    // rxItem is found
    if (rxItem['Requires Group Lookup'] === 'No') {
      const url = rxItem.URL;
      // follow the URL
      window.open(url, '_blank');
    }
    // TODO: move to step 2 for the form
  });

  // 2. show the image on the right
  const imageContainer = createElement('div', 'image-container');
  imageContainer.append(cols[1]);
  step1Container.append(imageContainer);

  return step1Container;
}

export default function decorate(block) {
  // expect three rows
  const rows = [...block.children];
  if (rows.length < 3) {
    console.log('Registration form expects 3 rows. Make sure to edit the document correctly.');
    return;
  }
  // TODO: depending on query params, set the correct step
  block.append(buildStep1(rows));
}
