import Hyperswarm from 'hyperswarm'
import Hyperdrive from 'hyperdrive'
import Localdrive from 'localdrive'
import Corestore from 'corestore'
import goodbye from 'graceful-goodbye'
import debounce from 'debounceify'
import b4a from 'b4a'

const store = new Corestore('./writer-storage')
const swarm = new Hyperswarm()
goodbye(() => swarm.destroy())
swarm.on('connection', conn => store.replicate(conn))

// A local drive provides a Hyperdrive interface to a local directory
const local = new Localdrive('./writer-dir')

// A Hyperdrive takes a Corestore because it needs to create many cores
// One for a file metadata Hyperbee, and one for a content Hypercore
const drive = new Hyperdrive(store)
await drive.ready()

// Import changes from the local drive into the Hyperdrive
const mirror = debounce(mirrorDrive)

const discovery = swarm.join(drive.discoveryKey)
await discovery.flushed()

console.log('drive key:', b4a.toString(drive.key, 'hex'))

process.stdin.setEncoding('utf-8')
process.stdin.on('data', (d) => {
  if (!d.match('\n')) return
  mirror()
})

async function mirrorDrive () {
  console.log('started mirroring changes from \'./writer-dir\' into the drive...')
  const mirror = local.mirror(drive)
  await mirror.done()
  console.log('finished mirroring:', mirror.count)
}
