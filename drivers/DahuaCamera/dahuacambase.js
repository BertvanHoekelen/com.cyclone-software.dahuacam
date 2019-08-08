var request = require("request");
const nodemailer = require('nodemailer');
const Homey = require('homey');
const DigestFetch = require('digest-fetch');

exports.ptzGetDeviceType = function (address, username, password) {
       return new Promise(function(resolve, reject){
            request('http://'+address+'/cgi-bin/magicBox.cgi?action=getDeviceType',function (error, response, body) {
                if ((error) || (response.statusCode !== 200) || (!body.trim().startsWith("type="))) {
                    if (response)
                       reject(response.statusCode);
                    else
                       reject('getDeviceType:' + error.errno);
                } else {
                    resolve(body.trim().substring(5, 100));
                }
            }).auth(username,password,false);
        });
}

exports.ptzGetSoftwareVersion = function (address, username, password) {
    return new Promise(function(resolve, reject){
        request('http://'+address+'/cgi-bin/magicBox.cgi?action=getSoftwareVersion',function (error, response, body) {
            if ((error) || (response.statusCode !== 200) || (!body.trim().startsWith("version="))) {
                if (response)
                    reject(response.statusCode);
                else
                    reject('GetSoftwareVersion:' + error.errno);
            } else {
               resolve(body.trim().substring(8, 100));
            }
        }).auth(username,password,false);
    });
}

exports.ptzReboot = function (address, username, password){
    return new Promise(function(resolve, reject){
        request('http://'+address+'/cgi-bin/magicBox.cgi?action=reboot', function (error, response, body) {
            if ((error) || (response.statusCode !== 200) || (body.trim() !== "OK")) {
                console.log('FAILED TO REBOOT');
                if (response)
                    reject(response.statusCode);
                else
                 reject('Reboot:' +  error.errno);
            } else {
                resolve(true);
             }
        }).auth(username,password,false);
    });
}

exports.FetchSnapshot = async function (address, username, password) {
  const client = new DigestFetch(username, password);
  const res = await client.fetch('http://'+address+ '/cgi-bin/snapshot.cgi?0');

  if (!res.ok) {
    throw new Error('Could not fetch snapshot, invalid response.');
  }

  return res.body;
}

exports.MakeSnapshot = function (name, address, username, password){
    return new Promise(function(resolve, reject){
        const getImageOptions = {
            url:'http://'+address+ '/cgi-bin/snapshot.cgi?0' ,
            encoding: null,
            resolveWithFullResponse: true
        };

        request(getImageOptions ,  function done (err, res) {

            if (err) return reject("MakeSnapShot:" + err.errno);

            const buffer = Buffer.from(res.body);

            let use_credentials = Homey.ManagerSettings.get('use_credentials');

            let transporter;

            if (use_credentials) {
                transporter = nodemailer.createTransport(
                    {
                        host: Homey.ManagerSettings.get('mail_host'),
                        port: Homey.ManagerSettings.get('mail_port'),
                        secure: Homey.ManagerSettings.get('mail_secure'),
                        auth: {
                            user: Homey.ManagerSettings.get('mail_user'),
                            pass: Homey.ManagerSettings.get('mail_password')
                        },
                        logger: false,
                        debug: false // include SMTP traffic in the logs
                    }
                );
            } else
            {
                transporter = nodemailer.createTransport(
                    {
                        host: Homey.ManagerSettings.get('mail_host'),
                        port: Homey.ManagerSettings.get('mail_port'),
                        secure: Homey.ManagerSettings.get('mail_secure'),
                        logger: false,
                        debug: false // include SMTP traffic in the logs
                    }
                );
            }

            var mailOptions={
            from : Homey.ManagerSettings.get('mail_from'),
            to : Homey.ManagerSettings.get('mail_to'),
            subject : "Camara snapshot "+ new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '') ,
            generateTextFromHTML : true,
            html : "<h2>SnapShot from " + name +  "</h2> taken at :" + new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '') ,
            attachments: [{
                    filename: "snapshot.jpg",
                    content: buffer
            }]
            };
            transporter.sendMail(mailOptions, function(error, info){
                transporter.close();
                if(error) {
                    return reject(error);
                } else {
                    return resolve();
                }
            });
        }).auth(username,password,false);
    });

}
