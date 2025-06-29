const passport = require("passport");
const User = require("./../models/user.Model");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const url =
  process.env.NODE_ENV === "development"
    ? process.env.LOCALHOST
    : process.env.DOMAIN;
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      callbackURL: `${url}/api/v1/users/google/callback`,
      passReqToCallback: true,
    },
    async function (request, accessToken, refreshToken, profile, done) {
      try {
        let user = await User.findOne({
          googleId: profile.id,
          facebookId: { $exists: false },
        });
        if (!user) {
          user = await new User({
            googleId: profile.id,
            name: profile.name.givenName + " " + profile.name.familyName,
            email: profile.emails ? profile.emails[0].value : null,
            photo: profile.photos ? profile.photos[0].value : null,
            provider: profile.provider,
          }).save({ validateBeforeSave: false });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);
