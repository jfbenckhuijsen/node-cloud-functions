const CloudServant = require('cloud-servant')(`${__dirname}/config.json`, '');
const passport = require('passport');
const { BasicStrategy } = require('passport-http');

passport.use(new BasicStrategy(
  ((username, password, done) => {
    if (username === 'admin' && password === 'welcome') {
      return done(null, {
        user: 'admin',
      });
    }
    return done(null, false);
  }),
));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

module.exports = CloudServant.restServiceModule({
  name: 'http-service-auth',
  cors: false,
  debug: true,
  authStrategies: {
    default: passport.authenticate('basic', { session: false }),
  },
  paths: [
    {
      method: 'POST',
      path: '/',
      auth: true,
      handler: (_LOGGER, req, res) => {
        res.send(`Hello ${req.body.name || 'World'}!`);
      },
    },
  ],
});
