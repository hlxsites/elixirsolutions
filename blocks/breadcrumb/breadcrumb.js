const getPageTitle = async (url) => {
  const resp = await fetch(url);
  const html = document.createElement('div');
  html.innerHTML = await resp.text();
  return html.querySelector('title').innerText;
};

const getAllPaths = async (paths) => {
  const result = [];
  // remove first and last slash characters
  const pathsList = paths.replace(/^\/|\/$/g, '').split('/');
  for (let i = 0; i < pathsList.length; i += 1) {
    const pathPart = pathsList[i];
    const prevPath = result[i - 1] ? result[i - 1].path : '';
    const path = `${prevPath}/${pathPart}`;
    const url = `${window.location.origin}${path}`;
    /* eslint-disable-next-line no-await-in-loop */
    const name = await getPageTitle(url);
    result.push({ path, name, url });
  }
  return result;
};

const createLink = (path) => {
  const pathLink = document.createElement('a');
  pathLink.href = path.url;
  pathLink.innerText = path.name;
  return pathLink;
};

export default async function decorate(block) {
  const breadcrumb = block.querySelector(':scope div');
  const HomeLink = createLink({ path: '', name: 'Home', url: window.location.origin });
  const breadcrumbLinks = [HomeLink.outerHTML];
  breadcrumb.innerHTML = HomeLink.outerHTML;

  window.setTimeout(async () => {
    const path = window.location.pathname;
    const paths = await getAllPaths(path);

    paths.forEach((pathPart) => breadcrumbLinks.push(createLink(pathPart).outerHTML));
    const space = '&nbsp;&nbsp;&nbsp;';
    breadcrumb.innerHTML = breadcrumbLinks.join(`${space}/${space}`);
  }, 3000);
}
