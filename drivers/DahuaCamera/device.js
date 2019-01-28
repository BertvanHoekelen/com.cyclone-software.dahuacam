// Device.js
'use strict';

const Homey = require('homey');
const request = require('request');

const DahuaCam = require('./dahuacambase.js');



let BASEURI

class DahuaCamera extends Homey.Device {

    async onInit() {
        this.log(`Init device ${this.getName()}`);

        this.settings = this.getSettings();

        BASEURI='http://' + this.getData().id;
      
        // retrieve some basic info from camera (if possible)
        this.upDateCapabilities();
    }

    async upDateCapabilities()
    {
        console.log('Updating Capabilities');
        await  DahuaCam.ptzGetDeviceType(this.settings.address,this.settings.username,this.settings.password).then( result => {
            this.setCapabilityValue("my_type_capability",result);
        }).catch( err => {
            console.log(err);
        });

        await DahuaCam.ptzGetSoftwareVersion(this.settings.address,this.settings.username,this.settings.password).then( result => {
            this.setCapabilityValue("my_version_capability", result);
        })
        .catch( err => {
            console.log(err);
        });     
    }

    onSettings( oldSettingsObj, newSettingsObj, changedKeysArr, callback ) {

        this.settings = newSettingsObj;

        this.upDateCapabilities();
        callback( null, true );
    }

    onAdded() {
        this.log('device added');
    }

    onDeleted() {
        this.log('device deleted');
    }

    onFlowCardCameraToPosition(position) {
        try {
            this.ptzCommand('GotoPreset',0,position,0,0);
          } catch (err) {
            return false;
          }
        return true;
    }

    onFlowCardCameraTakeSnapshot(){
        DahuaCam.MakeSnapshot(name, this.settings.address,this.settings.username,this.settings.password).then(result=>{
            console.log('Snapshot done');
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
            console.log('Rebooting device');
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
        request(BASEURI + '/cgi-bin/ptz.cgi?action=start&channel=0&code=' + cmd + '&arg1=' + arg1 + '&arg2=' + arg2 + '&arg3=' + arg3 + '&arg4=' + arg4, function (error, response, body) {
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
      
        request(BASEURI + '/cgi-bin/ptz.cgi?action=start&channel=0&code=' + cmd + '&arg1=0&arg2=' + multiple + '&arg3=0', function (error, response, body) {
          if ((error) || (response.statusCode !== 200) || (body.trim() !== "OK")) {
            console.log('FAILED TO ISSUE PTZ ZOOM');
            return false;
          } else  return true;
        }).auth(this.settings.username,this.settings.password,false);
      };




    
}

module.exports = DahuaCamera;
