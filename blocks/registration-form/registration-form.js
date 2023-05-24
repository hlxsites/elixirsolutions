import ffetch from '../../scripts/ffetch.js';

function buildStep1(rows) {
    rows[1].remove();
    rows[2].remove();
    const cols = [...rows[0].children];
    // 0. step1 container
    const step1Container = document.createElement('div');
    step1Container.classList.add('registration-form-step');
    // 1. build the form
    const formContainer = document.createElement('div');
    formContainer.classList.add('form-container');
    formContainer.append(cols[0]);
    step1Container.append(formContainer);
    // add form input
    const textBox = document.createElement('input');
    textBox.required = true;
    textBox.placeholder = 'e.g. 012718';
    formContainer.append(textBox);
    // add button
    const searchBtn = document.createElement('button');
    searchBtn.type = 'submit';
    searchBtn.innerText = "Search";
    searchBtn.classList.add('button');
    formContainer.append(searchBtn);

    // 2. show the image on the right
    const imageContainer = document.createElement('div');
    imageContainer.classList.add('image-container');
    imageContainer.append(cols[1]);
    step1Container.append(imageContainer);

    return step1Container;
}

export default function decorate(block) {
    const RXBIN_REGISTRY = '/register-login/register-login.json';
    const GROUP_REGISTRY = '/register-login.json?sheet=groups';
    // expect three rows 
    const rows = [...block.children];
    if (rows.length < 3) {
        console.log("Registration form expects 3 rows. Make sure to edit the document correctly.");
        return;
    }
    // TODO: depending on query params, set the correct step
    block.append(buildStep1(rows));

}