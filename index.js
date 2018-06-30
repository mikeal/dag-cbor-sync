const cbor = require('borc')
const CID = require('cids')
const isCircular = require('is-circular')

const sha2 = b => crypto.createHash('sha256').update(b).digest()

const CID_CBOR_TAG = 42

/* start copy from exisisting dag-cbor */
function tagCID (cid) {
  if (typeof cid === 'string') {
    cid = new CID(cid).buffer
  }

  return new cbor.Tagged(CID_CBOR_TAG, Buffer.concat([
    Buffer.from('00', 'hex'), // thanks jdag
    cid
  ]))
}

function replaceCIDbyTAG (dagNode) {
  let circular
  try {
    circular = isCircular(dagNode)
  } catch (e) {
    circular = false
  }
  if (circular) {
    throw new Error('The object passed has circular references')
  }

  function transform (obj) {
    if (!obj || Buffer.isBuffer(obj) || typeof obj === 'string') {
      return obj
    }

    if (Array.isArray(obj)) {
      return obj.map(transform)
    }

    const keys = Object.keys(obj)

    // only `{'/': 'link'}` are valid
    if (keys.length === 1 && keys[0] === '/') {
      // Multiaddr encoding
      // if (typeof link === 'string' && isMultiaddr(link)) {
      //  link = new Multiaddr(link).buffer
      // }

      return tagCID(obj['/'])
    } else if (keys.length > 0) {
      // Recursive transform
      let out = {}
      keys.forEach((key) => {
        if (typeof obj[key] === 'object') {
          out[key] = transform(obj[key])
        } else {
          out[key] = obj[key]
        }
      })
      return out
    } else {
      return obj
    }
  }

  return transform(dagNode)
}
/* end copy from existing dag-cbor */

module.exports = (maxsize) => {
  _decoder = new cbor.Decoder({
    tags: {
      [CID_CBOR_TAG]: (val) => {
        val = val.slice(1)
        return {'/': val}
      }
    },
    /* Defaults to the borc default. */
    size: maxsize
  })

  return {
    deserialize: (buffer) => {
      return _decoder.decodeFirst(buffer)
    },
    serialize: (dagNode) => {
      let dagNodeTagged = replaceCIDbyTAG(dagNode)
      return cbor.encode(dagNodeTagged)
    }
  }
}