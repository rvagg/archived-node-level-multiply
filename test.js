const test     = require('tap').test
    , rimraf   = require('rimraf')
    , levelup  = require('levelup')
    , multiply = require('./')

var ltest = function (name, fn) {
  test(name, function (t) {
    var location = '__multiply-' + Math.random()
      , db

    t._end = t.end
    t.end = function () {
      db.close(function (err) {
        t.notOk(err, 'no error on close()')
        rimraf(location, t._end.bind(t))
      })
    }

    levelup(location, function (err, _db) {
      t.notOk(err, 'no error on open()')

      db = multiply(_db)

      fn(db, t)
    })
  })
}

// test that the standard API is working as it should
ltest('test singular get()', function (db, t) {
  t.throws(db.get.bind(db))

  db.get('foo', function (err) {
    t.ok(err, 'returned error')
    t.equal(err.name, 'NotFoundError', 'correct error type')
    t.end()
  })
})

ltest('test singular put() & get()', function (db, t) {
  t.throws(db.put.bind(db))

  db.put('foo', 'bar', function (err) {
    t.notOk(err, 'no error')
    db.get('foo', function (err, value) {
      t.notOk(err, 'no error')
      t.equal(value, 'bar', 'got expected value')
      t.end()
    })
  })
})

ltest('test singular del()', function (db, t) {
  t.throws(db.del.bind(db))

  db.del('foo', function (err) {
    t.notOk(err, 'no error')
    t.end()
  })
})

ltest('test multiple get()', function (db, t) {
  db.batch([
      { type: 'put', key: 'foo1', value: 'foovalue1' }
    , { type: 'put', key: 'foo2', value: 'foovalue2' }
    , { type: 'put', key: 'foo3', value: 'foovalue3' }
    , { type: 'put', key: 'foo4', value: 'foovalue4' }
    , { type: 'put', key: 'foo5', value: 'foovalue5' }
  ], function (err) {
    t.notOk(err, 'no error')

    db.get([ 'foo2', 'foo4', 'foo6' ], function (err, data) {
      t.notOk(err, 'no error')

      t.deepEqual(data, {
          foo2: 'foovalue2'
        , foo4: 'foovalue4'
        , foo6: null
      }, 'correct data')

      t.end()
    })
  })
})

ltest('test multiple put()', function (db, t) {
  db.put({
      foo1: 'foovalue1'
    , foo2: 'foovalue2'
    , foo3: 'foovalue3'
    , foo4: 'foovalue4'
    , foo5: 'foovalue5'
  }, function (err) {
    t.notOk(err, 'no error')

    db.get([ 'foo1', 'foo2', 'foo3', 'foo4', 'foo5' ], function (err, data) {
      t.notOk(err, 'no error')

      t.deepEqual(data, {
          foo1: 'foovalue1'
        , foo2: 'foovalue2'
        , foo3: 'foovalue3'
        , foo4: 'foovalue4'
        , foo5: 'foovalue5'
      }, 'correct data')

      t.end()
    })
  })
})

ltest('test multiple del()', function (db, t) {
  db.batch([
      { type: 'put', key: 'foo1', value: 'foovalue1' }
    , { type: 'put', key: 'foo2', value: 'foovalue2' }
    , { type: 'put', key: 'foo3', value: 'foovalue3' }
    , { type: 'put', key: 'foo4', value: 'foovalue4' }
    , { type: 'put', key: 'foo5', value: 'foovalue5' }
  ], function (err) {
    t.notOk(err, 'no error')

    db.del([ 'foo1', 'foo3', 'foo5' ], function (err) {
      t.notOk(err, 'no error')

      db.get([ 'foo1', 'foo2', 'foo3', 'foo4', 'foo5' ], function (err, data) {
        t.notOk(err, 'no error')

        t.deepEqual(data, {
            foo1: null
          , foo2: 'foovalue2'
          , foo3: null
          , foo4: 'foovalue4'
          , foo5: null
        }, 'correct data')

        t.end()
      })
    })
  })
})

test('test prefixed methods', function (t) {
  var location = '__multiply-' + Math.random()

  levelup(location, function (err, db) {
    t.notOk(err, 'no error on open()')

    var orig = {
        get: db.get
      , put: db.put
      , del: db.del
    }

    t.notOk(db.multiget, 'multiget() not defined')
    t.notOk(db.multiput, 'multiput() not defined')
    t.notOk(db.multidel, 'multidel() not defined')

    db = multiply(db, 'multi')

    t.equal(db.get, orig.get, 'get() not replaced')
    t.equal(db.put, orig.put, 'put() not replaced')
    t.equal(db.del, orig.del, 'del() not replaced')

    t.type(db.multiget, 'function', 'multiget() defined')
    t.type(db.multiput, 'function', 'multiput() defined')
    t.type(db.multidel, 'function', 'multidel() defined')

    db.close(function (err) {
      t.notOk(err, 'no error on close()')
      rimraf(location, t.end.bind(t))
    })
  })
})
