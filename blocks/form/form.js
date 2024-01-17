import { fetchPlaceholders, readBlockConfig } from '../../scripts/lib-franklin.js';
import { createElement } from '../../scripts/scripts.js';

function constructPayload(form) {
  const payload = {};
  [...form.elements].forEach((fe) => {
    if (fe.type === 'checkbox') {
      if (fe.checked) {
        let fieldVal = payload[fe.dataset.id];
        if (!fieldVal) {
          fieldVal = [];
        } else {
          fieldVal = JSON.parse(fieldVal);
        }
        fieldVal.push(fe.value);
        payload[fe.dataset.id] = JSON.stringify(fieldVal);
      }
    } else if (fe.type === 'radio') {
      if (fe.checked) {
        payload[fe.dataset.id] = fe.value;
      }
    } else if (fe.name) {
      payload[fe.name] = fe.value;
    }
  });
  return payload;
}

async function submitHubspotForm(form, payload) {
  const d = new Date();
  const fields = Object.keys(payload).map((k) => {
    const v = payload[k];
    let name = k;
    let type = '0-1';
    if (name.includes('/')) {
      const split = name.split('/');
      // eslint-disable-next-line prefer-destructuring
      name = split[1];
      // eslint-disable-next-line prefer-destructuring
      type = split[0];
    }
    return {
      objectTypeId: type,
      name,
      value: v,
    };
  });

  const cookies = decodeURIComponent(document.cookie);
  let hsutk;
  cookies.split(';').forEach((cookie) => {
    const c = cookie.trim();
    if (c.indexOf('hubspotutk') === 0) {
      hsutk = c.substring('hubspotutk'.length + 1, c.length);
    }
  });

  const hsPayload = {
    submittedAt: d.getTime(),
    fields,
    context: {
      hutk: hsutk,
      pageUri: window.location.href,
      pageName: document.querySelector('title').textContent,
    },
  };

  if (form.dataset.sfdcCampaignId) {
    hsPayload.context.sfdcCampaignId = form.dataset.sfdcCampaignId;
  }

  const resp = fetch(`https://api.hsforms.com/submissions/v3/integration/submit/${form.dataset.portalId}/${form.dataset.guid}`, {
    method: 'POST',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(hsPayload),
  });
  return resp;
}

async function submitForm(form) {
  const payload = constructPayload(form);
  let resp;
  if (form.dataset.guid && form.dataset.portalId) {
    resp = await submitHubspotForm(form, payload);
  } else {
    resp = await fetch(form.dataset.action, {
      method: 'POST',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: payload }),
    });
  }

  if (!resp.ok) {
    // eslint-disable-next-line no-console
    console.error('form submission failed');
    form.innerHTML = `
      <p class="form-text error">Sorry, an error occurred. please try again.</p>
    `;
  } else if (form.dataset.thankYou) {
    window.location.href = form.dataset.thankYou;
  } else {
    form.innerHTML = `
      <p class="form-text">Thank you for your submission. We will get back to you within 48 hours.</p>
    `;
  }
}

function buildSubmitField(fieldDef) {
  const btn = createElement('button', ['button', 'button-primary'], {
    type: 'submit',
  }, fieldDef.Label);

  btn.addEventListener('click', (evt) => {
    evt.preventDefault();
    const form = btn.closest('form');
    if (form) {
      form.classList.add('was-validated');
    }
    const valid = form.reportValidity();
    if (valid) {
      submitForm(form);
    }
  });

  return btn;
}

function buildSelectField(fieldDef) {
  const formGroup = createElement('div', 'form-group');

  fieldDef.Placeholder = fieldDef.Placeholder || 'Please Select One';
  formGroup.innerHTML = `
  <label for="form${fieldDef.formIdx}-${fieldDef.Field}">${fieldDef.Label} </label>
  <select class="custom-select" name="${fieldDef.Field}" id="form${fieldDef.formIdx}-${fieldDef.Field}">
    <option selected disabled value="">${fieldDef.Placeholder}</option>
  </select>
  <div class="invalid-feedback">${fieldDef.Placeholder}</div>
  `;

  const select = formGroup.querySelector('select');
  if (fieldDef['Help Text']) {
    const helpId = `form-SelectHelp${fieldDef.idx}`;
    select.setAttribute('aria-describedby', helpId);
    const help = createElement('span', 'form-text', {
      id: helpId,
    }, fieldDef['Help Text']);
    select.insertAdjacentElement('beforebegin', help);
  }

  if (fieldDef.Mandatory) {
    select.setAttribute('required', '');
  } else {
    formGroup.querySelector('label').insertAdjacentHTML('beforeend', '<span>optional</span>');
  }

  const opts = fieldDef.Options.split(', ');
  opts.forEach((o) => {
    const opt = createElement('option', '', { value: o.toLowerCase().replaceAll(' ', '-') }, o);
    select.append(opt);
  });

  return formGroup;
}

