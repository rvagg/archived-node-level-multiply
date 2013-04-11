# Level-Multiply [![Build Status](https://secure.travis-ci.org/rvagg/node-level-multiply.png)](http://travis-ci.org/rvagg/node-level-multiply)

![LevelDB Logo](https://twimg0-a.akamaihd.net/profile_images/3360574989/92fc472928b444980408147e5e5db2fa_bigger.png)

**Make your [LevelUP](https://github.com/rvagg/node-levelup) `get()`, `put()` and `del()` accept multiples keys & values.**

Augment the standard implementations to take multiple keys and values and do the correct thing with them:

```js
var levelup       = require('levelup')
  , levelMultiply = require('level-multiply')

levelup('/tmp/foo.db', function (err, db) {
  db = levelMultiply(db)

  // ------ put() -------- //

  // works like normal
  db.put('foo', 'bar', function (err) { /* .. */ })

  // turned into an atomic batch() exclusively composed of
  // 'put' operations.
  db.put({ foo: 'bar', boom: 'bang', whoa: 'dude' }, function (err) {
    // database now contains these 3 entries:
    //   foo=bar
    //   boom=bang
    //   whoa=dude
  })

  // ------ get() -------- //

  // works like normal
  db.get('foo', function (err, value) { /* .. */ })

  // 4 separate get() operations combined and returned in a single object
  db.get([ 'foo', 'boom', 'whoa', 'wha' ], function (err, data) {
    // `data` looks like this:
    // {
    //     foo  : 'bar'
    //   , boom : 'bang'
    //   , whoa : 'dude'
    //   , wha  : null
    // }
    // note that missing values will be converted to `null`
  })

  // ------ del() -------- //

  // works like normal
  db.del('foo', function (err, value) { /* .. */ })

  // 4 separate del() operations combined, callback triggered when
  // all have completed
  db.del([ 'foo', 'boom', 'whoa', 'wha' ], function (err, data) {
    // database no longer has 'foo', 'boom' or 'whoa' ('wha' was never there)
  })
})
```

## Hey! Don't molest my original methods!

OK, perhaps this causes problems for you because you're using JSON keys, so an operation like: `get([ 'foo', 'bar' ]...)` is a legitimate call because it could be converted to a key of `'["foo","bar"]'`. In this case, Level-Multiply is going to get in your way and intercept those calls. Or perhaps you *just don't like monkey patching*; fair enough.

```js
levelup('/tmp/foo.db', function (err, db) {
  db = levelMultiply(db, 'multi')

  // Now your original db.get(), db.put() and db.del() methods
  // remain untouched but you have new ones, prefixed with 'multi'.
  // Note that this prefix can be whatever you like, just supply it
  // to the initialiser function above

  db.multiput({ foo: 'bar', boom: 'bang' }, function (err) { /* .. */ })

  db.multiget([ 'foo', 'boom' ], function (err, data) { /* .. */ })

  db.multidel([ 'foo', 'boom' ], function (err, data) { /* .. */ })
})
```

## Atomicity

Both `put()` and `del()` operations are converted directly to `batch()` operations so your entries will be *put* or *deleted* atomically. As we don't (quite) yet have snapshots exposed through LevelUP/LevelDOWN there are no equivalent consistency guarantees about `get()`. While they will be queued asynchronously and will *likely* happen sequentially, or close to sequentially ... but they may not. If this kind of consistency is important to you then file an issue on LevelUP or LevelDOWN and moan about having snapshots implemented; once they are available, a multi-`get()` operation can operate on a consistent point-in-time view of the database.

## Licence

Level-Multiply is Copyright (c) 2013 Rod Vagg [@rvagg](https://twitter.com/rvagg) and licensed under the MIT licence. All rights not explicitly granted in the MIT license are reserved. See the included LICENSE file for more details.