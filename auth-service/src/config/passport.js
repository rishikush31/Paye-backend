const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const pool = require("../db");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const googleId = profile.id;
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName;   


        let r = await pool.query("SELECT * FROM users WHERE google_id=$1", [googleId]);
        if (r.rows.length) return done(null, r.rows[0]);

        if (email) {
          r = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
          if (r.rows.length) {
            const user = r.rows[0];
            await pool.query("UPDATE users SET google_id=$1 WHERE id=$2", [googleId, user.id]);
            user.google_id = googleId;
            return done(null, user);
          }
        }

        const insert = await pool.query(
          "INSERT INTO users (name, email, password_hash, google_id) VALUES ($1, $2 , NULL, $3) RETURNING *",
          [name, email, googleId]
        );
        return done(null, insert.rows[0]);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

module.exports = passport;
