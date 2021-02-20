# OpenStarscape web app

This is the primary OpenStarscape frontend.

## Uses
- `Typescript`
- `Three.js` for graphics
- `React+JSX` for UI components
- `Jest` for tests

## To run locally
```
npm start
```
NOTE: you'll also need to build and run the [OpenStarscape server](https://github.com/OpenStarscape/starscape-server) locally for anything to work. If the server on the web is currently working (it often isn't) you should be able to make this connect to that, but that is not yet tested or documented.

## To build for production
```
npm run build
```
The generated files will then be in `build/`. While testing the npm script serves this app and it then connects to a local server running in a different process, but in production the server process serves the web app. More details on deploying [here](https://github.com/OpenStarscape/starscape-server/tree/master/deploy).

## To run the tests
```
npm test
```
