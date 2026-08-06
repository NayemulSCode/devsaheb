/**
 * Phusion Passenger entry point.
 *
 * cPanel's "Setup Node.js App" asks for a startup file and defaults to app.js.
 * The real app lives in server.js; this only exists so the cPanel field can be
 * left at its default.
 *
 * If Passenger on your host cannot load ESM, set the startup file to server.js
 * directly, or ask support which Node version the selector is pinned to -
 * Passenger needs Node 20+ for this project regardless.
 */
import './server.js';
