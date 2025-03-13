const router = require('express').Router();
const { deployPHP } = require('../controllers/deployController');
const auth = require('../utils/authMiddleware'); // Corrected import
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post('/php', auth, upload.single('code'), deployPHP);

module.exports = router;