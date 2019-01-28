const Homey = require('homey');

class MyApp extends Homey.App {
  
  onInit() {
    this.log('My App is running!');
  }
  
}

module.exports = MyApp; 