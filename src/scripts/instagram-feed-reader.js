// Instagram doesn’t allow CORS, so we need to use JSONP.
import fetchJSONP from 'fetch-jsonp';

// Use Bemmit for fast BEM class names.
import bemmit from 'bemmit';

// Only import the functions we need from Ramda.
import assoc from 'ramda/src/assoc';
import compose from 'ramda/src/compose';
import concat from 'ramda/src/concat';
import curry from 'ramda/src/curry';
import join from 'ramda/src/join';
import mapObjIndexed from 'ramda/src/mapObjIndexed';
import replace from 'ramda/src/replace';
import tap from 'ramda/src/tap';
import test from 'ramda/src/test';
import values from 'ramda/src/values';

// Create a debugger.
import debug from 'debug';
const log = debug('instagram-feed-reader');

// Logs whatever is passed, then returns it unchanged.
const logAndReturn = tap(log);

log('Debugging is enabled!');

// Alias this long-ass function name for brevity.
const esc = encodeURIComponent;

const formatArgs = mapObjIndexed((arg, key) => `${esc(key)}=${esc(arg)}`);
const getQueryString = compose(join('&'), values, formatArgs);

const buildLoginLink = args => {
  const queryString = getQueryString(args);
  const loginLink = `${IG_API_OAUTH}?${queryString}`;

  log(`loginLink: ${loginLink}`);

  const getClass = bemmit('instagram-feed');
  const loginClass = getClass('auth');

  return `
    <a href="${loginLink}" class="${loginClass}">Authorize Instagram</a>
  `;
};

// Anything with side-effects goes in here to make it really obvious.
const unsafe = {
  renderStringToDOM: curry((selector, htmlStr) => {

    // This is a side-effect.
    document.querySelector(selector).innerHTML = htmlStr;
  }),

  fetchMediaAsJSON: endpoint => {
    return fetchJSONP(endpoint)
      .then(data => data.json())
      .then(logAndReturn);
  },
};

// Create a shortcut for rendering into our app’s wrapper element.
const render = unsafe.renderStringToDOM('#app');

const showLogin = () => {
  const args = {
    client_id: IG_CLIENT_ID,
    redirect_uri: IG_REDIRECT_URI,
    response_type: 'token',
  };

  render(buildLoginLink(args));
};

const isLoggedIn = test(/^#access_token=/);
const getToken = replace('#access_token=', '');
const addTokenToArgs = assoc('access_token');
const getQueryStringWithToken = compose(getQueryString, addTokenToArgs);
const getRecentMediaEndpoint = concat(`${IG_API_SELF_MEDIA_RECENT}?`);
const buildRequestURI = compose(getRecentMediaEndpoint, getQueryStringWithToken);

const showPhotos = (args = { count: 16 }) => {
  const token = getToken(document.location.hash);
  const endpoint = buildRequestURI(token, args);

  unsafe.fetchMediaAsJSON(endpoint);
};

export default function initialize(args) {
  if (isLoggedIn(document.location.hash)) {
    showPhotos(args);
  } else {
    showLogin();
  }
}
