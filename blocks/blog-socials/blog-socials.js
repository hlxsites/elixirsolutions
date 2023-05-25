import { createElement } from '../../scripts/scripts.js';

export default function decorate(block) {
  const topics = createElement('div');
  const tags = document.querySelectorAll('head meta[property="article:tag"]');
  topics.append('Topics: ');
  const tagLinks = [];
  tags.forEach((tag) => tagLinks.push(`<a href="/blog/tag?tag=${encodeURIComponent(tag.content)}">${tag.content}</a>`));

  topics.innerHTML = `<p>
    Topics: ${tagLinks.join(', ')}
  </p>`;
  block.append(topics);

  const socials = createElement('div', '', {}, `
    <div>
      <a href="http://www.facebook.com/share.php?u=${window.location.href}&amp;utm_medium=social&amp;utm_source=facebook" rel="noopener">
        <img src="/blocks/blog-socials/images/facebook.png" alt="Share on facebook">
      </a>
      <a href="http://www.linkedin.com/shareArticle?mini=true&amp;url=${window.location.href}&amp;utm_medium=social&amp;utm_source=linkedin" rel="noopener">
        <img src="/blocks/blog-socials/images/linkedin.png" alt="Share on linkedin">
      </a>
      <a href="https://twitter.com/intent/tweet?original_referer=${window.location.href}&amp;utm_medium=social&amp;utm_source=twitter&amp;url=${window.location.href}&amp;utm_medium=social&amp;utm_source=twitter&amp;source=tweetbutton&amp;text=" rel="noopener">
        <img src="/blocks/blog-socials/images/twitter.png" alt="Share on twitter">
      </a>
      <a href="mailto:?subject=Check%20out%20${window.location.href}&amp;utm_medium=social&amp;utm_source=email%20&amp;body=Check%20out%20${window.location.href}&amp;utm_medium=social&amp;utm_source=email" rel="noopener">
        <img src="/blocks/blog-socials/images/email.png" alt="Share on email">
      </a>
      <a href="javascript:window.print()" rel="noopener">
        <img src="/blocks/blog-socials/images/print.png" alt="Share on print">
      </a>
    </div>`);
  block.append(socials);
}
