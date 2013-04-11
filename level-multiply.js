const after = require('after')

var getCallback = function (options, callback) {
      return typeof options == 'function' ? options : callback
    }

  , get = function (db, keys, options, callback) {
      if (Array.isArray(keys)) {
        callback = getCallback(options, callback)
        options = typeof options != 'object' || typeof options != 'string'
          ? {}
          : options

        var data = {}
          , done = after(keys.length, function (err) {
              if (err) return callback(err)
              callback(null, data)
            })

        keys.forEach(function (key) {
          db.get(key, options, function (err, value) {
            if (err) {
              if (err.name == 'NotFoundError')
                value = null
              else
                return done(err)
            }
            data[key] = value
            done()
          })
        })
      } else {
        db._multiply.get.call(db, keys, options, callback)
      }
    }

  , put = function (db, key, value, options, callback) {
      if (typeof key == 'object') {
        var batch = Object.keys(key).reduce(function (p, k) {
          if (Object.prototype.hasOwnProperty.call(key, k)) {
            p.push({ type: 'put', key: k, value: key[k] })
          }
          return p
        }, [])
        db.batch(batch, value, options)
      } else {
        db._multiply.put.call(db, key, value, options, callback)
      }
    }

  , del = function (db, keys, options, callback) {
      if (Array.isArray(keys)) {
        var batch = keys.map(function (k) {
          return { type: 'del', key: k }
        })
        db.batch(batch, options, callback)
      } else {
        db._multiply.del.call(db, keys, options, callback)
      }
    }

  , setup = function (db, mpfx) {
      if (db._multiply)
        return

      if (typeof mpfx != 'string')
        mpfx = ''

      db._multiply = {
          get : db.get
        , put : db.put
        , del : db.del
      }

      db[mpfx + 'get'] = get.bind(null, db)
      db[mpfx + 'put'] = put.bind(null, db)
      db[mpfx + 'del'] = del.bind(null, db)

      return db
    }

module.exports = setup