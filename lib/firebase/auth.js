const admin = require('firebase-admin');

admin.initializeApp();

module.exports = (logger) => async (req, res, next) => {
  logger.debug('Check if request is authorized with Firebase ID token');

  if ((!req.headers.authorization || !req.headers.authorization.startsWith('Bearer '))
      // eslint-disable-next-line no-underscore-dangle
      && !(req.cookies && req.cookies.__session)) {
    logger.warning(
      'No Firebase ID token was passed as a Bearer token in the Authorization header. Make sure you '
      + 'authorize your request by providing the following HTTP header: "Authorization: Bearer '
      + '<Firebase ID Token>" or by passing a "__session" cookie.',
    );
    res.status(403).send('Unauthorized');
    return;
  }

  let idToken;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    logger.debug('Found "Authorization" header');
    // Read the ID Token from the Authorization header.
    // eslint-disable-next-line prefer-destructuring
    idToken = req.headers.authorization.split('Bearer ')[1];
  } else if (req.cookies) {
    logger.debug('Found "__session" cookie');
    // Read the ID Token from cookie.
    // eslint-disable-next-line no-underscore-dangle
    idToken = req.cookies.__session;
  } else {
    // No cookie
    res.status(403).send('Unauthorized');
    return;
  }

  try {
    const decodedIdToken = await admin.auth().verifyIdToken(idToken);
    logger.debug('ID Token correctly decoded', decodedIdToken);
    req.user = decodedIdToken;
    next();
  } catch (error) {
    logger.warning('Error while verifying Firebase ID token:', error);
    res.status(403).send('Unauthorized');
  }
};
