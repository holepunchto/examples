import Hypercore from 'hypercore'
import Hyperswarm from 'hyperswarm'
import Corestore from 'corestore'
import goodbye from 'graceful-goodbye'
import b4a from 'b4a'

import { Node } from 'hyperbee/lib/messages.js'

const store = new Corestore('./reader-storage')

const swarm = new Hyperswarm()
goodbye(() => swarm.destroy())
swarm.on('connection', conn => store.replicate(conn))

const core = store.get({ key: b4a.from(process.argv[2], 'hex') })
await core.ready()

const foundPeers = store.findingPeers()
swarm.join(core.discoveryKey)
swarm.flush().then(() => foundPeers())

await core.update()

const seq = core.length - 1
const lastBlock = await core.get(core.length - 1)
console.log(`Raw Block ${seq}:`, lastBlock)
console.log(`Decoded Block ${seq}`, Node.decode(lastBlock))
