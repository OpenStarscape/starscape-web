# OpenStarscape web app

This is the primary OpenStarscape frontend. Sometimes available at [https://starscape.wmww.sh/](starscape.wmww.sh).

## Uses
- [Typescript](https://www.typescriptlang.org/)
- [npm](https://www.npmjs.com/)
- [esbuild](https://esbuild.github.io/)
- [Three.js](https://threejs.org/)
- [Jest](https://jestjs.io/en/)

## To run locally
```
npm start
```
You need to clone the [OpenStarscape server](https://github.com/OpenStarscape/starscape-server), `cargo build` it and symlink the binary in `starscape-server/target/debug/starscape-server` to `auxiliary/starscape-server` for it to work. `npm start` will tell you the commands to run if things aren't set up right. Feel free to open an issue if you can't get it to work.

`npm start` compiles the web frontend, runs the server and asks it to open a browser. See [package.json](package.json) and [auxiliary/scripts/start.sh](auxiliary/scripts/start.sh) for details.

__NOTE:__ you may be able to make a local frontend work with the server on the internet, but this is not currently tested. There may also be version incompatibilities until the protocol is stabilized.

## To build for production
```
npm run build
```
The generated files will then be in `public/code.js`. More details on deploying [here](https://github.com/OpenStarscape/starscape-server/tree/master/deploy).

## To run the tests
```
npm test
```
