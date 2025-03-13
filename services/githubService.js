const axios = require('axios');

exports.createRepo = async (repoName) => {
  const response = await axios.post(
    'https://api.github.com/user/repos',
    { name: repoName, auto_init: true },
    {
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json'
      }
    }
  );
  return response.data.html_url;
};