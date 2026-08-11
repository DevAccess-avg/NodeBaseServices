require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const { configurePassport, passport } = require('./config/passport');
const { ensureAuth, ensureAdmin, checkSuspended } = require('./middleware/auth');
const db = require('./db/database');
const { generateUniqueCodeWithCheck } = require('./utils/codeGenerator');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for Render
app.set('trust proxy', 1);

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session (memory store - fine for small traffic; for production scale use Redis or similar)
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-change-me-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// Passport
configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// Make user available to all views
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.isAdmin = req.user && req.user.discord_id === process.env.ADMIN_DISCORD_ID;
  res.locals.discordInvite = process.env.DISCORD_INVITE || 'https://discord.gg/nodebaseservices';
  next();
});

// Global suspended check
app.use(checkSuspended);

// ============ ROUTES ============

// Home
app.get('/', (req, res) => {
  res.render('index', { title: 'NodeBaseServices - Custom Bots' });
});

// Auth routes
app.get('/auth/discord', passport.authenticate('discord'));

app.get('/auth/discord/callback',
  passport.authenticate('discord', { failureRedirect: '/?error=auth_failed' }),
  (req, res) => {
    res.redirect('/dashboard');
  }
);

app.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.redirect('/');
    });
  });
});

// Suspended page
app.get('/suspended', (req, res) => {
  if (!req.isAuthenticated()) return res.redirect('/');
  const user = db.getUser(req.user.discord_id);
  if (!user || user.suspended !== 1) return res.redirect('/dashboard');
  res.render('suspended', { title: 'Account Suspended' });
});

// Dashboard / Order page
app.get('/dashboard', ensureAuth, (req, res) => {
  res.render('dashboard', { title: 'Order a Bot - NodeBaseServices' });
});

// Submit order
app.post('/order', ensureAuth, (req, res) => {
  const { service_type, bot_type, custom_details } = req.body;

  const validServices = ['basic', 'advanced', 'fivem'];
  if (!validServices.includes(service_type)) {
    return res.status(400).json({ error: 'Invalid service type' });
  }

  if (!bot_type || bot_type.trim() === '') {
    return res.status(400).json({ error: 'Please select a bot type' });
  }

  if (service_type === 'advanced' && bot_type === 'Custom') {
    if (!custom_details || custom_details.trim().length === 0) {
      return res.status(400).json({ error: 'Custom details are required for Custom bots' });
    }
    if (custom_details.length > 2000) {
      return res.status(400).json({ error: 'Custom details cannot exceed 2000 characters' });
    }
  }

  const code = generateUniqueCodeWithCheck(db);

  try {
    db.createOrder({
      code,
      user_id: req.user.discord_id,
      service_type,
      bot_type,
      custom_details: (service_type === 'advanced' && bot_type === 'Custom') ? custom_details.trim() : null
    });

    res.json({ success: true, code });
  } catch (err) {
    console.error('Order error:', err);
    res.status(500).json({ error: 'Failed to create order. Please try again.' });
  }
});

// TOS
app.get('/tos', (req, res) => {
  res.render('tos', { title: 'Terms of Service - NodeBaseServices' });
});

// Privacy
app.get('/privacy', (req, res) => {
  res.render('privacy', { title: 'Privacy Policy - NodeBaseServices' });
});

// ============ ADMIN ROUTES ============
app.get('/admin', ensureAuth, ensureAdmin, (req, res) => {
  const users = db.getAllUsers();
  const orders = db.getAllOrders();
  res.render('admin', { 
    title: 'Admin Panel - NodeBaseServices',
    users,
    orders,
    adminId: process.env.ADMIN_DISCORD_ID
  });
});

app.post('/admin/suspend', ensureAuth, ensureAdmin, (req, res) => {
  const { discord_id, suspend } = req.body;
  if (!discord_id) return res.status(400).json({ error: 'Missing discord_id' });
  
  if (discord_id === process.env.ADMIN_DISCORD_ID) {
    return res.status(400).json({ error: 'Cannot suspend admin account' });
  }

  try {
    db.setSuspended(discord_id, suspend === true || suspend === 'true' || suspend === 1);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update' });
  }
});

app.post('/admin/order-status', ensureAuth, ensureAdmin, (req, res) => {
  const { order_id, status } = req.body;
  const valid = ['pending', 'in_progress', 'completed', 'cancelled'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  
  try {
    db.updateOrderStatus(order_id, status);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update' });
  }
});

// Error page fallback
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Not Found',
    message: 'The page you are looking for does not exist.',
    user: req.user
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', {
    title: 'Server Error',
    message: 'Something went wrong. Please try again later.',
    user: req.user
  });
});

app.listen(PORT, () => {
  console.log(`NodeBaseServices running on port ${PORT}`);
});
