import ffetch from '../../scripts/ffetch.js';

const getTopicCount = async (blogPath) => {
  const allPosts = await ffetch('/query-index.json')
    .filter((p) => p.path.startsWith(`/${blogPath}/`))
    .all();

  const topicCounts = {};
  allPosts.forEach((post) => {
    const tags = JSON.parse(post.tags);
    tags.forEach((tag) => {
      if (topicCounts[tag]) {
        topicCounts[tag] += 1;
      } else {
        topicCounts[tag] = 1;
      }
    });
  });

  const entries = Object.entries(topicCounts);
  entries.sort((a, b) => (b[0] < a[0] ? 1 : -1));
  return entries;
};

const renderTopics = (blogPath, ul, topicCount) => {
  topicCount.forEach((topic) => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="/${blogPath}/tag?tag=${encodeURIComponent(topic[0])}">
      ${topic[0]} (${topic[1]})
    </a>`;
    ul.appendChild(li);
  });
};

export default async function decorate(block) {
  const blogPath = window.location.pathname.startsWith('/member-blog') ? 'member-blog' : 'blog';
  const topicCount = await getTopicCount(blogPath);

  const header = document.createElement('h3');
  header.classList.add('blog-topics-header');
  header.innerHTML = 'Post By Topic';
  block.appendChild(header);

  const ul = document.createElement('ul');
  block.appendChild(ul);
  renderTopics(blogPath, ul, topicCount);
}
