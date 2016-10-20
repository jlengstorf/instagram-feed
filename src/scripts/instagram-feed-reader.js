// Instagram doesn’t allow CORS, so we need to use JSONP.
import fetchJSONP from 'fetch-jsonp';

// Use Bemmit for fast BEM class names.
import bemmit from 'bemmit';

// Only import the functions we need from Ramda.
import always from 'ramda/src/always';
import assoc from 'ramda/src/assoc';
import compose from 'ramda/src/compose';
import concat from 'ramda/src/concat';
import ifElse from 'ramda/src/ifElse';
import join from 'ramda/src/join';
import keys from 'ramda/src/keys';
import lens from 'ramda/src/lens';
import map from 'ramda/src/map';
import mapObjIndexed from 'ramda/src/mapObjIndexed';
import path from 'ramda/src/path';
import prop from 'ramda/src/prop';
import replace from 'ramda/src/replace';
import reduce from 'ramda/src/reduce';
import test from 'ramda/src/test';
import values from 'ramda/src/values';
import view from 'ramda/src/view';

// Create a debugger.
import debug from 'debug';
const log = debug('instagram-feed-reader');

log('Debugging is enabled!');

// Alias this long-ass function name for brevity.
const esc = encodeURIComponent;

const isLoggedIn = test(/^#access_token=/, document.location.hash);

/**
 * Creates an endpoint URI, complete with query string arguments.
 * @param  {String} queryString  the query string of arguments
 * @return {String}              the complete endpoint URI
 */
const getEndpoint = concat(`${IG_API_SELF_MEDIA_RECENT}?`);

/**
 * Creates URI-encoded query string arguments.
 * @param  {Object} args  arguments as `key: value` pairs
 * @return {Array}        the array of arguments as `key=value` pairs
 */
const formatArgs = mapObjIndexed((arg, key) => `${esc(key)}=${esc(arg)}`);

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
const cleanToken = replace('#access_token=', '');
const getToken = always(cleanToken(document.location.hash));

/**
 * Adds the access token to the argument object.
 * @param  {String} url  a URL fragment containing the access_token
 * @return {Object}      a new object containing all arguments
 */
const addTokenToArgs = assoc('access_token', getToken());

/**
 * Accepts an object of query string params and creates a query string.
 * @param  {Object}  args  key: value representation of the query string args
 * @return {String}        the query string
 */
const getQueryString = compose(join('&'), values, formatArgs, addTokenToArgs);

const buildRequestURI = compose(getEndpoint, getQueryString);

const fetchMediaAsJSON = endpoint => fetchJSONP(endpoint)
  .then(response => response.json());

const getRecentMedia = compose(fetchMediaAsJSON, buildRequestURI);

const getPhotos = prop('data');

/**
 * Creates a lens for accessing image data.
 *
 * See {@link http://randycoulman.com/blog/2016/07/12/thinking-in-ramda-lenses/}
 * for more information on what lenses are and how they work.
 *
 * @param  {Object} image  the original image object from Instagram
 * @return {Object}        a simplified object with only the image data we need
 */
const imageLens = lens(

  // The getter allows us to define an object structure & where the values are.
  image => ({
    src: path([ 'images', 'low_resolution', 'url' ], image),
    caption: path(['caption', 'text'], image),
    user: path(['user', 'username'], image),
    link: prop('link', image),
  }),

  // The setter is unused, so we just no-op it.
  ()=>{},
);
const getImageData = view(imageLens);
const handlePhotos = compose(map(getImageData), getPhotos);

const createImage = image => {
  const getClass = bemmit('instagram-feed');

  const img = document.createElement('img');
  img.classList.add(getClass('image'));
  img.src = image.src;
  img.alt = `Photo by ${image.user}`;

  const link = document.createElement('a');
  link.classList.add(getClass('link'));
  link.href = image.link;
  link.title = 'View on Instagram';
  link.appendChild(img);

  const caption = document.createElement('figcaption');
  caption.classList.add(getClass('caption'));
  caption.textContent = image.caption;

  const figure = document.createElement('figure');
  figure.classList.add(getClass());
  figure.appendChild(link);
  figure.appendChild(caption);

  const app = document.getElementById('app');
  app.appendChild(figure);
};

const displayImages = map(createImage);

const showPhotos = config => {
  getRecentMedia(config)
    .then(handlePhotos)
    .then(displayImages);
};

const showLogin = () => {
  const endpoint = IG_API_OAUTH;
  const client = IG_CLIENT_ID;
  const redirect = IG_REDIRECT_URI;
  const loginLink = `${endpoint}?client_id=${client}&redirect_uri=${redirect}&response_type=token`;

  const getClass = bemmit('instagram-feed');

  const login = document.createElement('a');
  login.classList.add(getClass('auth'));
  login.textContent = 'Authorize Instagram';
  login.href = loginLink;

  const app = document.getElementById('app');
  app.appendChild(login);
};

export default function initialize(config = { count: 16 }) {
  if (isLoggedIn) {
    showPhotos(config);
  } else {
    showLogin();
  }
}
