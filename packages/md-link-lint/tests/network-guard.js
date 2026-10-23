import http from 'node:http'
import https from 'node:https'
import net from 'node:net'
import tls from 'node:tls'
import { syncBuiltinESMExports } from 'node:module'

/** Emit a recognizable diagnostic and fail any network request made by the tested CLI. */
function rejectNetworkRequest() {
  process.stderr.write('NETWORK_GUARD_TRIGGERED\n')
  throw new Error("Network access is outside md-link-lint's scope")
}

http.get = rejectNetworkRequest
http.request = rejectNetworkRequest
https.get = rejectNetworkRequest
https.request = rejectNetworkRequest
net.connect = rejectNetworkRequest
net.createConnection = rejectNetworkRequest
tls.connect = rejectNetworkRequest
globalThis.fetch = rejectNetworkRequest

syncBuiltinESMExports()
