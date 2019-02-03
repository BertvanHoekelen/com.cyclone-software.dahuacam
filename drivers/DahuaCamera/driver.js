// Driver.js
'use strict';

const Homey = require('homey');
const net = require('net');
const DahuaCam = require('./dahuacambase.js');

class DahuaDriver extends Homey.Driver {

    onInit() { 
        this.log('Init driver');

        new Homey.FlowCardAction('gotoposition')
        .register()
        .registerRunListener(( args, state ) => {     
                    if (args.device) {
                        return Promise.resolve(args.device.onFlowCardCameraToPosition(args.position));
                    }
                    return Promise.resolve( true );         
        })
 
        new Homey.FlowCardAction('snapshot')
        .register()
        .registerRunListener(( args, state ) => {     
                    if (args.device) {
                        return Promise.resolve(args.device.onFlowCardCameraTakeSnapshot(args.position));
                    }
                    return Promise.resolve( true );         
        })  

        new Homey.FlowCardAction('zoom')
        .register()
        .registerRunListener(( args, state ) => {     
                    if (args.device) {
                        return Promise.resolve(args.device.onFlowCardCameraZoom(args.zoomnumber));
                    }
                    return Promise.resolve( true );         
        })        

        new Homey.FlowCardAction('reboot')
        .register()
        .registerRunListener(( args, state ) => {     
                    if (args.device) {
                        return Promise.resolve(args.device.onFlowCardCameraReboot());
                    }
                    return Promise.resolve( true );         
        })        

   

    }

    onPair(socket) {
        socket.on('testConnection', function(data, callback) {
            console.log(data);
            DahuaCam.ptzGetDeviceType(data.address,data.username,data.password).then( result => {
                console.log(result);
                callback(false,result);
            })
            .catch( err => {
                console.log(err);
                callback(err,null);
            });    
        });
    }

    // this is the easiest method to overwrite, when only the template 'Drivers-Pairing-System-Views' is being used.
    onPairListDevices( data, callback ) {
        this.log("list devices");

        var devices = [];

        console.log(data);

        callback(null,'dfdf');

        // Homey.ManagerCloud.getLocalAddress().then(function(address) {
        //    console.log(address);
        //    var range = address.substr(0,address.lastIndexOf(".")+1);


        //     var checkPort = function(port, host, callback) {
        //         var socket = new net.Socket(), status = null;
            
        //         // Socket connection established, port is open
        //         socket.on('connect', function() {status = 'open';socket.end();});
        //         socket.setTimeout(1500);// If no response, assume port is not listening
        //         socket.on('timeout', function() {status = 'closed';socket.destroy();});
        //         socket.on('error', function(exception) {status = 'closed';});
        //         socket.on('close', function(exception) {callback(null, status,host,port);});
            
        //         socket.connect(port, host);
        //     }
        
        //     var r = 1;
        //     //scan over a range of IP addresses and execute a function each time the LLRP port is shown to be open.
        //     for(var i=1; i <=255; i++){
        //         checkPort(80, range+i, function(error, status, host, port){
        //             r++;
        //             if(status == "open"){
        //                 console.log("Reader found: ", host, port, status);
        //                 Homey.ManagerArp.getMAC(host, function (error, mac){
        //                     if (!error)
        //                     {
        //                         console.log("found mac:"+mac);
        //                         if (mac) {
        //                             if (mac.substr(0,8).toLowerCase()=="3c:ef:8c") {
        //                                 var device = {
        //                                     "name": "Duhua Camera",
        //                                     "data": {
        //                                         "id": host
        //                                     }
        //                                 }
        //                                 devices.push(device);
        //                                 console.log('found camera');
        //                             } 
        //                         }
        //                     } 
        //                 });   
        //             }
        //         if (r>=255)
        //         {
        //             callback(null,devices);
        //         }
        //         });       
        //     }
        // }).catch(function (err) {
        //     // handle error
        // })         
    }
}



module.exports = DahuaDriver;
