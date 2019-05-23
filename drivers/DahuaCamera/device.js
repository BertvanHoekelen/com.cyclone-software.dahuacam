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
   
        var opts = { 
          'url' : BASEURI + '/cgi-bin/eventManager.cgi?action=attach&codes=[AlarmLocal,VideoMotion,VideoLoss,VideoBlind]',
          'forever' : true,
          'headers': {'Accept':'multipart/x-mixed-replace'}
        };
    
        var client = request(opts).auth(this.settings.username,this.settings.password,false);
    
        client.on('socket', function(socket) {
            console.log('socket');
        });

        client.on('error', this.handleError.bind(this));
        client.on('response',  this.handleResponse.bind(this));
        client.on('data', this.handleData.bind(this));

        client.on('close', function() {   // Try to reconnect after 30s
          setTimeout(function() { this.ConnectToDahua(); }, 30000 );
          console.log('Connection Closed');
        });
      
    };

    handleResponse(options){
        //console.log(options);
    }

    handleData(data) {
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
                this.driver._triggers.trgTVideoMotionStart.trigger(this, {}).catch(this.error).then(this.log);
                console.log('Video Motion Detected')
            }
            if (code === 'VideoMotion' && action === 'Stop') {
                this.driver._triggers.trgVideoMotionStop.trigger(this, {}).catch(this.error).then(this.log); 
                console.log('Video Motion Ended');
            }
            if (code === 'AlarmLocal' && action === 'Start'){
                this.driver._triggers.trgAlarmLocalStart.trigger(this, {}).catch(this.error).then(this.log); 
                console.log('Local Alarm Triggered: ' + index);
            }
            if (code === 'AlarmLocal' && action === 'Stop')	{
                this.driver._triggers.trgAlarmLocalStop.trigger(this, {}).catch(this.error).then(this.log);
                console.log('Local Alarm Ended: ' + index);
            }	
            if (code === 'VideoLoss' && action === 'Start')	{
                this.driver._triggers.trgVideoLossStart.trigger(this, {}).catch(this.error).then(this.log);
                console.log('Video Lost!');
            }	
            if (code === 'VideoLoss' && action === 'Stop')	{
                this.driver._triggers.trgVideoLossStop.trigger(this, {}).catch(this.error).then(this.log);
                console.log('Video Found!');
            }	
            if (code === 'VideoBlind' && action === 'Start'){
                this.driver._triggers.trgVideoBlindStart.trigger(this, {}).catch(this.error).then(this.log);
                console.log('Video Blind!');
            }	
            if (code === 'VideoBlind' && action === 'Stop')	{
                this.driver._triggers.trgVideoBlindStop.trigger(this, {}).catch(this.error).then(this.log);
                console.log('Video Unblind!');
            }	
         }
       });
    }

    handleError(err) {
        // Catch some errors
        this.error('Could not connect to dahua:' + settings.address);
        if (err.code === 'ECONNREFUSED') {
            this.error('Connection refused');
        } else if (err.code === 'ENOTFOUND') {
            this.error('Host ' + settings.address + ' not found.');
        } else if (err.code === 'EHOSTUNREACH') {
            this.error('Host ' + + settings.address + ' not found.');
        } else {
            this.error(err.code);
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




    
}

module.exports = DahuaCamera;
