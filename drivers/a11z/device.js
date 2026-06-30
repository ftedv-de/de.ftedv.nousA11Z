'use strict';

const { ZigBeeDevice } = require('homey-zigbeedriver');
const { CLUSTER } = require('zigbee-clusters');

const SOCKET_CAPABILITIES = [
  { capability: 'outlet_1', endpoint: 1, label: 'Outlet 1' },
  { capability: 'outlet_2', endpoint: 2, label: 'Outlet 2' },
  { capability: 'outlet_3', endpoint: 3, label: 'Outlet 3' },
];

const BASIC_ATTRIBUTES = [
  'manufacturerName',
  'zclVersion',
  'appVersion',
  'modelId',
  'powerSource',
];

const TUYA_MAGIC_ATTRIBUTE = 0xfffe;

class NousA11ZDevice extends ZigBeeDevice {

  async onNodeInit({ zclNode }) {
    this.zclNode = zclNode;

    this.info('NOUS A11Z initialized');
    this.debug('Outlet mapping: outlet_1->EP1, outlet_2->EP2, outlet_3->EP3');

    await this.configureMagicPacket();

    for (const socket of SOCKET_CAPABILITIES) {
      this.registerManualSocketCapability(socket);
    }

    await this.configureSocketReporting();

    this.registerCapability('meter_power', CLUSTER.METERING, { endpoint: 1 });
    this.registerCapability('measure_power', CLUSTER.ELECTRICAL_MEASUREMENT, { endpoint: 1 });
    this.registerCapability('measure_voltage', CLUSTER.ELECTRICAL_MEASUREMENT, { endpoint: 1 });
    this.registerCapability('measure_current', CLUSTER.ELECTRICAL_MEASUREMENT, { endpoint: 1 });
  }

  info(...args) {
    this.log(...args);
  }

  debug(...args) {
    if (this.getSetting('debug') === true) {
      this.log(...args);
    }
  }

  async configureMagicPacket() {
    const basicCluster = this.zclNode.endpoints[1]?.clusters?.basic;
    if (!basicCluster) {
      this.error('Tuya magic packet skipped: endpoint 1 basic cluster not found');
      return;
    }

    try {
      this.debug('Tuya magic packet: reading standard basic attributes on endpoint 1');
      const result = await basicCluster.readAttributes(BASIC_ATTRIBUTES);
      this.debug('Tuya magic packet basic result:', JSON.stringify(result));
      await this.setStoreValue('diagnostics.basic', result);
    } catch (err) {
      this.error(`Tuya magic packet basic read failed: ${err.message}`);
      await this.setStoreValue('diagnostics.basicError', err.message).catch(this.error);
    }

    try {
      this.debug('Tuya magic packet: reading manufacturer attribute 0xfffe on endpoint 1');
      const result = await basicCluster.readAttributes([TUYA_MAGIC_ATTRIBUTE]);
      this.debug('Tuya magic packet 0xfffe result:', JSON.stringify(result));
      await this.setStoreValue('diagnostics.magicPacket', result);
    } catch (err) {
      this.debug(`Tuya magic packet 0xfffe read ignored: ${err.message}`);
      await this.setStoreValue('diagnostics.magicPacketWarning', err.message).catch(this.error);
    }
  }

  registerManualSocketCapability({ capability, endpoint, label }) {
    const onOffCluster = this.getOnOffCluster(endpoint, label);
    if (!onOffCluster) return;

    this.debug(`Registering ${label} (${capability}) manually on endpoint ${endpoint}`);

    this.registerCapabilityListener(capability, async (value) => {
      this.debug(`set ${capability} -> ${value} (cluster: onOff, endpoint: ${endpoint})`);
      await this.setOutletState(capability, value);
      return true;
    });

    onOffCluster.on('attr.onOff', (value) => {
      this.debug(`handle report (cluster: onOff, capability: ${capability}, endpoint: ${endpoint}), parsed payload: ${value}`);
      this.updateOutletState(capability, value).catch(this.error);
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

  getEndpointForCapability(capability) {
    const socket = SOCKET_CAPABILITIES.find((entry) => entry.capability === capability);
    if (!socket) throw new Error(`Unknown outlet capability: ${capability}`);
    return socket.endpoint;
  }

  async setOutletState(capability, value) {
    const endpoint = this.getEndpointForCapability(capability);
    const onOffCluster = this.getOnOffCluster(endpoint, capability);
    if (!onOffCluster) throw new Error(`No onOff cluster for ${capability}`);

    if (value) {
      await onOffCluster.setOn();
    } else {
      await onOffCluster.setOff();
    }

    await this.updateOutletState(capability, value);
  }

  async updateOutletState(capability, value) {
    const oldValue = this.getCapabilityValue(capability);
    await this.setCapabilityValue(capability, value);

    if (oldValue !== value) {
      await this.triggerOutletFlows(capability, value).catch(this.error);
    }
  }

  async triggerOutletFlows(capability, value) {
    const outletNumber = Number(capability.replace('outlet_', ''));
    const tokens = {
      state: value,
      outlet: outletNumber,
    };

    await this.homey.flow.getDeviceTriggerCard(`${capability}_changed`).trigger(this, tokens, { state: value });

    if (value) {
      await this.homey.flow.getDeviceTriggerCard(`${capability}_turned_on`).trigger(this, tokens, {});
    } else {
      await this.homey.flow.getDeviceTriggerCard(`${capability}_turned_off`).trigger(this, tokens, {});
    }
  }

  async readSocketState(capability, endpoint, onOffCluster) {
    try {
      this.debug(`get -> ${capability} -> read attribute (cluster: onOff, attributeId: onOff, endpoint: ${endpoint})`);
      const { onOff } = await onOffCluster.readAttributes(['onOff']);
      this.debug(`get -> ${capability} -> read attribute (cluster: onOff, attributeId: onOff, endpoint: ${endpoint}) -> parsed result ${onOff}`);
      await this.updateOutletState(capability, onOff);
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