function buildCheckboxField(fieldDef) {
  const fieldSet = createElement('fieldset');
  const legend = createElement('legend', '', {}, fieldDef.Label);
  fieldSet.append(legend);
  const formGroup = createElement('div', 'form-group');
  fieldSet.append(formGroup);
  if (fieldDef.Style) formGroup.classList.add(`form-group-${fieldDef.Style}`);

  const opts = fieldDef.Options.split(', ');
  opts.forEach((o, i) => {
    const control = createElement('div', ['custom-control', `custom-${fieldDef.Type}`]);
    control.innerHTML = `
      <input type="${fieldDef.Type}" class="custom-control-input" 
      data-id="${fieldDef.Field}" id="form${fieldDef.formIdx}-${fieldDef.Field}-${i}"
      ${fieldDef.Mandatory ? 'required' : ''} value="${o}"
      ${fieldDef.Type === 'radio' ? `name=radio-${fieldDef.idx}` : ''}>
      <label class="custom-control-label" for="form${fieldDef.formIdx}-${fieldDef.Field}-${i}">${o}</label>
    `;

    if (fieldDef.Type === 'checkbox') {
      control.innerHTML += '<div class="invalid-feedback">This checkbox is required</div>';
    }
    if (fieldDef.Type === 'radio' && i === (opts.length - 1)) {
      control.innerHTML += '<div class="invalid-feedback">Please make a selection</div>';
    }
    formGroup.append(control);
  });

  return fieldSet;
}

function buildInputField(fieldDef) {
  const formGroup = createElement('div', 'form-group');

  const inputAttrs = {
    type: fieldDef.Type,
    placeholder: fieldDef.Placeholder,
  };
  let inputTag = 'input';
  if (fieldDef.Type === 'textarea') {
    inputTag = 'textarea';
    inputAttrs.rows = '3';
  }
  if (fieldDef.Type === 'tel') {
    inputAttrs.pattern = '[0-9\\(\\)\\+\\-x ]*';
  }

  inputAttrs.id = `form${fieldDef.formIdx}-${fieldDef.Field}`;
  inputAttrs.name = fieldDef.Field;
  if (fieldDef['Help Text']) {
    const helpId = `form${fieldDef.formIdx}-${inputTag}Help${fieldDef.idx}`;
    inputAttrs['aria-describedby'] = helpId;
    const help = createElement('span', 'form-text', {
      id: helpId,
    }, fieldDef['Help Text']);
    formGroup.append(help);
  }
  if (fieldDef.Mandatory) {
    inputAttrs.required = '';
  }
  if (fieldDef.Type === 'currency') {
    inputAttrs.step = '.01';
    inputAttrs.type = 'number';
  }
  const input = createElement(inputTag, 'form-control', inputAttrs);
  formGroup.append(input);

  const labelText = `${fieldDef.Label} ${fieldDef.Mandatory ? '' : '<span>optional</span>'}`;
  const label = createElement('label', '', {
    for: inputAttrs.id,
  }, labelText);
  formGroup.prepend(label);

  formGroup.insertAdjacentHTML('beforeend', `<div class="invalid-feedback">This field is ${fieldDef.Mandatory ? 'required/' : ''}invalid</div>`);

  return formGroup;
}

function buildFormField(fieldDef) {
  fieldDef.Type = fieldDef.Type ? fieldDef.Type.toLowerCase() : 'text';

  if (fieldDef.Type === 'radio' || fieldDef.Type === 'checkbox') {
    return buildCheckboxField(fieldDef);
  }
  if (fieldDef.Type === 'select') {
    return buildSelectField(fieldDef);
  }
  if (fieldDef.Type === 'submit') {
    return buildSubmitField(fieldDef);
  }

  return buildInputField(fieldDef);
}

let formNum = 0;
async function createForm(formURL) {
  formNum += 1;
  const resp = await fetch(formURL);
  const json = await resp.json();
  const form = createElement('form', '', { novalidate: '' });
  // eslint-disable-next-line prefer-destructuring
  form.dataset.action = formURL.pathname.split('.json')[0];
  json.data.forEach((fieldDef, i) => {
    fieldDef.idx = i;
    fieldDef.formIdx = formNum;
    const formField = buildFormField(fieldDef);
    form.append(formField);
  });
  return form;
}

export default async function decorate(block) {
  const cfg = readBlockConfig(block);
  if (cfg.source) {
    const srcUrl = new URL(cfg.source);
    if (srcUrl.pathname.endsWith('.json')) {
      const formEl = await createForm(srcUrl);
      block.innerHTML = '';
      block.append(formEl);
      if (cfg['thank-you']) {
        formEl.dataset.thankYou = cfg['thank-you'];
      }
      if (block.classList.contains('hubspot')) {
        formEl.dataset.guid = cfg['form-id'];
        if (cfg['sfdc-campaign-id']) {
          formEl.dataset.sfdcCampaignId = cfg['sfdc-campaign-id'];
        }
        const placeholders = await fetchPlaceholders();
        formEl.dataset.portalId = placeholders.hubspotPortalId;
      }

      // prevent browser invalid message from displaying
      formEl.addEventListener('invalid', (e) => {
        e.preventDefault();
      }, true);

      formEl.querySelectorAll('.form-control').forEach((ctrl) => {
        ctrl.addEventListener('blur', () => {
          const group = ctrl.closest('.form-group');
          if (group) {
            group.classList.add('was-validated');
          }
        });
      });
    }
  }
}
