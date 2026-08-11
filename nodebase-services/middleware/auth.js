const db = require('../db/database');

function ensureAuth(req, res, next) {
  if (req.isAuthenticated()) {
    const user = db.getUser(req.user.discord_id);
    if (user && user.suspended === 1) {
      return res.redirect('/suspended');
    }
    return next();
  }
  res.redirect('/auth/discord');
}

function ensureAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.discord_id === process.env.ADMIN_DISCORD_ID) {
    return next();
  }
  res.status(403).render('error', { 
    title: 'Access Denied',
    message: 'You do not have permission to access this page.',
    user: req.user 
  });
}

function checkSuspended(req, res, next) {
  if (req.isAuthenticated()) {
    const user = db.getUser(req.user.discord_id);
    if (user && user.suspended === 1) {
      // Allow access only to /suspended and /logout
      if (req.path !== '/suspended' && req.path !== '/logout') {
        return res.redirect('/suspended');
      }
    }
  }
  next();
}

module.exports = { ensureAuth, ensureAdmin, checkSuspended };
