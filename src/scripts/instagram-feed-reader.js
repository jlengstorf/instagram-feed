// Instagram doesn’t allow CORS, so we need to use JSONP.
import fetchJsonP from 'fetch-jsonp';

// Only import the functions we need from Ramda.
import compose from 'ramda/src/compose';
import keys from 'ramda/src/keys';
import join from 'ramda/src/join';
import mapObjIndexed from 'ramda/src/mapObjIndexed';
import replace from 'ramda/src/replace';
import reduce from 'ramda/src/reduce';
import values from 'ramda/src/values';

// Create a debugger.
import debug from 'debug';
const log = debug('instagram-feed-reader');

log('Debugging is enabled!');

/*function isLoggedIn() {
  const endpoint = 'https://api.instagram.com/oauth/authorize/';
  const args = `?client_id=${IG_CLIENT_ID}&redirect_uri=${IG_REDIRECT_URI}&response_type=token`;
}*/

/**
 * Extracts the Instagram access_token from the URI.
 *
 * This requires implicit authentication with a redirect URI matching the page
 * on which this function will execute.
 *
 * See {@link https://www.instagram.com/developer/authentication/} for more
 * details about implicit authentication.
 *
 * @return {String} the Instagram access_token
 */
const getToken = replace('#access_token=', '');

// Alias this long-ass function name for brevity.
const esc = encodeURIComponent;

/**
 * For use in `R.mapObjIndexed()` to create URI-encoded query string arguments.
 * @param  {String} arg  the current object value
 * @param  {String} key  the current object key
 * @param  {Object} obj  the arguments object
 * @return {Array}       the array of arguments
 */
const formatArgs = (arg, key) => `${esc(key)}=${esc(arg)}`;

/**
 * Accepts an object of query string params and creates a query string.
 * @param  {Object}  args  key: value representation of the query string args
 * @return {String}        the query string
 */
const getArgs = compose(join('&'), values, mapObjIndexed(formatArgs));

function getRecentMedia(access_token) {
  const endpoint = 'https://api.instagram.com/v1/users/self/media/recent/';
  const args = getArgs({
    count: 16,
    access_token,
  });

  return fetchJsonP(`${endpoint}?${args}`)
    .then(response => response.json());
}

export default function initialize() {
  log('TODO: initialize the IG feed reader.');

  // Retrieve the access_token from the current URL fragment.
  const token = getToken(document.location.hash);

  log(`token: "${token}"`);

  getRecentMedia(token)
    .then(log);
}
