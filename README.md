
See [create-react-native-app](https://github.com/react-community/create-react-native-app#readme):

    $ npm install -g create-react-native-app
    $ create-react-native-app my-app    # on Windows: %appdata%\npm\create-react-native-app my-app
    $ cd my-app/

Install extra dependencies:

    $ npm install --save-dev chokidar-cli@1.2.0
    $ npm install --save-dev elm@~0.18.0         # FIXME: how to make it add version "~0.18.0"?
    $ elm-package install akavel/elm-expo        # on Windows: %appdata%\npm\elm-package ...

Add the following lines to your `package.json`, in section `"scripts"`:

    "watch-elm": "chokidar \"src/**/*.elm\" -c \"npm run build\" --initial",
    "build": "elm-make src/Main.elm --output=elm.js",

Create directory 'src/', and in it a file named `Main.elm` with the following contents:

    module Main exposing (..)

    import Expo exposing (..)
    import Expo.LowLevel as LowLevel


    -- MODEL


    type alias Model =
        { n : Int
        }


    model : Model
    model =
        { n = 9000
        }


    -- UPDATE


    type Msg
        = TouchDown Expo.Position


    update : Msg -> Model -> ( Model, Cmd Msg )
    update msg model =
        case msg of
            TouchDown _ ->
                ( { model | n = Debug.log "CLICKS:" (model.n + 1) }, Cmd.none )


    -- VIEW


    view : Model -> Node Msg
    view model =
        Expo.view
            [ attribute "flex" "1"
            , attribute "alignItems" "center"
            , attribute "justifyContent" "center"
            ]
            [ text "hello Elm-Expo!"
            , text ("Counter: " ++ toString model.n)
            , text "Touch anywhere on the screen to increase the counter!"
            ]


    -- PROGRAM


    main : Program Never Model Msg
    main =
        Expo.program
            { init = ( model, Cmd.none )
            , view = view
            , update = update
            , subscriptions = \model -> Expo.downs TouchDown
            }


Replace the contents of the `App.js` file with the following lines:

    var elmexpo = require('elm-expo');
    elmexpo.prepare();
    const Elm = require('./elm');
    elmexpo.bridge(Elm.Main);

    console.log('...app.js end...');


Run the following commands, install Expo app on your phone, and try loading it via the QR-code:

    $ npm run build    # this should compile Elm to JS
    $ npm start

NOTES:

 - If you have trouble with Expo not connecting to your local IP (especially on
   Windows), try setting up a VPN between your PC and your phone, e.g. with the
   free [ZeroTier One](https://zerotier.com/) tool.
 - The `npm start` command will try to detect an IP, but it may pick a poor
   choice. If you want to run it at a different IP, assign it to OS environment
   variable `REACT_NATIVE_PACKAGER_HOSTNAME` and run `npm start` again.

