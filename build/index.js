const { Writable } = require('stream');
let erotic = require('erotic'); if (erotic && erotic.__esModule) erotic = erotic.default;
let cleanStack = require('@artdeco/clean-stack'); if (cleanStack && cleanStack.__esModule) cleanStack = cleanStack.default;
const { pipeError } = require('./lib');

function joinBufferData(array) {
  return array.join('')
}

/**
 * A writable stream which collects incoming data into memory, and provides a promise to way for the stream to finish. The promise is resolved with joined chunks.
 */
class Catchment extends Writable {
  /**
   * Create a new catchment to pipe a readable stream into and collect all emitted data.
   * @constructor
   * @param {Options} [options] Options to pass to the `Writable` super constructor, and others shown below.
 * @param {Readable} [options.rs] A readable stream to automatically pipe into the catchment. If an error occurs during reading of this stream, the catchment promise will be rejected with it.
 * @param {boolean} [options.binary=false] Whether to return a raw buffer instead of a string. The string is created by joining all incoming chunks together with `.join('')` method. Default `false`.
   * @example
   *
   * import { createReadStream } from 'fs'
   * import Catchment from 'catchment'
   *
   * const rs = createReadStream('file.txt')
   * const { promise } = new Catchment({ rs })
   * const res = await promise
   */
  constructor({ er = erotic(true), proxyError, ...options } = {}) {
    const wrap = (_, e) => er(e)
    super(options)
    const { binary, rs } = options
    this._caughtData = []
    this._promise = new Promise((r, j) => {
      this.on('finish', () => {
        let d
        if (binary) {
          d = Buffer.concat(this._caughtData)
        } else {
          d = joinBufferData(this._caughtData)
        }
        r(d)
        this._caughtData = []
      })
      this.once('error', (e) => {
        if (e.stack.indexOf('\n') == -1) {
          wrap`${e}`
          j(e)
        } else {
          const stack = cleanStack(e.stack)
          e.stack = stack
          if (proxyError) wrap`${e}`
          j(e)
        }
      })
      if (rs) {
        pipeError(this, rs).pipe(this)
      }
    })
  }
  _write(chunk, encoding, callback) {
    this._caughtData.push(chunk)
    callback()
  }
  /**
   * A promise which will resolve will all data when the stream finishes.
   * @type {Promise.<string|Buffer>}
   */
  get promise() {
    return this._promise
  }
}

module.exports=Catchment

/**
 * Collect data into a catchment, and return results when the stream finishes.
 * @param {Readable} readable A readable stream to collect all data from. If an error occurs during reading of this stream, the promise will be rejected with it.
 * @param {CollectOptions} options Options when collecting data into a catchment. They can extend `Writable` options which will be passed to the `Catchment` constructor.
 * @param {boolean} [options.binary=false] Whether to return a raw buffer instead of a string. The string is created by joining all incoming chunks together with `.join('')` method. Default `false`.
 * @param {boolean} [options.proxyError=false] Sets whether an error emitted by the stream with have its stack start at the line where the `collect` was called rather than inside of the stream. In other words, hides the implementation of the stream. Default `false`.
 * @example
 *
 * import { collect } from 'catchment'
 * import { createReadStream } from 'fs'
 *
 * const rs = createReadStream(path)
 * await collect(rs, { proxyError: true })
 */
       const collect = async (readable, options = {}) => {
  const { promise } = new Catchment({
    rs: readable,
    ...options,
    er: erotic(true),
  })
  const res = await promise
  return res
}

/* documentary types/index.xml */
/**
 * @typedef {import('stream').Readable} Readable
 *
 * @typedef {Object} Options Options to pass to the `Writable` super constructor, and others shown below.
 * @prop {Readable} [rs] A readable stream to automatically pipe into the catchment. If an error occurs during reading of this stream, the catchment promise will be rejected with it.
 * @prop {boolean} [binary=false] Whether to return a raw buffer instead of a string. The string is created by joining all incoming chunks together with `.join('')` method. Default `false`.
 */

/* documentary types/collect.xml */
/**
 * @typedef {Object} CollectOptions Options when collecting data into a catchment. They can extend `Writable` options which will be passed to the `Catchment` constructor.
 * @prop {boolean} [binary=false] Whether to return a raw buffer instead of a string. The string is created by joining all incoming chunks together with `.join('')` method. Default `false`.
 * @prop {boolean} [proxyError=false] Sets whether an error emitted by the stream with have its stack start at the line where the `collect` was called rather than inside of the stream. In other words, hides the implementation of the stream. Default `false`.
 */


module.exports.collect = collect