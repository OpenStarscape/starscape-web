# OpenStarscape web app

This is the primary OpenStarscape frontend. Sometimes available at [https://starscape.wmww.sh/](starscape.wmww.sh).

## Uses
- [Typescript](https://www.typescriptlang.org/)
- [npm](https://www.npmjs.com/)
- [esbuild](https://esbuild.github.io/)
- [Three.js](https://threejs.org/)
- [Jest](https://jestjs.io/en/)

## To run locally
You first need to clone the [OpenStarscape server](https://github.com/OpenStarscape/starscape-server) next to this repo and `cargo build` it. Then you can:
```
npm start
```
which will compile the web frontend, run the server and open it in a browser. See [package.json](package.json) for details.

NOTE: you may be able to make a local frontend work with the server on the internet, but this is not currently tested. There may also be version incompatibilities until the protocol is stabilized.

## To build for production
```
npm run build
```
The generated files will then be in `public/code.js`. More details on deploying [here](https://github.com/OpenStarscape/starscape-server/tree/master/deploy).

## To run the tests
```
npm test
```
