const axios = require('axios');
const { JSDOM } = require('jsdom');
const dotenv = require('dotenv');

dotenv.config();

const BASE_URL_IG = 'https://graph.facebook.com/v12.0/';
class InstaFetcherPro {

  constructor() {
    this.accessToken = process.env.ACCESS_TOKEN;
  }

  async fetchData() {
    const accessToken = accessToken;
  
      const igAccount = await this.getAccounts(accessToken);

      if (!igAccount)  console.log('!igAccount');

      const igAccountId = igAccount.id;
      const allPosts = await this.getAllPosts(accessToken, igAccountId);

      if (!allPosts)  console.log('!allPosts');

      for (const post of allPosts) {
        const postData = await this.getPostData(accessToken, post);

        if (!postData)  console.log('!postData');

        if (postData.media_type === 'IMAGE' || postData.media_type === 'VIDEO') {
          this.storeImageVideo(postData, igAccountId);
        } else if (postData.media_type === 'CAROUSEL_ALBUM') {
          await this.storeCarouselItems(accessToken, postData, igAccountId);
        }
      }
  }

  async getAccounts(accessToken) {
    try {
      const response = await axios.get(`${BASE_URL_IG}me/accounts?access_token=${accessToken}`);

      if (response.data.data.length > 0) {
        return response.data.data[0];
      }

      console.log(`No Instagram accounts found for access token ${accessToken}`);
      return null;
    } catch (error) {
      console.log(`Error fetching Instagram accounts for access token ${accessToken}: ${error.message}`);
      return null;
    }
  }

  async getAllPosts(accessToken, igAccountId) {
    try {
      const response = await axios.get(`${BASE_URL_IG}${igAccountId}/media?access_token=${accessToken}`);

      if (response.data.data.length > 0) {
        return response.data.data;
      }

      console.log(`No Instagram posts found for access token ${accessToken}`);
      return null;
    } catch (error) {
      console.log(`Error fetching Instagram posts for access token ${accessToken}: ${error.message}`);
      return null;
    }
  }

  async getPostData(accessToken, post) {
    try {
      const response = await axios.get(`${BASE_URL_IG}${post.id}?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&access_token=${accessToken}`);

      if (response.data) {
        return response.data;
      }

      console.log(`No Instagram post data found for access token ${accessToken} and post ID ${post.id}`);
      return null;
    } catch (error) {
      console.log(`Error fetching Instagram post data for access token ${accessToken} and post ID ${post.id}: ${error.message}`);
      return null;
    }
  }

  async storeImageVideo(postData, igAccountId) {
    // implementation here
  }

  async storeCarouselItems(accessToken, postData, igAccountId) {
    // implementation here
  }
  
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
