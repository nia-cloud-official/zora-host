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

// Ensure temp directory exists
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Environment variables
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const RENDER_KEY = process.env.RENDER_KEY;

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

function createDockerfile(tempDir) {
    const dockerfile = `FROM php:apache
COPY . /var/www/html/
EXPOSE 80`;
    fs.writeFileSync(path.join(tempDir, 'Dockerfile'), dockerfile);
}

app.post('/deploy', upload.single('site'), async (req, res) => {
    try {
        const { repoName } = req.body;
        const extractionPath = path.join(tempDir, Date.now().toString());
        
        // Validate inputs
        if (!req.file) throw new Error('No file uploaded');
        if (!repoName.match(/^[a-z0-9_-]+$/i)) {
            throw new Error('Invalid repository name. Use only letters, numbers, underscores and hyphens');
        }

        // Process ZIP file
        const zip = new AdmZip(req.file.path);
        zip.extractAllTo(extractionPath, true);
        
        // Add Docker configuration
        createDockerfile(extractionPath);

        // GitHub setup
        const octokit = new Octokit({ auth: GITHUB_TOKEN });
        await octokit.repos.createForAuthenticatedUser({ name: repoName });

        // Git operations
        const simpleGit = require('simple-git')(extractionPath);
        await simpleGit
            .init()
            .add('.')
            .commit('Initial commit')
            .addRemote('origin', `https://${GITHUB_TOKEN}@github.com/${repoName}.git`)
            .push(['-u', 'origin', 'main']);

        // Render deployment
        const renderResponse = await axios.post(
            'https://api.render.com/v1/services',
            {
                name: repoName,
                type: 'web',
                repo: `https://github.com/${repoName}`,
                autoDeploy: true
            },
            {
                headers: { 'Authorization': `Bearer ${RENDER_KEY}` }
            }
        );

        // Cleanup
        fs.rmSync(extractionPath, { recursive: true, force: true });
        fs.unlinkSync(req.file.path);

        res.send(`
            <h1>Deployment Successful!</h1>
            <p>Check your deployment status: 
            <a href="${renderResponse.data.service.serviceDetailsUrl}" target="_blank">
                ${renderResponse.data.service.serviceDetailsUrl}
            </a>
            </p>
        `);
    } catch (error) {
        console.error('Deployment error:', error);
        res.status(500).send(`
            <h1>Deployment Failed</h1>
            <p>${error.message}</p>
            <a href="/">Try again</a>
        `);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));