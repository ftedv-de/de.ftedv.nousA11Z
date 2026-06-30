'use strict';

const { ZigBeeDevice } = require('homey-zigbeedriver');
const { CLUSTER } = require('zigbee-clusters');

const SOCKET_CAPABILITIES = [
  { capability: 'onoff', endpoint: 1, label: 'Socket 1', builtIn: true },
  { capability: 'onoff.zigbee-2-6', endpoint: 2, label: 'Socket 2', builtIn: false },
  { capability: 'onoff.zigbee-3-6', endpoint: 3, label: 'Socket 3', builtIn: false },
];

class NousA11ZDevice extends ZigBeeDevice {

  async onNodeInit({ zclNode }) {
    this.zclNode = zclNode;

    this.log('NOUS A11Z initialized');
    this.log('Socket mapping: onoff->EP1, onoff.zigbee-2-6->EP2, onoff.zigbee-3-6->EP3');

    for (const socket of SOCKET_CAPABILITIES) {
      if (socket.builtIn) {
        this.registerBuiltInSocketCapability(socket);
      } else {
        this.registerManualSocketCapability(socket);
      }
    }

    await this.configureSocketReporting();

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

  registerBuiltInSocketCapability({ capability, endpoint, label }) {
    this.log(`Registering ${label} (${capability}) through homey-zigbeedriver on endpoint ${endpoint}`);

    this.registerCapability(capability, CLUSTER.ON_OFF, {
      endpoint,
    });
  }

  registerManualSocketCapability({ capability, endpoint, label }) {
    const onOffCluster = this.getOnOffCluster(endpoint, label);
    if (!onOffCluster) return;

    this.log(`Registering ${label} (${capability}) manually on endpoint ${endpoint}`);

    this.registerCapabilityListener(capability, async (value) => {
      this.log(`set ${capability} -> ${value} (cluster: onOff, endpoint: ${endpoint})`);

      if (value) {
        await onOffCluster.setOn();
      } else {
        await onOffCluster.setOff();
      }

      await this.setCapabilityValue(capability, value).catch(this.error);
    });

    onOffCluster.on('attr.onOff', (value) => {
      this.log(`handle report (cluster: onOff, capability: ${capability}, endpoint: ${endpoint}), parsed payload: ${value}`);
      this.setCapabilityValue(capability, value).catch(this.error);
    });

    this.readSocketState(capability, endpoint, onOffCluster).catch(this.error);
  }

  getOnOffCluster(endpoint, label) {
    const ep = this.zclNode.endpoints[endpoint];
    if (!ep) {
      this.error(`${label} endpoint ${endpoint} not found`);
      return null;
    }

    if (!ep.clusters || !ep.clusters.onOff) {
      this.error(`${label} endpoint ${endpoint} has no onOff cluster`);
      return null;
    }

    return ep.clusters.onOff;
  }

  async readSocketState(capability, endpoint, onOffCluster) {
    try {
      this.log(`get -> ${capability} -> read attribute (cluster: onOff, attributeId: onOff, endpoint: ${endpoint})`);
      const { onOff } = await onOffCluster.readAttributes(['onOff']);
      this.log(`get -> ${capability} -> read attribute (cluster: onOff, attributeId: onOff, endpoint: ${endpoint}) -> parsed result ${onOff}`);
      await this.setCapabilityValue(capability, onOff);
    } catch (err) {
      this.error(`Could not read ${capability} from endpoint ${endpoint}: ${err.message}`);
    }
  }

  async configureSocketReporting() {
    try {
      await this.configureAttributeReporting(SOCKET_CAPABILITIES.map(({ endpoint }) => ({
        endpointId: endpoint,
        cluster: CLUSTER.ON_OFF,
        attributeName: 'onOff',
        minInterval: 0,
        maxInterval: 900,
        minChange: 1,
      })));
    } catch (err) {
      this.error(`Could not configure onOff reporting: ${err.message}`);
    }
  }

}

module.exports = NousA11ZDevice;
