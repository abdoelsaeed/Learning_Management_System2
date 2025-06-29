const User = require("./../models/user.Model");
const passport = require("passport");
const FacebookStrategy = require("passport-facebook").Strategy;
const url =
  process.env.NODE_ENV === "development"
    ? process.env.LOCALHOST
    : process.env.DOMAIN;
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_ID,
      clientSecret: process.env.FACEBOOK_SECRET,
      callbackURL: `${url}/api/v1/users/google/callback`,
      profileFields: ["id", "email", "name", "picture"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({
          facebookId: profile.id,
          googleId: { $exists: false },
        });

        if (!user) {
          user = await new User({
            facebookId: profile.id,
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

module.exports = passport;
