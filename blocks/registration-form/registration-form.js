import ffetch from '../../scripts/ffetch.js';
import { createElement } from '../../scripts/scripts.js';

// the name of the sheet where the groups are defined
const GROUP_REGISTRY_SHEET_NAME = 'groups';
// in-memory cache for the group lookup, populated during buildStep2()
let groupsRegistryCache;

function buildStep2(rows, block, groupRegistry) {
  block.append(rows[1]);
  const cols = [...rows[1].children];

  // 0. step1 container
  const stepContainer = createElement('div', 'registration-form-step');
  // 1. build the form
  const formContainer = createElement('div', 'form-container');
  formContainer.append(cols[0]);
  stepContainer.append(formContainer);
  // add form input
  const textBox = createElement('input', 'registration-form-input', {
    required: true,
    placeholder: 'e.g. 012718',
  });
  formContainer.append(textBox);

  const textBoxTooltipContainers = createElement('div');
  const textBoxTooltip = createElement('span', 'registration-form-input-tooltip');
  textBoxTooltip.innerText = '';
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
    const grpInput = textBox.value.toLowerCase();

    groupsRegistryCache = (groupsRegistryCache
                          || await ffetch(groupRegistry)
                            .sheet(GROUP_REGISTRY_SHEET_NAME)
                            .chunks(1000)
                            .all());
    const grpItems = groupsRegistryCache;
    // {
    //   Group Id: "106110T80902",
    //   URL: "https://www.elixirsolutions.com/new-plans"
    // }
    const grpItem = grpItems.filter((rx) => rx['Group Id'].toLowerCase() === grpInput).pop();
    if (grpItem === null || typeof (grpItem) === 'undefined') {
      textBoxTooltip.innerText = 'Please provide a valid Group Number.';
      textBoxTooltip.style.visibility = 'visible';
      textBoxTooltip.style.opacity = 1;
      // Hide the tooltip after 5 seconds
      setTimeout(() => {
        textBoxTooltip.style.opacity = 0;
      }, 5000);
      return;
    }
    // grpItem was found
    const url = grpItem.URL;
    // follow the URL
    window.open(url, '_blank');
  });

  // 2. show the image on the right
  const imageContainer = createElement('div', 'image-container');
  imageContainer.append(cols[1]);
  stepContainer.append(imageContainer);

  block.append(stepContainer);
}

function buildStep1(rows, block, rxBinRegistry) {
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
  textBoxTooltip.innerText = '';
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
    const rxItems = await ffetch(rxBinRegistry).all();
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
    step1Container.remove();
    buildStep2(rows, block, rxBinRegistry);
  });

  // 2. show the image on the right
  const imageContainer = createElement('div', 'image-container');
  imageContainer.append(cols[1]);
  step1Container.append(imageContainer);

  block.append(step1Container);
}

export default function decorate(block) {
  // expect three rows
  const rows = [...block.children];
  if (rows.length < 3) {
    console.log('Registration form expects 3 rows. Make sure to edit the document correctly.');
    return;
  }
  // extract the URL for the lookup data
  const rxBinRegistry = rows[2].querySelector('a').href;
  if (rxBinRegistry === null || typeof (rxBinRegistry) === 'undefined') {
    return;
  }
  buildStep1(rows, block, rxBinRegistry);
}
