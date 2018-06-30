const {test} = require('tap')
const cbor = require('../')

const defaults = cbor()

test('empty', t => {
  t.plan(1)
  let buffer = defaults.serialize({})
  t.same(defaults.deserialize(buffer), {})
})

test('links', t => {
  t.plan(2)
  let obj = {
    testobj: {'/': 'zdpuAkv7jA671owT26AnJiFXG9usHmCAW6MTzpwFJw46X1PLG'},
    testarray: [
      {'/': 'zdpuAkv7jA671owT26AnJiFXG9usHmCAW6MTzpwFJw46X1PLG'}
    ]
  }
  let buffer = defaults.serialize(obj)
  let output = defaults.deserialize(buffer)
  t.ok(Buffer.isBuffer(output.testobj['/']))
  t.ok(Buffer.isBuffer(output.testarray[0]['/']))
})
