// Device.js
'use strict';

const Homey = require('homey');
const request = require('request');
const DahuaCam = require('./dahuacambase.js');

let BASEURI
let channel = 0;

class DahuaCamera extends Homey.Device {

    async onInit() {
        this.name = this.getName();
        this.log(`Init device ${this.name}`);

        this.settings = this.getSettings();

        BASEURI='http://' + this.getData().id;

        channel = Homey.ManagerSettings.get('devchannel');

        console.log(`device channel = ${channel}`);

        // Get driver.
        this.driver = await this._getDriver();

        // retrieve some basic info from camera (if possible)
        this.upDateCapabilities();

        this.ConnectToDahua();

        this._registerSnapshotImage();
    }

    	// Get a (ready) instance of the driver.
	async _getDriver() {
		return new Promise((resolve) => {
			const driver = this.getDriver();
			driver.ready(() => resolve(driver));
		});
	}

    async upDateCapabilities()
    {
        this.log('Updating Capabilities');
        await  DahuaCam.ptzGetDeviceType(this.settings.address,this.settings.username,this.settings.password).then( result => {
            this.setCapabilityValue("my_type_capability",result);
        }).catch( err => {
            this.log(err);
        });

        await DahuaCam.ptzGetSoftwareVersion(this.settings.address,this.settings.username,this.settings.password).then( result => {
            this.setCapabilityValue("my_version_capability", result);
        })
        .catch( err => {
            this.log(err);
        });
    }

    onSettings( oldSettingsObj, newSettingsObj, changedKeysArr, callback ) {

        this.settings = newSettingsObj;

        channel = Homey.ManagerSettings.get('devchannel');

        this.upDateCapabilities();
        this.ConnectToDahua();
        callback( null, true );
    }

    onAdded() {
        this.log('device added');
    }

    onDeleted() {
        this.log('device deleted');
    }

    ConnectToDahua() {

        const me = this;

        var opts = {
          'url' : BASEURI + '/cgi-bin/eventManager.cgi?action=attach&codes=[AlarmLocal,VideoMotion,VideoLoss,VideoBlind]',
          'forever' : true,
          'headers': {'Accept':'multipart/x-mixed-replace'}
        };

        var client = request(opts).auth(this.settings.username,this.settings.password,false);

        client.on('socket', function(socket) {
            console.log('socket');
        });

        client.on('error', me.handleError.bind(me));
        client.on('response',  me.handleResponse.bind(me));
        client.on('data', me.handleData.bind(me));

        client.on('close', function() {   // Try to reconnect after 30s
          setTimeout(function() { this.ConnectToDahua(); }, 30000 );
          console.log('Connection Closed');
        });

    };

    handleResponse(options){
        //console.log(options);
    }

    handleData(data) {
        const me = this;
        console.log('Data: ' + data.toString());
        data = data.toString().split('\r\n');
        var lines = Object.keys(data);
        /// need to find a way for the data extract
        lines.forEach(function(id){
          if (data[id].startsWith('Code=')) {
            let alarm = data[id].split(';');
            let code = alarm[0].substr(5);
            let action = alarm[1].substr(7);
            let index = alarm[2].substr(6);
            console.log(`alarm:${alarm} code:${code} action:${action} index:${index}`);

            if (code === 'VideoMotion' && action === 'Start') {
                me.driver._triggers.trgTVideoMotionStart.trigger(me).catch(me.error).then(me.log);
                console.log('Video Motion Detected')
            }
            if (code === 'VideoMotion' && action === 'Stop') {
                me.driver._triggers.trgVideoMotionStop.trigger(me).catch(me.error).then(me.log);
                console.log('Video Motion Ended');
            }
            if (code === 'AlarmLocal' && action === 'Start'){
                me.driver._triggers.trgAlarmLocalStart.trigger(me).catch(me.error).then(me.log);
                console.log('Local Alarm Triggered: ' + index);
            }
            if (code === 'AlarmLocal' && action === 'Stop')	{
                me.driver._triggers.trgAlarmLocalStop.trigger(me).catch(me.error).then(me.log);
                console.log('Local Alarm Ended: ' + index);
            }
            if (code === 'VideoLoss' && action === 'Start')	{
                me.driver._triggers.trgVideoLossStart.trigger(me).catch(me.error).then(me.log);
                console.log('Video Lost!');
            }
            if (code === 'VideoLoss' && action === 'Stop')	{
                me.driver._triggers.trgVideoLossStop.trigger(me).catch(me.error).then(me.log);
                console.log('Video Found!');
            }
            if (code === 'VideoBlind' && action === 'Start'){
                me.driver._triggers.trgVideoBlindStart.trigger(me).catch(me.error).then(me.log);
                console.log('Video Blind!');
            }
            if (code === 'VideoBlind' && action === 'Stop')	{
                me.driver._triggers.trgVideoBlindStop.trigger(me).catch(me.error).then(me.log);
                console.log('Video Unblind!');
            }
         }
       });
    }

