import Corestore from 'corestore'
import Hyperswarm from 'hyperswarm'
import goodbye from 'graceful-goodbye'
import b4a from 'b4a'

const store = new Corestore('./writer-storage')
const swarm = new Hyperswarm()

// A name is a purely-local, and maps to a key pair. It's not visible to readers.
// Since a name always corresponds to a key pair, you must own any core you load by name
const core1 = store.get({ name: 'core-1', valueEncoding: 'json' })
const core2 = store.get({ name: 'core-2' })
const core3 = store.get({ name: 'core-3' })
await Promise.all([core1.ready(), core2.ready(), core3.ready()])

console.log('main core key:', b4a.toString(core1.key, 'hex'))

// Here we'll only join the swarm with the core1's discovery key
// We don't need to announce core2 and core3, because they'll be replicated alongside core1
swarm.join(core1.discoveryKey)

// Corestore replication internally manages replicating every loaded core
// Corestore *does not* exchange keys (read capabilities) during replication.
swarm.on('connection', conn => store.replicate(conn))

// Since Corestore does not exchange keys, they need to be exchanged elsewhere.
// Here, we'll record the other keys in the first block of core1.
if (core1.length === 0) {
  await core1.append({
    otherKeys: [core2, core3].map(core => b4a.toString(core.key, 'hex'))
  })
}

// Record all short messages in core2, and all long ones in core3
process.stdin.on('data', data => {
  if (data.length < 5) {
    console.log('appending short data to core2')
    core2.append(data)
  } else {
    console.log('appending long data to core3')
    core3.append(data)
  }
})

goodbye(() => swarm.destroy())
