import loadRecentInstagramPosts from './instagram-feed-reader';

// Create a debugger.
import debug from 'debug';
const log = debug('app:main');

log('Starting the app...');

// Start the app.
loadRecentInstagramPosts({ count: 12 });

log('App started.');
