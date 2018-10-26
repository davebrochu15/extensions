# GeoBase RAMP extensions

This repo is intended to streamline the development of some FGPV supported RAMP extensions for the GeoBase division.

## Getting Started

Requirements:
-  [NodeJS](https://nodejs.org/)

-  [fgpv-vpgf](https://github.com/fgpv-vpgf/fgpv-vpgf)

> **Important**:  The fgpv-vpgf and extensions folders must be in the same directory because the extensions refer to the **fgpv-vpgf**.

### Generating Local Builds:
- `npm run dev`
Generate `.js` files in the `dist` folder

### Testing:
- `npm test {path}`
Test a single file
- `npm run test_all`
Test all files

### Global packages neeeded:
- mocha
- webpack