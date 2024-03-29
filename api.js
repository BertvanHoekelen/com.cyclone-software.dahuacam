const Homey 	=	require('homey');

module.exports = [
    {
        description:		'Test email',
        method: 		'PUT',
        path:			'/testmail/',
        fn: function(args, callback){
	        
           var nodemailer = require('nodemailer');
			
			console.log('POST = ' + JSON.stringify(args));
			
			var use_credentials = args.body.use_credentials;
			if (typeof use_credentials == undefined) use_credentials = true;
			
			console.log ('use_credentials=' + use_credentials);

			if (use_credentials) {
				var transporter = nodemailer.createTransport(
				{
					host: args.body.mail_host,
					port: args.body.mail_port,
					secure: args.body.mail_secure,
					auth: {
						user: args.body.mail_user,
						pass: args.body.mail_password
					},
					tls: {rejectUnauthorized: false} 
				});
			} else {
				// Don't use authentication. Not supported by all providers
				var transporter = nodemailer.createTransport(
				{
					host: args.body.mail_host,
					port: args.body.mail_port,
					secure: args.body.mail_secure,
					tls: {rejectUnauthorized: false} 
				});
			}
		    
		    var mailOptions = {
				
				from: 'Homey <' + args.body.mail_from + '>',
			    to: args.body.mail_to,
			    subject: 'Testmail',
			    text: 'This is a testmail',
			    html: 'This is a testmail'
			}
		    
		    transporter.sendMail(mailOptions, function(error, info){
			    if(error){
				    callback (error, false);
			        return console.log(error);
			    }
			    console.log('Message sent: ' + info.response);
			    callback ('Message sent: ' + info.response, true);
			});
			
        }
    }
]