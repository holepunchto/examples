import Corestore from 'corestore'
import Hyperswarm from 'hyperswarm'
import goodbye from 'graceful-goodbye'
import b4a from 'b4a'

const store = new Corestore('./reader-storage')
const swarm = new Hyperswarm()

swarm.on('connection', conn => store.replicate(conn))

const core = store.get({ key: b4a.from(process.argv[2], 'hex'), valueEncoding: 'json' })
await core.ready()

const foundPeers = store.findingPeers()
swarm.join(core.discoveryKey)
swarm.flush().then(() => foundPeers())

await core.update()
if (core.length === 0) {
  console.log('Could not connect to the writer peer')
  process.exit(1)
}

const { otherKeys } = await core.get(0)
for (const key of otherKeys) {
  const core = store.get({ key: b4a.from(key, 'hex') })
  core.on('append', () => {
    const seq = core.length - 1
    core.get(seq).then(block => {
      console.log(`Block ${seq} in Core ${key}: ${block}`) 
    })
  })
}

goodbye(() => swarm.destroy())
