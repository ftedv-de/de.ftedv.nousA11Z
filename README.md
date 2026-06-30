# de.ftedv.nousA11Z

Homey app for the NOUS A11Z Zigbee power strip revision `TS011F` / `_TZ3210_6cmeijtd`.

## Goal

This driver keeps the device as one Homey device with three switch controls and maps each switch explicitly to its Zigbee endpoint:

- `onoff` -> endpoint 1
- `onoff.zigbee-2-6` -> endpoint 2
- `onoff.zigbee-3-6` -> endpoint 3

Power, voltage, current and energy are read from endpoint 1, because this revision exposes the metering and electrical measurement clusters only there.

## Test

```bash
npm install
npx homey app validate
npx homey app run
```

Pair the A11Z through this app/driver and test each socket separately.
