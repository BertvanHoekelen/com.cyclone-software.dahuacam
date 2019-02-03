const Homey = require('homey');

class DahuaCam extends Homey.App {
  
  onInit() {
    this.log(`${ Homey.manifest.id } V${Homey.manifest.version} is running...`);

    Homey
      .on('unload', () => {
        this.log(`${ Homey.manifest.id } unload`);
      })
      .on('memwarn', () => {
        this.log('memwarn!');
      })
      .on('cpuwarn', () => {
        this.log('cpu warning');
    });
  }
}

module.exports = DahuaCam; 