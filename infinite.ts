const { argv } = require('yargs');

let period: number = 300;

const dummyFunction = () => {
    console.log('Call whatever you want instead of this')
}
if(argv.time) period = argv.time;

setInterval(() => {
    dummyFunction()
}, period)

