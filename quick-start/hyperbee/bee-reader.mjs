import Hyperswarm from 'hyperswarm'
import Corestore from 'corestore'
import Hyperbee from 'hyperbee'
import goodbye from 'graceful-goodbye'
import b4a from 'b4a'

const store = new Corestore('./reader-storage')

const swarm = new Hyperswarm()
swarm.on('connection', conn => store.replicate(conn))

const core = store.get({ key: b4a.from(process.argv[2], 'hex') })
const bee = new Hyperbee(core)

await core.ready()
const foundPeers = store.findingPeers()
swarm.join(core.discoveryKey)
swarm.flush().then(() => foundPeers())

process.stdin.on('data', data => {
  bee.get(data).then(node => {
    if (!node || !node.value) console.log(`No dictionary entry for ${data}`)
    else console.log(`${data} -> ${node.value}`)
  }, err => console.error(err))
})

goodbye(() => swarm.destroy())
