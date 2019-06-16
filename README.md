# Dahua Camera for Homey
Control your Dahua Camera's using Athom's Homey (this is NOT the official Dahua app).

## Thanks
Many thanks to robertklep, he helpt me a lot on the Athom forum. And also to Jorden Chamid, which I borrowed :) some code for e-mailing.

## Note
Please make sure when adding the camera you will add the username and password on the Device Icon. Otherwise it won't work as the App cannot authorize itself using the API. Adding a device is experimential. I hope this will work...
I have tested most functions with the device "DH-SD22204T-GN"

## Actions
- Go to preset position
- Create a snapshot (make sure you fill in the email settings)
- Zoom in/out (using a number from -100 till 100 you can zoom, I must say this is according the API Specs. But in my situation it fully zooms in or out)
- Reboot (reboot the device)
- Night Profile
- Day Profile

## Triggers
 - VideoMotion Start
 - VideoMotion Stop
 - Alarm Local Start
 - Alarm local stop
 - Videoloss Start
 - Videoloss Stop
 - Videoblind start
 - VideoBlindStop

### v 0.2.3
small bug fixes

### v 0.2.2
splashed a number of bugs. Must be more stable now.

### v 0.2.1
small bug fixes

### v 0.2.0
Added new triggers and actions. I was not able to test it all. So therefor this beta release. I have added also in the settings menu a selector to chose the channel (0 or 1). The triggers are based on the Dahua Events. I hope this is working stable. 

### v 0.1.1
Removed some bugs and code improvements

### v 0.1.0
First BETA release (When in princible working I will try to add more functions)
