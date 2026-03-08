/**
 * Node.js 22 + Windows: fs.readlink throws EISDIR for non-symlinks (regular files/dirs).
 * Webpack expects EINVAL. This preload script patches all readlink variants globally
 * BEFORE any module (webpack, graceful-fs, etc.) caches a reference.
 */
'use strict';

const fs = require('fs');

function patchEISDIR(err) {
  if (err && err.code === 'EISDIR') {
    err.code = 'EINVAL';
    err.errno = -4071;
    err.message = err.message.replace('EISDIR', 'EINVAL');
  }
  return err;
}

// --- Patch callback-based fs ---
const _readlink = fs.readlink;
fs.readlink = function(p, options, callback) {
  if (typeof options === 'function') { callback = options; options = undefined; }
  return _readlink.call(fs, p, options, function(err, result) {
    callback(patchEISDIR(err), result);
  });
};
Object.defineProperty(fs.readlink, '__patched', { value: true });

const _readlinkSync = fs.readlinkSync;
fs.readlinkSync = function(p, options) {
  try { return _readlinkSync.call(fs, p, options); }
  catch (err) { throw patchEISDIR(err); }
};

const _lstat = fs.lstat;
fs.lstat = function(p, options, callback) {
  if (typeof options === 'function') { callback = options; options = undefined; }
  return _lstat.call(fs, p, options, function(err, result) {
    callback(patchEISDIR(err), result);
  });
};

const _lstatSync = fs.lstatSync;
fs.lstatSync = function(p, options) {
  try { return _lstatSync.call(fs, p, options); }
  catch (err) { throw patchEISDIR(err); }
};

// --- Patch fs.promises ---
// In Node.js 22, fs.promises methods use internal bindings directly.
// We need to replace them on the promises object.
const fsp = fs.promises;
const _fspReadlink = fsp.readlink;
const _fspLstat = fsp.lstat;

try {
  Object.defineProperty(fsp, 'readlink', {
    configurable: true,
    writable: true,
    value: async function readlink(p, options) {
      try { return await _fspReadlink.call(fsp, p, options); }
      catch (err) { throw patchEISDIR(err); }
    },
  });
} catch (e) {
  // If defineProperty fails, try direct assignment
  try { fsp.readlink = async function(p, options) {
    try { return await _fspReadlink.call(fsp, p, options); }
    catch (err) { throw patchEISDIR(err); }
  }; } catch {}
}

try {
  Object.defineProperty(fsp, 'lstat', {
    configurable: true,
    writable: true,
    value: async function lstat(p, options) {
      try { return await _fspLstat.call(fsp, p, options); }
      catch (err) { throw patchEISDIR(err); }
    },
  });
} catch (e) {
  try { fsp.lstat = async function(p, options) {
    try { return await _fspLstat.call(fsp, p, options); }
    catch (err) { throw patchEISDIR(err); }
  }; } catch {}
}
