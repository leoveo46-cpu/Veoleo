/* خادم MQTT 3.1.1 مصغّر فوق WebSocket للاختبارات فقط (CONNECT/SUBSCRIBE/PUBLISH/PING/Will) */
const http = require('http'), crypto = require('crypto');
function startBroker(port) {
  const clients = new Set(); const drop = { n: 0, re: /$^/ };
  const server = http.createServer((q, r) => { r.writeHead(426); r.end(); });
  const frame = data => { const len = data.length; let head; if (len < 126) head = Buffer.from([0x82, len]); else if (len < 65536) { head = Buffer.alloc(4); head[0] = 0x82; head[1] = 126; head.writeUInt16BE(len, 2); } else { head = Buffer.alloc(10); head[0] = 0x82; head[1] = 127; head.writeBigUInt64BE(BigInt(len), 2); } return Buffer.concat([head, data]); };
  const str = (b, o) => { const l = b.readUInt16BE(o); return [b.slice(o + 2, o + 2 + l), o + 2 + l]; };
  const enc = n => { const o = []; do { let d = n % 128; n = Math.floor(n / 128); if (n > 0) d |= 128; o.push(d); } while (n > 0); return Buffer.from(o); };
  const pkt = (b0, body) => Buffer.concat([Buffer.from([b0]), enc(body.length), body]);
  server.on('upgrade', (req, sock) => {
    const key = req.headers['sec-websocket-key'];
    const acc = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
    sock.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${acc}\r\nSec-WebSocket-Protocol: mqtt\r\n\r\n`);
    const c = { sock, subs: new Set(), will: null, wsbuf: Buffer.alloc(0), mq: Buffer.alloc(0), alive: true };
    clients.add(c);
    const send = b => { try { sock.write(frame(b)); } catch (e) { /* */ } };
    c.send = send;
    const gone = graceful => { if (!c.alive) return; c.alive = false; clients.delete(c); if (!graceful && c.will) route(c.will.topic, c.will.payload); try { sock.destroy(); } catch (e) { /* */ } };
    const handle = () => {
      for (;;) {
        const b = c.mq; if (b.length < 2) return;
        let len = 0, mult = 1, i = 1, byte;
        do { if (i >= b.length) return; byte = b[i++]; len += (byte & 127) * mult; mult *= 128; } while (byte & 128);
        if (b.length < i + len) return;
        const type = b[0] >> 4, p = b.slice(i, i + len); c.mq = b.slice(i + len);
        if (type === 1) { let o = 10; const flags = p[7]; let id; [id, o] = str(p, o); if (flags & 4) { let wt, wp; [wt, o] = str(p, o); [wp, o] = str(p, o); c.will = { topic: wt.toString(), payload: wp }; } send(Buffer.from([0x20, 2, 0, 0])); }
        else if (type === 8) { const id = p.slice(0, 2); let o = 2; const tps = []; while (o < p.length) { let tp; [tp, o] = str(p, o); o++; c.subs.add(tp.toString()); tps.push(0); } send(pkt(0x90, Buffer.concat([id, Buffer.from(tps)]))); }
        else if (type === 3) { const [tp, o] = str(p, 0); const ts = tp.toString(); if (drop.n > 0 && drop.re.test(ts)) { drop.n--; continue; } route(ts, p.slice(o)); }
        else if (type === 10) { const id = p.slice(0, 2); let o = 2; while (o < p.length) { let tp; [tp, o] = str(p, o); c.subs.delete(tp.toString()); } send(pkt(0xB0, id)); }
        else if (type === 12) send(Buffer.from([0xD0, 0]));
        else if (type === 14) gone(true);
      }
    };
    sock.on('data', chunk => {
      c.wsbuf = Buffer.concat([c.wsbuf, chunk]);
      for (;;) {
        const b = c.wsbuf; if (b.length < 2) return;
        const op = b[0] & 15; let len = b[1] & 127, o = 2;
        if (len === 126) { if (b.length < 4) return; len = b.readUInt16BE(2); o = 4; } else if (len === 127) { if (b.length < 10) return; len = Number(b.readBigUInt64BE(2)); o = 10; }
        const masked = b[1] & 128; const mask = masked ? b.slice(o, o + 4) : null; if (masked) o += 4;
        if (b.length < o + len) return;
        let data = b.slice(o, o + len); if (masked) { data = Buffer.from(data); for (let k = 0; k < data.length; k++) data[k] ^= mask[k & 3]; }
        c.wsbuf = b.slice(o + len);
        if (op === 8) { gone(false); return; }
        if (op === 2 || op === 0) { c.mq = Buffer.concat([c.mq, data]); handle(); }
      }
    });
    sock.on('close', () => gone(false)); sock.on('error', () => gone(false));
  });
  function route(topic, payload) { const out = pkt(0x30, Buffer.concat([Buffer.from([topic.length >> 8, topic.length & 255]), Buffer.from(topic), payload])); clients.forEach(c => { if (c.subs.has(topic)) c.send(out); }); }
  return new Promise(res => server.listen(port || 0, '127.0.0.1', () => res({ port: server.address().port,
    dropNext(n, re) { drop.n = n; drop.re = re; },
    dropAll() { clients.forEach(c => { try { c.sock.destroy(); } catch (e) { /* */ } }); },
    close() { clients.forEach(c => { try { c.sock.destroy(); } catch (e) { /* */ } }); return new Promise(r => server.close(r)); }, count: () => clients.size })));
}
module.exports = { startBroker };
