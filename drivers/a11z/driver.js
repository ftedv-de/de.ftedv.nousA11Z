'use strict';

const { ZigBeeDriver } = require('homey-zigbeedriver');

const OUTLETS = [
  { id: 'outlet_1', label: 'Outlet 1' },
  { id: 'outlet_2', label: 'Outlet 2' },
  { id: 'outlet_3', label: 'Outlet 3' },
];

class NousA11ZDriver extends ZigBeeDriver {

  async onInit() {
    await super.onInit();

    for (const outlet of OUTLETS) {
      this.registerOutletAction(`turn_on_${outlet.id}`, outlet.id, true);
      this.registerOutletAction(`turn_off_${outlet.id}`, outlet.id, false);
      this.registerOutletCondition(`is_${outlet.id}_on`, outlet.id);
    }
  }

  registerOutletAction(cardId, capability, value) {
    this.homey.flow.getActionCard(cardId).registerRunListener(async (args) => {
      if (!args.device) throw new Error('No device selected');
      await args.device.setOutletState(capability, value);
      return true;
    });
  }

  registerOutletCondition(cardId, capability) {
    this.homey.flow.getConditionCard(cardId).registerRunListener(async (args) => {
      if (!args.device) throw new Error('No device selected');
      return args.device.getCapabilityValue(capability) === true;
    });
  }

}

module.exports = NousA11ZDriver;
