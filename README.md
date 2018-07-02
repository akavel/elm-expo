
See [create-react-native-app](https://github.com/react-community/create-react-native-app#readme):

    $ npm install -g create-react-native-app
    $ create-react-native-app my-app    # on Windows: %appdata%\npm\create-react-native-app my-app
    $ cd my-app/

Install extra dependencies:

    $ npm install --save-dev chokidar-cli@1.2.0
    $ npm install --save-dev elm@~0.18.0         # FIXME: how to make it add version "~0.18.0"?

Add the following lines to your `package.json`, in section `"scripts"`:

    "watch-elm": "chokidar \"src/**/*.elm\" -c \"npm run build\" --initial",
    "build": "elm-make src/Main.elm --output=elm.js",

TODO: to be continued...