    handleError(err) {
        // Catch some errors
        try {
            this.error('Could not connect to dahua:' + this.settings.address);
            if (err.code === 'ECONNREFUSED') {
                this.error('Connection refused');
            } else if (err.code === 'ENOTFOUND') {
                this.error('Host ' + this.settings.address + ' not found.');
            } else if (err.code === 'EHOSTUNREACH') {
                this.error('Host ' + this.settings.address + ' not found.');
            } else {
                this.error(err.code);
            }
        } catch (error) {
            this.error('Could not connect to camera');
        }
    }


    toDayProfile () {
        request(BASEURI + '/cgi-bin/configManager.cgi?action=setConfig&VideoInMode[0].Config[0]=1', function (error, response, body) {
          if ((!error) && (response.statusCode === 200)) {
            if (body === 'Error') {   // Didnt work, lets try another method for older cameras
              request(BASEURI + '/cgi-bin/configManager.cgi?action=setConfig&VideoInOptions[0].NightOptions.SwitchMode=0', function (error, response, body) {
                if ((error) || (response.statusCode !== 200)) {
                    this.log('Not able to change to day profile');
                }
              }).auth(this.settings.username,this.settings.password,false);
            }
          } else {
            this.log('Not able to change to day profile');
          }
        }).auth(this.settings.username,this.settings.password,false);
      };

      toNightProfile () {
        request(BASEURI + '/cgi-bin/configManager.cgi?action=setConfig&VideoInMode[0].Config[0]=2', function (error, response, body) {
          if ((!error) && (response.statusCode === 200)) {
            if (body === 'Error') {   // Didnt work, lets try another method for older cameras
              request(BASEURI + '/cgi-bin/configManager.cgi?action=setConfig&VideoInOptions[0].NightOptions.SwitchMode=3', function (error, response, body) {
                if ((error) || (response.statusCode !== 200)) {
                  this.log('Not able to change to night profile');
                }
              }).auth(this.settings.username,this.settings.password,false);
            }
          } else {
            this.log('Not able to change to night profile');
          }
        }).auth(this.settings.username,this.settings.password,false);
      };


    onFlowCardCameraToPosition(position) {
        try {
            this.ptzCommand('GotoPreset',0,position,0,0);
          } catch (err) {
            return false;
          }
        return true;
    }

    onFlowCardCameraTakeSnapshot(){
        DahuaCam.MakeSnapshot(this.name, this.settings.address,this.settings.username,this.settings.password).then(result=>{
            this.log('Snapshot done');
        }).catch(err => {
            console.log(err);
        });
    }

    onFlowCardCameraZoom(zoomnumber) {
        try {
            this.ptzZoom(zoomnumber);
          } catch (err) {
            return false;
        }
        return true;
    }

    onFlowCardCameraReboot(){
        DahuaCam.ptzReboot(this.settings.address,this.settings.username,this.settings.password).then(result=>{
            this.log('Rebooting device');
        }).catch(err => {
            console.log(err);
        });
    }

    onFlowCardTest(){
        return true;
    }

    ptzCommand(cmd,arg1,arg2,arg3,arg4) {
        if ((!cmd) || (isNaN(arg1)) || (isNaN(arg2)) || (isNaN(arg3)) || (isNaN(arg4))) {
            console.log("INVALID PTZ COMMAND");
          return false;
        }
        request(BASEURI + '/cgi-bin/ptz.cgi?action=start&channel=' + channel + '&code=' + cmd + '&arg1=' + arg1 + '&arg2=' + arg2 + '&arg3=' + arg3 + '&arg4=' + arg4, function (error, response, body) {
          if ((error) || (response.statusCode !== 200) || (body.trim() !== "OK")) {
            console.log("FAILED TO ISSUE PTZ COMMAND");
            return false;
          } else return true;
        }).auth(this.settings.username,this.settings.password,false);
    }

    ptzZoom(multiple) {
        var cmd;
        if (isNaN(multiple))  console.log('INVALID PTZ ZOOM');
        if (multiple === 0) return false; // no need to change anything
        if (multiple > 0) cmd = 'ZoomTele';
        if (multiple < 0) cmd = 'ZoomWide';

        console.log('zoom function:'+cmd + ' ' + multiple);

        request(BASEURI + '/cgi-bin/ptz.cgi?action=start&channel=' + channel + '&code=' + cmd + '&arg1=0&arg2=' + multiple + '&arg3=0', function (error, response, body) {
          if ((error) || (response.statusCode !== 200) || (body.trim() !== "OK")) {
            console.log('FAILED TO ISSUE PTZ ZOOM');
            return false;
          } else  return true;
        }).auth(this.settings.username,this.settings.password,false);
      };

      async _registerSnapshotImage() {
        const snapshotImage = new Homey.Image();

        // Set stream, this method is called when image.update() is called
        snapshotImage.setStream(async (stream) => {
          const res = await DahuaCam.FetchSnapshot(this.settings.address, this.settings.username, this.settings.password);

          res.pipe(stream);
        });

        // Register and set camera image
        return snapshotImage.register()
          .then(() => this.log('_registerSnapshotImage() -> registered'))
          .then(() => this.setCameraImage('snapshot', 'Snapshot', snapshotImage))
          .catch(this.error);
      }
}

module.exports = DahuaCamera;
