const axios = require('axios');
const { JSDOM } = require('jsdom');

class InstaFetcherPro {
  async getPostsByUsername(username) {
    try {
      const userPageUrl = `https://www.instagram.com/${username}/`;
      const { data: html } = await axios.get(userPageUrl);
      const { document } = new JSDOM(html).window;

      const scriptTag = document.querySelector('script[type="text/javascript"]:not([src])');
      if (!scriptTag) {
        throw new Error('Unable to find the required script tag in the HTML.');
      }

      const sharedDataJson = scriptTag.textContent.match(/window\._sharedData\s*=\s*({[\s\S]*?});/);
      if (!sharedDataJson || sharedDataJson.length < 2) {
        throw new Error('Unable to extract JSON data from the script tag.');
      }

      const sharedData = JSON.parse(sharedDataJson[1]);
      const user = sharedData.entry_data.ProfilePage[0].graphql.user;
      const posts = user.edge_owner_to_timeline_media.edges.map(edge => this._parsePost(edge.node));

      return posts;
    } catch (error) {
      console.error(`An error occurred while fetching posts for the user "${username}":`, error.message);
      return [];
    }
  }

  _parsePost(postData) {
    const post = {
      id: postData.id,
      type: postData.__typename,
      mediaUrl: [],
      caption: postData.edge_media_to_caption.edges[0]?.node?.text || '',
      timestamp: new Date(parseInt(postData.taken_at_timestamp) * 1000).toISOString(),
    };

    if (post.type === 'GraphImage') {
      post.mediaUrl.push(postData.display_url);
    } else if (post.type === 'GraphVideo') {
      post.mediaUrl.push(postData.video_url);
    } else if (post.type === 'GraphSidecar') {
      postData.edge_sidecar_to_children.edges.forEach(edge => {
        const child = edge.node;
        if (child.__typename === 'GraphImage') {
          post.mediaUrl.push(child.display_url);
        } else if (child.__typename === 'GraphVideo') {
          post.mediaUrl.push(child.video_url);
        }
      });
    } else {
      console.warn(`Unsupported post type encountered: "${post.type}"`);
    }

    return post;
  }
}

module.exports = InstaFetcherPro;
