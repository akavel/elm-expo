**Elm-Expo** is an experimental library for writing mobile phone apps with
[Elm](https://elm-lang.org), based on the [Expo](https://expo.io)
platform/helper app.

The July 2018 version of the library (Elm package 1.0.0, npm package 0.0.1) is
at a proof of concept/technology preview (pre-alpha) stage. The general idea
seems to be working, and a bare-bones "counter app" demo can be written in it.
Some important features are however still TODO. Please note I cannot say how
much I'll want to expand on developing this library; I'm not backed by anyone.
You're very much welcome to join the fun (I can answer any questions you want,
you can email me or open an issue), or take it and run away in any direction
you like (as long as you respect the license).

The current situation as I see it is as below:

 - ~~View nodes~~ — *DONE* Note: this uses basic low-level React Native
   blocks, such as RCTView etc. As of
   [RN 0.55.4](https://github.com/facebook/react-native/blob/v0.55.4/ReactAndroid/src/main/java/com/facebook/react/shell/MainReactPackage.java#L315),
   on Android this list should include more or less:
    - `ARTGroup`, `ARTShape`, `ARTText`, `ARTSurfaceView`
    - `AndroidCheckBox`, `AndroidProgressBar`, `AndroidSwitch`, `AndroidTextInput`
    - `AndroidDialogPicker`, `AndroidDropdownPicker`
    - `AndroidDrawerLayout`, `AndroidSwipeRefreshLayout`
    - `AndroidViewPager`
    - `ToolbarAndroid`
    - (`AndroidHorizontalScrollView`, `AndroidHorizontalScrollContentView`)
    - (`RCTScrollView`)
    - `RCTSlider`
    - `RCTWebView`
    - `RCTTextInlineImage`
    - `RCTImageView`
    - `RCTModalHostView`
    - `RCTRawText`, `RCTText`, `RCTVirtualText`
    - `RCTView`
 - View attributes — *PARTIALLY DONE:* string & double attributes work OK,
   bool attributes are TODO
 - ~~Per-node callbacks/events~~ — *DONE* Note: currently only basic low-level
   React Native touch events (`topTouchStart`, `topTouchMove`, `topTouchEnd`)
 - Scrolling views handling — TODO
    - Note: especially for `onClick` etc. events/callbacks, this may require
      porting the touch processing logic from React Native (this logic handles
      recognition of scroll events vs. click events)
 - Global click/touch events — PARTIALLY DONE: basic handling of touch-down;
   needs better handling + touch-up + touch-drag handling

## Installation guide

Start with [create-react-native-app](https://github.com/react-community/create-react-native-app#readme):

    $ npm install -g create-react-native-app
    $ create-react-native-app my-app    # on Windows: %appdata%\npm\create-react-native-app my-app
    $ cd my-app/

Install extra dependencies:

    $ npm install --save-dev chokidar-cli@1.2.0
    $ npm install --save-dev elm@~0.18.0         # FIXME: how to make it add version "~0.18.0"?
    $ elm-package install akavel/elm-expo        # on Windows: %aAppdata%\npm\elm-package ...

Add the following lines to your `package.json`, in section `"scripts"`:

    "watch-elm": "chokidar \"src/**/*.elm\" -c \"npm run build\" --initial",
    "build": "elm-make src/Main.elm --output=elm.js",

Create directory 'src/', and in it a file named `Main.elm` with the following contents:

    module Main exposing (..)

    import Expo exposing (..)


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

