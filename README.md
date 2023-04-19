# Instagram Business Fetcher
Fetch Instagram Business and Creator account feeds with this Node.js package. This package uses the Instagram Graph API to fetch all posts from an authorized Instagram Business or Creator account, including non-public posts.

## Installation
To install the package, use the following command:

```
npm install instagram-business-fetcher
```

## Usage
To use the package, you will need to obtain an access token from the Instagram Graph API. You can do this by following the official documentation.

Once you have an access token, you can use the package in your Node.js application by importing the InstagramFetcher class and initializing it with your access token:

```javascript
const InstagramFetcher = require('instagram-business-fetcher');
const fetcher = new InstagramFetcher('your_access_token_here');

fetcher.fetch()
  .then((media) => {
    console.log(media);
  })
  .catch((error) => {
    console.error(`Error: ${error.message}`);
  });
```

The fetch method will return an array of media objects, which include information about the post such as its ID, type, URL, caption, and timestamp.

## Configuration
The package uses the dotenv module to load configuration from a .env file. You should create a .env file in the root directory of your project and add the following line:

```makefile
ACCESS_TOKEN=your_access_token_here
```

Replace your_access_token_here with your actual Instagram Business or Creator account access token.

## License
This package is licensed under the MIT License.