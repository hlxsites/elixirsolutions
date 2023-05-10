import { readBlockConfig, decorateIcons } from '../../scripts/lib-franklin.js';
import { wrapImgsInLinks, decorateLinks } from '../../scripts/scripts.js';

const handleSocialLinks = (block) => {
  const footerSocial = block.querySelector('.footer-social');
  const footerSocialContainer = footerSocial.querySelector(':scope > ul');
  Object.values(footerSocialContainer.children).forEach((child) => {
    const link = child.querySelector('a');
    const host = (new URL(link.href).hostname).split('.');
    const social = host[0] === 'www' ? host[1] : host[0];
    link.classList.add('footer-social-icon');
    link.innerHTML = `<span class="sr-only">${social}</span>`;
    link.classList.add(`footer-social-icon-${social}`);
    footerSocial.append(link);
  });
  footerSocialContainer.remove();
};

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const cfg = readBlockConfig(block);
  block.textContent = '';

  // fetch footer content
  const footerPath = cfg.footer || '/footer';
  const resp = await fetch(`${footerPath}.plain.html`, window.location.pathname.endsWith('/footer') ? { cache: 'reload' } : {});

  if (resp.ok) {
    const html = await resp.text();

    // decorate footer DOM
    const footer = document.createElement('div');
    footer.innerHTML = html;

    // add classes to footer sections
    const sectionNames = ['image', 'links', 'social', 'legal', 'copyright'];
    sectionNames.forEach((c, i) => {
      const section = footer.children[i];
      if (section) section.classList.add(`footer-${c}`);
    });

    // structure upper footer
    const upperFooterNames = ['image'];
    const upperFooter = document.createElement('div');
    upperFooter.classList.add('footer-upper');
    const upperFooterContent = document.createElement('div');
    upperFooterContent.classList.add('footer-upper-content');
    upperFooterNames.forEach((c) => {
      const section = footer.querySelector(`.footer-${c}`);
      if (section) upperFooterContent.appendChild(section);
    });
    upperFooter.appendChild(upperFooterContent);
    footer.appendChild(upperFooter);

    // structure link container
    const linksNames = ['links', 'social'];
    const linksContainer = document.createElement('div');
    linksContainer.classList.add('footer-links-container');
    linksNames.forEach((c) => {
      const section = footer.querySelector(`.footer-${c}`);
      if (section) linksContainer.appendChild(section);
    });
    upperFooterContent.appendChild(linksContainer);
    handleSocialLinks(linksContainer);

    // structure lower footer
    const lowerFooterNames = ['legal', 'copyright'];
    const lowerFooter = document.createElement('div');
    lowerFooter.classList.add('footer-lower');
    const lowerFooterContent = document.createElement('div');
    lowerFooterContent.classList.add('footer-lower-content');
    lowerFooterNames.forEach((c) => {
      const section = footer.querySelector(`.footer-${c}`);
      if (section) lowerFooterContent.appendChild(section);
    });
    lowerFooter.appendChild(lowerFooterContent);
    footer.appendChild(lowerFooter);

    decorateIcons(footer);
    decorateLinks(footer);
    wrapImgsInLinks(footer);
    block.append(footer);
  }
}
