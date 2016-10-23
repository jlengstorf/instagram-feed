// Instagram doesn’t allow CORS, so we need to use JSONP.
import fetchJSONP from 'fetch-jsonp';

// Use Bemmit for fast BEM class names.
import bemmit from 'bemmit';

// Only import the functions we need from Ramda.
import always from 'ramda/src/always';
import assoc from 'ramda/src/assoc';
import compose from 'ramda/src/compose';
import concat from 'ramda/src/concat';
import forEach from 'ramda/src/forEach';
import ifElse from 'ramda/src/ifElse';
import invoker from 'ramda/src/invoker';
import join from 'ramda/src/join';
import keys from 'ramda/src/keys';
import lens from 'ramda/src/lens';
import map from 'ramda/src/map';
import mapObjIndexed from 'ramda/src/mapObjIndexed';
import partialRight from 'ramda/src/partialRight';
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

/**
 * For debugging only, this logs, then returns the argument untouched.
 * @param  {Mixed} arg  the argument to be logged
 * @return {Mixed}      the argument, unchanged
 */
const logAndReturn = arg => { log(arg); return arg; };

// Alias this long-ass function name for brevity.
const esc = encodeURIComponent;

/**
 * To make it obvious when a function has side-effects, keep them in an object.
 * @type {Object}
 */
const unsafe = {

  /**
   * Sets the `innerHTML` element of a given element with the given string.
   * @param  {String} selector  the element selector
   * @param  {String} htmlStr   the string to insert into the target element
   * @return {Void}
   */
  renderStringToDOM: (selector, htmlStr) => {
    document.querySelector(selector).innerHTML = htmlStr;
  },

  /**
   * Executes a JSONP request, then returns a Promise with the response JSON.
   * @param  {String} endpoint  the API endpoint URI to make the request
   * @return {Promise}          a promise containing the response as JSON
   */
  fetchMediaAsJSON: endpoint => {
    return fetchJSONP(endpoint)
      .then(response => response.json());
  },
};

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
 * Checks the document hash for an access_token
 * @return {Boolean}  `true` if the access_token is present, else `false`
 */
