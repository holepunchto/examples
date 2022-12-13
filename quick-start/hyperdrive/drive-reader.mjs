import Hyperswarm from 'hyperswarm'
import Hyperdrive from 'hyperdrive'
import Localdrive from 'localdrive'
import Corestore from 'corestore'
import goodbye from 'graceful-goodbye'
import debounce from 'debounceify'
import b4a from 'b4a'

const store = new Corestore('./reader-storage')

const swarm = new Hyperswarm()
goodbye(() => swarm.destroy())
swarm.on('connection', conn => store.replicate(conn))

// Create a local copy of the remote drive
const local = new Localdrive('./reader-dir')

const drive = new Hyperdrive(store, b4a.from(process.argv[2], 'hex'))
await drive.ready()

const mirror = debounce(mirrorDrive)
drive.core.on('append', mirror)

const foundPeers = store.findingPeers()
swarm.join(drive.discoveryKey)
swarm.flush().then(() => foundPeers())

mirror()

async function mirrorDrive () {
  console.log('started mirroring remote drive into \'./reader-dir\'...')
  const mirror = drive.mirror(local)
  await mirror.done()
  console.log('finished mirroring:', mirror.count)
}
