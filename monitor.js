const zmq = require('zeromq')
  , bitcore = require('bitcore-lib') // npm install encrypt-s/bitcore-lib
  , clock = require('human-readable-time')
  , printf = require('printf')
  , sock = zmq.socket('sub')
  , hrt = new clock('%D%/%M%/%YY% %hh%:%mm%:%ss%')
  , Block = bitcore.Block
  , Script = bitcore.Script
  , Output = bitcore.Output
  , PublicKey = bitcore.PublicKey
  , Table = require('cli-table')
  , Transaction = bitcore.Transaction;

const port = 30000;

sock.connect('tcp://127.0.0.1:'+port);
sock.subscribe('rawblock');
sock.subscribe('hashblock');

console.log("");
console.log("┌──────────────────────────────────────────────────────────────────────────────────┐");
console.log("│                                                                                  │");
console.log("│    N A V C O I N                                                                 │");
console.log("│    B a d C l o c k e r                                                           │");
console.log("│    S P O T T E R                                                                 │");
console.log("│                             https://www.github.com/aguycalled/badclockerspotter  │");
console.log("│    v0.1                     alex v. <alex@encrypt-s.com>                         │");
console.log("│                                                                                  │");
console.log("└──────────────────────────────────────────────────────────────────────────────────┘");

console.log("");
console.log("~~~INFO~~~ NavCoin daemon should be run with -zmqpubrawblock=tcp://127.0.0.1:"+port);
console.log("~~~STAT~~~ Waiting for bad-clockers...");
console.log("");

var count = {};

var networkTime = [];
var localTime = [];

var prevBlock = undefined;
var prevDiff = undefined;

sock.on('message', (topic, message) => {
  if(topic == 'rawblock') {
    var diff = 0;
    var block = new Block(message).toObject();
    if(prevDiff) {
      diff = block.header.bits - prevDiff;
    }
    prevDiff = block.header.bits;

    var diffPrevL = 0;
    if(localTime.length > 0) {
      diffPrevL = (new Date().getTime() / 1000) - localTime[localTime.length - 1];
    }

    var diffPrevN = 0;
    if(networkTime.length > 0) {
      diffPrevN = block.header.time - networkTime[networkTime.length - 1];
    }

    localTime.push(parseInt(new Date().getTime() / 1000));
    networkTime.push(parseInt(block.header.time));

    if(0 < diff && prevBlock && Math.abs(diffPrevL - diffPrevN) > 10) 
    {
      var address=new PublicKey(new Script(prevBlock.transactions[1].outputs[1].script).getPublicKey()).toAddress();
      if(count[address] == undefined)
      {
        count[address] = {};
        count[address].count = 0;
        count[address].drift = [];
      }
      count[address].count++;
      count[address].version = prevBlock.transactions[1].strdzeel;
      count[address].lastBlock = block.header.hash;

      table = new Table({head: ["Address", "Count", "Version", "Last Block"]});
      var ar = [];
      for(var k in count) {
        ar.push([k, count[k].count, count[address].version.split(";")[1], count[address].lastBlock])
      }
      ar.sort(function(a, b) {
        return b[1] - a[1];
      });
      process.stdout.write('\033c');
      table.push.apply(table,ar);
      console.log(table.toString());
    }
    prevBlock = block;
  }
});
