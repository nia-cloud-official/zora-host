const axios = require('axios');

exports.deployToRender = async (repoName, repoUrl) => {
  const response = await axios.post(
    'https://api.render.com/v1/services',
    {
      type: 'web',
      name: repoName,
      repo: repoUrl,
      env: 'php',
      autoDeploy: true
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.RENDER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
};