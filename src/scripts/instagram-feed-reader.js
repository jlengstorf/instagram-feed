// Instagram doesn’t allow CORS, so we need to use JSONP.
import fetchJSONP from 'fetch-jsonp';

// Use Bemmit for fast BEM class names.
import bemmit from 'bemmit';

// Only import the functions we need from Ramda.
import compose from 'ramda/src/compose';
import curry from 'ramda/src/curry';
import join from 'ramda/src/join';
import mapObjIndexed from 'ramda/src/mapObjIndexed';
import test from 'ramda/src/test';
import values from 'ramda/src/values';

// Create a debugger.
import debug from 'debug';
const log = debug('instagram-feed-reader');

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

const unsafe = {
  renderStringToDOM: curry((selector, htmlStr) => {

    // This is a side-effect.
    document.querySelector(selector).innerHTML = htmlStr;
  }),
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

export default function initialize() {
  if (isLoggedIn(document.location.hash)) {

    // TODO load user media from Instagram

  } else {
    showLogin();
  }
}
