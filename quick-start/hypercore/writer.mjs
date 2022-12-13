import Hyperswarm from 'hyperswarm'
import Hypercore from 'hypercore'
import goodbye from 'graceful-goodbye'
import b4a from 'b4a'

const swarm = new Hyperswarm()
goodbye(() => swarm.destroy())

const core = new Hypercore('./writer-storage')

// core.key and core.discoveryKey will only be set after core.ready resolves
await core.ready()
console.log('hypercore key:', b4a.toString(core.key, 'hex'))

// Append all stdin data as separate blocks to the core
process.stdin.on('data', data => core.append(data))

// core.discoveryKey is *not* a read capability for the core
// It's only used to discover other peers who *might* have the core
swarm.join(core.discoveryKey)
swarm.on('connection', conn => core.replicate(conn))
