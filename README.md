# de.ftedv.nousA11Z

Homey app for the NOUS A11Z Zigbee power strip revision `TS011F` / `_TZ3210_6cmeijtd`.

## What this driver does

The power strip is kept as one Homey device with three independent outlet controls:

- `outlet_1` -> endpoint 1
- `outlet_2` -> endpoint 2
- `outlet_3` -> endpoint 3

Power, voltage, current and energy are read from endpoint 1, because this revision exposes the metering and electrical measurement clusters only there.

The driver also performs a Tuya-style initialization read on the Basic cluster, including manufacturer attribute `0xfffe`. Without this initialization the device can behave like all endpoints are linked and every switch command toggles all outlets.

## Debug logging

Device settings contain a checkbox named `Enable debug logging`. Keep this disabled for normal use. Enable it while testing pairing, endpoint routing, reporting or power measurement.

## Known compatible fingerprint

- Model ID: `TS011F`
- Manufacturer: `_TZ3210_6cmeijtd`
- App version observed: `82`

Other three-outlet `TS011F` variants may be added later, but should be tested carefully because Tuya devices with the same model ID can behave differently.

## Test

```bash
npm install
npx homey app validate
npx homey app run
```

Pair the A11Z through this app/driver and test each outlet separately.
