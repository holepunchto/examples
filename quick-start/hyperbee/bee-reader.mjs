import Hyperswarm from 'hyperswarm'
import Corestore from 'corestore'
import Hyperbee from 'hyperbee'
import goodbye from 'graceful-goodbye'
import b4a from 'b4a'

const store = new Corestore('./reader-storage')

const swarm = new Hyperswarm()
goodbye(() => swarm.destroy())
swarm.on('connection', conn => store.replicate(conn))

const core = store.get({ key: b4a.from(process.argv[2], 'hex') })
const bee = new Hyperbee(core, {
  keyEncoding: 'utf-8',
  valueEncoding: 'utf-8'
})

await core.ready()
console.log('core key here is:', core.key.toString('hex'))

// Attempt to connect to peers
swarm.join(core.discoveryKey)

// Do a single Hyperbee.get for every line of stdin data
// Each `get` will only download the blocks necessary to satisfy the query
process.stdin.setEncoding('utf-8')
process.stdin.on('data', data => {
  const word = data.trim()
  if (!word.length) return
  bee.get(word).then(node => {
    if (!node || !node.value) console.log(`No dictionary entry for ${data}`)
    else console.log(`${data} -> ${node.value}`)
  }, err => console.error(err))
})
