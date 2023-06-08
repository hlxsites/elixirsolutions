import ffetch from '../../scripts/ffetch.js';
import { createElement } from '../../scripts/scripts.js';

// the name of the sheet where the groups are defined
const GROUP_REGISTRY_SHEET_NAME = 'groups';
// in-memory cache for the group lookup
// populated when step 2 is displayed
let groupsRegistryCache;

function buildForm(formLabelText, serchFn) {
  const wrapper = createElement('div', 'form-wrapper');
  const lbl = createElement('label', ['registration-form-input-label'], {
    for: 'search-text',
  });
  lbl.innerText = formLabelText;
  wrapper.append(lbl);

  wrapper.append(createElement('input', ['registration-form-input', 'form-control'], {
    required: true,
    placeholder: 'e.g. 012718',
    id: 'search-text',
  }));

  const textBoxTooltipContainers = createElement('div');
  const textBoxTooltip = createElement('span', 'registration-form-input-tooltip');
  textBoxTooltip.innerText = '';
  wrapper.append(textBoxTooltipContainers);
  textBoxTooltipContainers.append(textBoxTooltip);

  const searchBtn = createElement('button', 'button', {
    type: 'submit',
  }, 'Search');
  searchBtn.addEventListener('click', serchFn);
  wrapper.append(searchBtn);

  return wrapper;
}

function decorateFormSteps(row, i, serchFn) {
  row.classList.add('registration-form-step', `registration-form-step-${i}`);
  const formContainer = row.children[0];
  formContainer.classList.add('form-container');
  const formLabel = formContainer.querySelector('strong');
  const formLabelText = formLabel.innerText;
  formLabel.remove();
  const form = buildForm(formLabelText, serchFn);
  formContainer.append(form);

  const imageContainer = row.children[1];
  imageContainer.classList.add('image-container');
}

async function stepOneLookup(lookupUrl, lookupValue, textBoxTooltip, block) {
  // {
  //     Rx Bin: "3585",
  //     Requires Group Lookup: "No",
  //     URL: "https://member.envisionpharmacies.com/PortalUser/EpharmPortalSignin"
  // }
  const rxItem = await ffetch(lookupUrl)
    .filter((rx) => rx['Rx Bin'] === lookupValue)
    .first();
  // const rxItem = rxItems.filter((rx) => rx['Rx Bin'] === rxInput).pop();
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
    return;
  }

  // load the cache for next step
  groupsRegistryCache = ffetch(lookupUrl)
    .sheet(GROUP_REGISTRY_SHEET_NAME)
    .chunks(1000)
    .all();

  block.classList.add('step-2');
  block.classList.remove('step-1');
}

async function stepTwoLookup(lookupValue, textBoxTooltip) {
  const groupData = await groupsRegistryCache;
  const grpItem = groupData
    .find((rx) => rx['Group Id'].toLowerCase() === lookupValue);

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
}

export default function decorate(block) {
  // expect three rows
  const rows = [...block.children];
  if (rows.length < 3) {
    // console.log('Registration form expects 3 rows. Make sure to edit the document correctly.');
    return;
  }
  // extract the URL for the lookup data
  const rxBinRegistry = rows[2].querySelector('a').href;
  if (rxBinRegistry === null || typeof (rxBinRegistry) === 'undefined') {
    return;
  }
  rows[2].remove();

  decorateFormSteps(rows[0], 1, async (evt) => {
    evt.preventDefault();
    const formWrapper = evt.currentTarget.closest('.form-wrapper');
    const textBox = formWrapper.querySelector('.registration-form-input');
    const rxInput = textBox.value.toLowerCase();
    const textBoxTooltip = formWrapper.querySelector('.registration-form-input-tooltip');
    stepOneLookup(rxBinRegistry, rxInput, textBoxTooltip, block);
  });
  decorateFormSteps(rows[1], 2, async (evt) => {
    evt.preventDefault();
    const formWrapper = evt.currentTarget.closest('.form-wrapper');
    const textBox = formWrapper.querySelector('.registration-form-input');
    const grpInput = textBox.value.toLowerCase();
    const textBoxTooltip = formWrapper.querySelector('.registration-form-input-tooltip');
    stepTwoLookup(grpInput, textBoxTooltip);
  });
  block.classList.add('step-1');
}
