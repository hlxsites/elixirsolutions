import ffetch from '../../scripts/ffetch.js';

const getTopicCount = async () => {
  const allPosts = await ffetch('/query-index.json')
    .filter((p) => p.path.startsWith('/blog/'))
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

const renderTopics = (ul, topicCount) => {
  topicCount.forEach((topic) => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="/blog/tag?tag=${encodeURIComponent(topic[0])}">
      ${topic[0]} (${topic[1]})
    </a>`;
    ul.appendChild(li);
  });
};

export default async function decorate(block) {
  const topicCount = await getTopicCount();

  const header = document.createElement('h3');
  header.classList.add('blog-topics-header');
  header.innerHTML = 'Post By Topic';
  block.appendChild(header);

  const ul = document.createElement('ul');
  block.appendChild(ul);
  renderTopics(ul, topicCount);
}
