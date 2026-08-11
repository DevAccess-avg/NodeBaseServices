const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const db = require('../db/database');

const scopes = ['identify', 'email'];

passport.serializeUser((user, done) => {
  done(null, user.discord_id);
});

passport.deserializeUser((id, done) => {
  try {
    const user = db.getUser(id);
    done(null, user || null);
  } catch (err) {
    done(err, null);
  }
});

function configurePassport() {
  passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: (process.env.BASE_URL || 'http://localhost:3000') + '/auth/discord/callback',
    scope: scopes
  }, (accessToken, refreshToken, profile, done) => {
    try {
      const user = db.upsertUser(profile, accessToken, refreshToken);
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));
}

module.exports = { configurePassport, passport };
