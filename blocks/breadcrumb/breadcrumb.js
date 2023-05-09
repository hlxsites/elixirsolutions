export default function decorate(block) {
  const breadcrumb = block.querySelector(':scope div');
  breadcrumb.innerText = `Home ${window.location.pathname.split('/').join(' / ')}`;
}
