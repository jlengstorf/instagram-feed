// Import the Instagram feed reader.
import igFeedReader from './instagram-feed-reader';

// Create a debugger.
import debug from 'debug';
const log = debug('app:main');

log('Starting the app...');

// Start the app.
igFeedReader();

log('App started.');
