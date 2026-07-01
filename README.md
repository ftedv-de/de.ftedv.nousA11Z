# de.ftedv.nousA11Z

Homey app for the NOUS A11Z Zigbee power strip revision `TS011F` / `_TZ3210_6cmeijtd` and closely related compatible TS011F variants.

## What this driver does

The power strip is kept as one Homey device with three independent outlet controls:

- `outlet_1` -> endpoint 1
- `outlet_2` -> endpoint 2
- `outlet_3` -> endpoint 3

Power, voltage, current and energy are read from endpoint 1, because this device family exposes the metering and electrical measurement clusters only there.

The driver also performs a Tuya-style initialization read on the Basic cluster, including manufacturer attribute `0xfffe`. Without this initialization the device can behave like all endpoints are linked and every switch command toggles all outlets.

## Flow cards

Triggers:

- Outlet 1/2/3 changed
- Outlet 1/2/3 turned on
- Outlet 1/2/3 turned off

Actions:

- Turn Outlet 1/2/3 on
- Turn Outlet 1/2/3 off

Conditions:

- Outlet 1/2/3 is on

## Debug logging

Device settings contain a checkbox named `Enable debug logging`. Keep this disabled for normal use. Enable it while testing pairing, endpoint routing, reporting or power measurement.

## Known compatible fingerprints

Tested:

| Vendor | Model | Product ID | Manufacturer |
| --- | --- | --- | --- |
| Nous | A11Z | `TS011F` | `_TZ3210_6cmeijtd` |

Added as compatible based on matching Zigbee2MQTT device structure, endpoint mapping and Tuya magic-packet initialization. These should be treated as experimental until confirmed on Homey:

| Vendor | Model | Product ID | Manufacturer |
| --- | --- | --- | --- |
| LELLKI | WP30-EU | `TS011F` | `_TZ3000_c7nc9w3c` |
| LELLKI | WP30-EU | `TS011F` | `_TZ3210_c7nc9w3c` |

Do not add arbitrary `TS011F` fingerprints without testing. Tuya devices with the same model ID can expose different endpoint layouts and capabilities.

## Publish checks

```bash
npm install
npm run validate:publish
npm run build
```

The repository also contains a GitHub Actions workflow that validates the app on push, pull request and manual dispatch.

## Local test

```bash
npm install
npm run validate
npm run run
```

Pair the power strip through this app/driver and test each outlet separately.
