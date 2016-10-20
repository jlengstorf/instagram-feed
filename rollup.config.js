require('dotenv').config();

// Rollup plugins
import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import replace from 'rollup-plugin-replace';
import uglify from 'rollup-plugin-uglify';

export default {
  entry: 'src/scripts/main.js',
  dest: 'dist/js/instagram-feed.min.js',
  format: 'iife',
  sourceMap: 'inline',
  plugins: [
    commonjs(),
    resolve({
      jsnext: true,
      main: true,
      browser: true,
    }),
    babel({
      exclude: 'node_modules/**',
    }),
    replace({
      exclude: 'node_modules/**',
      ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
      IG_CLIENT_ID: JSON.stringify(process.env.IG_CLIENT_ID),
      IG_REDIRECT_URI: JSON.stringify(process.env.IG_REDIRECT_URI),
      IG_API_SELF_MEDIA_RECENT: JSON.stringify(process.env.IG_API_SELF_MEDIA_RECENT),
      IG_API_OAUTH: JSON.stringify(process.env.IG_API_OAUTH),
    }),
    (process.env.NODE_ENV === 'production' && uglify()),
  ],
};
