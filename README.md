# OpenStarscape web app

This is the primary OpenStarscape frontend. Sometimes available at [https://starscape.wmww.sh/](starscape.wmww.sh).

## Uses
- [Typescript](https://www.typescriptlang.org/)
- [yarn](https://yarnpkg.com/)
- [esbuild](https://esbuild.github.io/)
- [Three.js](https://threejs.org/)
- [Jest](https://jestjs.io/en/)

## Before building
- Install yarn (`pacman -S yarn`, `npm install --global yarn`, etc)
- Run `yarn` in project root to install dependencies into `./node_modules`

## Helpful commands
- `yarn launch`: typechecks, builds frontend, runs server and has it to open a browser tab. This command will explain what to do if the server isn't set up.
- `yarn test`: typechecks and runs tests
- `yarn prod-build`: builds for production without typechecking or sourcemap

## See also
See [package.json](package.json) and [auxiliary/scripts](auxiliary/scripts) for details. The generated files will then be in `public/code.js`. More details on deploying [here](https://github.com/OpenStarscape/starscape-server/tree/master/deploy). You may be able to make a local frontend connect to the server on the internet, but this is not currently tested. There may also be version incompatibilities until the protocol is stabilized.
