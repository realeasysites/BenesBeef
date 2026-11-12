// Bene's Beef & Cutlets — thin entry point.
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

require('./db/database'); // initialize schema on boot

const adminRoutes = require('./routes/admin');
const publicApi = require('./routes/public');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Admin first, so /admin always hits the password gate before static files.
app.use('/admin', adminRoutes);
app.use('/api', publicApi);

app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

app.use((req, res) => res.status(404).sendFile(path.join(__dirname, 'public', '404.html')));

app.listen(PORT, () => console.log(`Bene's Beef running on http://localhost:${PORT}`));
