require('dotenv').config();
const express = require('express');
const multer = require('multer');
const AdmZip = require('adm-zip');
const { Octokit } = require('@octokit/rest');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));

// Environment variables
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const RENDER_KEY = process.env.RENDER_KEY;

function createDockerfile(tempDir) {
    const dockerfile = `FROM php:apache
COPY . /var/www/html/
EXPOSE 80`;
    fs.writeFileSync(path.join(tempDir, 'Dockerfile'), dockerfile);
}

app.post('/deploy', upload.single('site'), async (req, res) => {
    try {
        const { repoName } = req.body;
        
        // Unzip files
        const zip = new AdmZip(req.file.path);
        const tempDir = path.join(__dirname, 'temp', Date.now().toString());
        zip.extractAllTo(tempDir, true);
        
        // Add Docker config
        createDockerfile(tempDir);
        
        // Create GitHub repo
        const octokit = new Octokit({ auth: GITHUB_TOKEN });
        await octokit.repos.createForAuthenticatedUser({ name: repoName });
        
        // Initialize local repo
        const simpleGit = require('simple-git')(tempDir);
        await simpleGit
            .init()
            .add('.')
            .commit('Initial commit')
            .addRemote('origin', `https://${GITHUB_TOKEN}@github.com/${repoName}.git`)
            .push('origin', 'main');
        
        // Deploy to Render
        const renderResponse = await axios.post('https://api.render.com/v1/services', {
            name: repoName,
            type: 'web',
            repo: `https://github.com/${repoName}`,
            autoDeploy: true
        }, {
            headers: { 'Authorization': `Bearer ${RENDER_KEY}` }
        });

        res.send(`Deployed! Check status: ${renderResponse.data.service.serviceDetailsUrl}`);
    } catch (error) {
        res.status(500).send(`Error: ${error.message}`);
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));