const isLoggedIn = test(/^#access_token=/, document.location.hash);

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

/**
 * Always returns the token from the document hash after cleaning.
 * @return {String}  the Instagram access_token
 */
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
const getQueryString = compose(join('&'), values, formatArgs);

/**
 * For requests that require an access token, add the token to the arguments.
 * @param  {Object} args  the arguments for the request
 * @return {String}       the query string
 */
const getQueryStringWithToken = compose(getQueryString, addTokenToArgs);

/**
 * Combines the API endpoint and the argument query string.
 * @param  {Object} args  the args for the request
 * @return {String}       the full URI to make the API request
 */
const buildRequestURI = compose(getEndpoint, getQueryStringWithToken);

/**
 * Retrieves just the photo data from the request.
 * @param  {Object} response  the API response object
 * @return {Array}            the images array
 */
const getPhotos = prop('data');

/**
 * Creates a lens for accessing image data.
 *
 * For more information on what lenses are and how they work, see
 * {@link http://randycoulman.com/blog/2016/07/12/thinking-in-ramda-lenses/}.
 *
 * @param  {Object} image  the original image object from Instagram
 * @return {Object}        a simplified object with only the image data we need
 */
const imageLens = lens(

  // The getter allows us to define an object structure & where the values are.
  image => ({
    src: path(['images', 'low_resolution', 'url'], image),
    caption: path(['caption', 'text'], image),
    user: path(['user', 'username'], image),
    link: prop('link', image),
  }),

  // The setter is unused in this case, so we just no-op it.
  () => {}
);

/**
 * Uses the lens to return an object with the data we need in the right format.
 * @param  {Object} image  the image object we want to create the view from
 * @return {Object}        the image data in the structure defined in the lens
 */
const getImageData = view(imageLens);

/**
 * Creates an array of simplified image objects from the API response.
 *
 * Instead of dealing with the unweildy, complex image objects from Instagram’s
 * JSON, we’re using a lens to create simplified objects with _only_ the data
 * we actually need, which makes things much simpler when we start using
 * the data.
 *
 * @param  {Object} response  the API response as JSON
 * @return {Array}            an array of simplified objects
 */
const handlePhotos = compose(map(getImageData), getPhotos);

/**
 * Make it possible to use `document.createElement` functionally.
 *
 * @param  {String}  tagName  the type of Element to create
 * @return {Element}          the created Element
 */
const createElement = partialRight(invoker(1, 'createElement'), [document]);

/**
 * Make it possible to use `document.getElementById` functionally.
 * @param  {String}  id  the ID of the Element to select
 * @return {Element}     the selected Element
 */
const getElementById = partialRight(invoker(1, 'getElementById'), [document]);

/**
 * Creates image markup as a string.
 * @param  {Object} image  the image data
 * @return {String}        markup to display the image
 */
const createImage = image => {

  // Bemmit makes BEM class names less unwieldy.
  const getClass = bemmit('instagram-feed');

  // Get class names ahead of time to keep things cleaner.
  const figureClass = getClass();
  const linkClass = getClass('link');
  const imageClass = getClass('image');
  const captionClass = getClass('caption');

  return `
    <figure class="${figureClass}">
      <a href="${image.link}" class="${linkClass}">
        <img src="${image.src}" alt="Photo by ${image.user}"
             class="${imageClass}" />
      </a>
      <figcaption class="${captionClass}">${image.caption}</figcaption>
    </figure>
  `;
};

/**
 * Generates an array of markup strings from an array of image data objects.
 * @param  {Array} images  an array of image data objects
 * @return {Array}         an array of image markup strings
 */
const getImageMarkupArray = map(createImage);

/**
 * Reduces the array of image markup strings into a single string of HTML.
 * @param  {Array} images  an array of image markup strings
 * @return {String}        a string of HTML markup
 */
const combineImageMarkup = reduce(concat, '');

/**
 * Accepts an array of image data objects and returns HTML to display them.
 * @param  {Array} images  an array of image data objects
 * @return {String}        a string of HTML markup
 */
const generateMarkup = compose(combineImageMarkup, getImageMarkupArray);

const buildLoginLink = args => {

  // Reuse the `getQueryString()` function.
  const queryString = getQueryString(args);
  const loginLink = `${IG_API_OAUTH}?${queryString}`;

  // Now we build the DOM element and add it to the app’s root element.
  const getClass = bemmit('instagram-feed');
  const loginClass = getClass('auth');
  return `
    <a href="${loginLink}" class="${loginClass}">Authorize Instagram</a>
  `;
};

/**
 * Sets the `innerHTML` of the `#app` element.
 * @param  {String} htmlString  the markup to display in the app
 * @return {Void}
 */
const render = htmlString => unsafe.renderStringToDOM('#app', htmlString);

/**
 * Runs the whole program to load, process, and display Instagram images.
 * @param  {Object} args        the arguments for the API call
 * @return {Void}
 */
const showPhotos = args => {
  const endpoint = buildRequestURI(args);

  unsafe.fetchMediaAsJSON(endpoint) // 1.  Send the request to Instagram
    .then(logAndReturn)             // 1a. Log the response
    .then(handlePhotos)             // 2.  Create an array of image objects
    .then(logAndReturn)             // 2a. Log the array of image objects
    .then(generateMarkup)           // 3.  Generate markup from the array
    .then(logAndReturn)             // 3a. Log the generated markup
    .then(render);                  // 4.  Render the image markup
};

/**
 * Creates a login link and appends it to the DOM.
 * @return {Void}
 */
const showLogin = () => {

  /*
   * See {@link https://www.instagram.com/developer/authentication/} for the
   * required args to perform implicit authentication.
   */
  const args = {
    client_id: IG_CLIENT_ID,
    redirect_uri: IG_REDIRECT_URI,
    response_type: 'token',
  };

  render(buildLoginLink(args));
};

/**
 * Kicks off the whole app by showing either a login or a gallery of images.
 * @param  {Object} config  configuration arguments for the app
 * @return {Void}
 */
export default function initialize(config = { count: 16 }) {
  if (isLoggedIn) {
    showPhotos(config);
  } else {
    showLogin();
  }
}
