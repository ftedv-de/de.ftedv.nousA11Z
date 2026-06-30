'use strict';

const { ZigBeeDevice } = require('homey-zigbeedriver');
const { CLUSTER } = require('zigbee-clusters');

const SOCKET_CAPABILITIES = [
  { capability: 'onoff', endpoint: 1, label: 'Socket 1' },
  { capability: 'onoff.zigbee-2-6', endpoint: 2, label: 'Socket 2' },
  { capability: 'onoff.zigbee-3-6', endpoint: 3, label: 'Socket 3' },
];

class NousA11ZDevice extends ZigBeeDevice {

  async onNodeInit({ zclNode }) {
    this.zclNode = zclNode;

    this.log('NOUS A11Z initialized');
    this.log('Explicit socket endpoint mapping: onoff->EP1, onoff.zigbee-2-6->EP2, onoff.zigbee-3-6->EP3');

    for (const { capability, endpoint, label } of SOCKET_CAPABILITIES) {
      this.registerSocketCapability(capability, endpoint, label);
    }

    this.registerCapability('meter_power', CLUSTER.METERING, {
      endpoint: 1,
    });

    this.registerCapability('measure_power', CLUSTER.ELECTRICAL_MEASUREMENT, {
      endpoint: 1,
    });

    this.registerCapability('measure_voltage', CLUSTER.ELECTRICAL_MEASUREMENT, {
      endpoint: 1,
    });

    this.registerCapability('measure_current', CLUSTER.ELECTRICAL_MEASUREMENT, {
      endpoint: 1,
    });
  }

  registerSocketCapability(capability, endpoint, label) {
    this.log(`Registering ${label} (${capability}) on endpoint ${endpoint}`);

    this.registerCapability(capability, CLUSTER.ON_OFF, {
      endpoint,
    });
  }

}

module.exports = NousA11ZDevice;
