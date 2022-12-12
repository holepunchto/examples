import DHT from '@hyperswarm/dht'
import goodbye from 'graceful-goodbye'
import b4a from 'b4a'

const dht = new DHT()

// This keypair is your peer identifier in the DHT
const keyPair = DHT.keyPair()

const server = dht.createServer(conn => {
  console.log('got connection!')
  process.stdin.pipe(conn).pipe(process.stdout)
})
server.listen(keyPair).then(() => {
  console.log('listening on:', b4a.toString(keyPair.publicKey, 'hex'))
})

// Unnannounce the public key before exiting the process
// (This is not a requirement, but it helps avoid DHT pollution)
goodbye(() => server.close())
