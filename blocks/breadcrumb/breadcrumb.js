const getPageTitle = async (url) => {
  const resp = await fetch(url);
  const html = document.createElement('div');
  html.innerHTML = await resp.text();
  return html.querySelector('title').innerText;
};

const getAllPaths = async (paths) => {
  const result = [];
  const pathsList = paths.split('/');
  for (let i = 0; i < pathsList.length; i += 1) {
    const pathPart = pathsList[i];
    if (i === 0) {
      result.push({
        path: '',
        name: 'Home',
        url: window.location.origin,
      });
    } else {
      const path = `${result[i - 1].path}/${pathPart}`;
      const url = `${window.location.origin}${path}`;
      /* eslint-disable-next-line no-await-in-loop */
      const name = await getPageTitle(url);
      result.push({ path, name, url });
    }
  }
  return result;
};
export default async function decorate(block) {
  const breadcrumb = block.querySelector(':scope div');
  const breadcrumbLinks = [];
  const path = window.location.pathname;
  const paths = await getAllPaths(path);

  paths.forEach((pathPart) => {
    const pathLink = document.createElement('a');
    pathLink.href = pathPart.url;
    pathLink.innerText = pathPart.name;
    breadcrumbLinks.push(pathLink.outerHTML);
  });
  const space = '&nbsp;&nbsp;&nbsp;';
  breadcrumb.innerHTML = breadcrumbLinks.join(`${space}/${space}`);
}
