// Instagram doesn’t allow CORS, so we need to use JSONP.
import fetchJSONP from 'fetch-jsonp';

// Use Bemmit for fast BEM class names.
import bemmit from 'bemmit';

// Only import the functions we need from Ramda.
import applySpec from 'ramda/src/applySpec';
import assoc from 'ramda/src/assoc';
import compose from 'ramda/src/compose';
import concat from 'ramda/src/concat';
import curry from 'ramda/src/curry';
import join from 'ramda/src/join';
import map from 'ramda/src/map';
import mapObjIndexed from 'ramda/src/mapObjIndexed';
import path from 'ramda/src/path';
import prop from 'ramda/src/prop';
import reduce from 'ramda/src/reduce';
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
