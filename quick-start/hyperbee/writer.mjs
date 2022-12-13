import fs from 'fs'
import zlib from 'zlib'

import Hyperswarm from 'hyperswarm'
import Corestore from 'corestore'
import Hyperbee from 'hyperbee'
import goodbye from 'graceful-goodbye'
import b4a from 'b4a'

const store = new Corestore('./writer-storage')

const swarm = new Hyperswarm()
goodbye(() => swarm.destroy())
swarm.on('connection', conn => store.replicate(conn))

const core = store.get({ name: 'my-bee-core' })
const bee = new Hyperbee(core, {
  keyEncoding: 'utf-8',
  valueEncoding: 'utf-8'
})

await core.ready()
const discovery = swarm.join(core.discoveryKey)

// Only display the key once the Hyperbee has been announced to the DHT
discovery.flushed().then(() => console.log('bee key:', b4a.toString(core.key, 'hex')))

// Only import the dictionary the first time this script is executed
// The first block will always be the Hyperbee header block
if (core.length <= 1) {
  console.log('importing dictionary...')
  const dict = await loadDictionary()
  const batch = bee.batch()
  for (const { key, value } of dict) {
    await batch.put(key, value)
  }
  await batch.flush()
} else {
  // Otherwise just seed the previously-imported dictionary
  console.log('seeding dictionary...')
}

async function loadDictionary() {
  const compressed = await fs.promises.readFile('./dict.json.gz')
  return new Promise((resolve, reject) => {
    zlib.unzip(compressed, (err, dict) => {
      if (err) return reject(err)
      return resolve(JSON.parse(b4a.toString(dict)))
    })
  })
}
