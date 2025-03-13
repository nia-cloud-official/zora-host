const { deployToRender } = require('../services/renderService');
const { createRepo } = require('../services/githubService');
const fs = require('fs');
const path = require('path');

exports.deployPHP = async (req, res) => {
  try {
    const userId = req.user.id;
    const repoName = `php-app-${Date.now()}`;
    
    // 1. Create GitHub Repo
    const repoUrl = await createRepo(repoName);
    
    // 2. Deploy to Render
    const service = await deployToRender(repoName, repoUrl);
    
    res.json({
      url: service.serviceDetails.url,
      status: 'Deployed'
    });
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};