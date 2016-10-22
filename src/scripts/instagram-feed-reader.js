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

// Alias this long-ass function name for brevity.
const esc = encodeURIComponent;

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
 * Executes a JSONP request, then returns a Promise with the response JSON.
 * @param  {String} endpoint  the API endpoint URI to make the request
 * @return {Promise}          a promise containing the response as JSON
 */
const fetchMediaAsJSON = endpoint => fetchJSONP(endpoint)
  .then(response => response.json());

/**
 * Combines the query builder and the API request into one function.
 * @param  {Object} args  the args for the request
 * @return {Promise}      a Promise containing the response as JSON
 */
const getRecentMedia = compose(fetchMediaAsJSON, buildRequestURI);

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

/*

// This is a more functional way to create images, but I got hung up on how to
// combine these with other elements and ultimately append them to the DOM.
const setAttr = curryN(2, (image, attr) => assoc(attr, image[attr]));
const createAttrSetters = flip(map);
const pipeToList = args => pipe(...args);

const imgAttrs = ['alt', 'src', 'className'];
const createImgAttrSetters = createAttrSetters(imgAttrs);
const createImageWithAttrs = flip(call)(createElement('img'));
const imagePipeline = pipe(
  setAttr,
  createImgAttrSetters,
  pipeToList,
  createImageWithAttrs
);
*/

/**
 * Creates DOM elements for image display and appends them to the app element.
 *
 * Okay, let’s be honest here: this function is kind of a shitshow. It has a
 * ton of side effects, way too many moving parts, and even some hard-coded
 * values. However, DOM manipulation with functional programming is tricky,
 * and I’m a hobbyist at best with FP. So to all the expert functional
 * programmers whose heads just exploded: I’m very sorry.
 *
 * @param  {Object} image  the image data
 * @return {Void}
 */
const createImage = image => {

  // Bemmit makes BEM class names less unwieldy.
  const getClass = bemmit('instagram-feed');

  const img = createElement('img');
  img.classList.add(getClass('image'));
  img.src = image.src;
  img.alt = `Photo by ${image.user}`;

  // Clicking the image will take the user to this photo on Instagram.
  const link = createElement('a');
  link.classList.add(getClass('link'));
  link.href = image.link;
  link.title = 'View on Instagram';

  // Place the `<img>` tag inside the link.
  link.appendChild(img);

  // Captions for context.
  const caption = createElement('figcaption');
  caption.classList.add(getClass('caption'));
  caption.textContent = image.caption;

  // The whole shebang gets wrapped in a `<figure>` element.
  const figure = createElement('figure');
  figure.classList.add(getClass());

  // Pop the linked image and the caption inside.
  figure.appendChild(link);
  figure.appendChild(caption);

  // Get the app’s root element. This line feels like shitty code.
  const app = getElementById('app');

  // Append the new figure to the app’s root element.
  app.appendChild(figure);
};

/**
 * Loops through each image from Instagram and outputs HTML to display it.
 *
 * Since this function is all side effects (DOM manipulation), we use `forEach`
 * instead of `map`. This is a nitpicky distinction, but it’s helpful for
 * quickly identifying that this isn’t a pure function.
 *
 * @param  {Array} images  the images to display
 * @return {Void}
 */
const displayImages = forEach(createImage);

/**
 * Runs the whole program to load, process, and display Instagram images.
 * @param  {Object} args        the arguments for the API call
 * @return {Void}
 */
const showPhotos = args => {
  getRecentMedia(args)
    .then(handlePhotos)
    .then(displayImages);
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

  // Reuse the `getQueryString()` function.
  const queryString = getQueryString(args);
  const loginLink = `${IG_API_OAUTH}?${queryString}`;

  // Now we build the DOM element and add it to the app’s root element.
  const getClass = bemmit('instagram-feed');
  const login = createElement('a');
  login.classList.add(getClass('auth'));
  login.textContent = 'Authorize Instagram';
  login.href = loginLink;

  const app = getElementById('app');
  app.appendChild(login);
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
