module Expo
    exposing
        ( beginnerProgram
        , program
        , Node
        , view
        , text
        , node
        , Attribute
        , on
        , onWithOptions
        , Options
        , attribute
        , Position
        , downs
        )

{-| The `Expo` library is an experimental API for writing mobile apps in Elm,
using [Expo](https://expo.io). 

**IMPORTANT NOTE:** See the [elm-expo](https://github.com/akavel/elm-expo)
project for information how to install this package, including the required
JavaScript dependencies. Note also that this is a **highly experimental
library** and at a very early stage; things may be missing, not work as
expected, or not work at all. Use at your own risk. Ok, with due warnings now
behind us: *Happy Hacking! :)*

# Program Start
@docs program, beginnerProgram

# Application Look
@docs Node, view, text, node
@docs Attribute

# Per-node User Interactions
@docs on, onWithOptions, Options

# Deprecated Experiments — Do Not Use
@docs attribute, Position, downs
-}

import VirtualDom
import Mouse
import Json.Decode exposing (Decoder)


{-| Check out the docs for [`Html.program`][prog].
It works exactly the same way.

[prog]: http://package.elm-lang.org/packages/elm-lang/html/2.0.0/Html#program
-}
program :
    { view : model -> Node msg
    , update : msg -> model -> ( model, Cmd msg )
    , subscriptions : model -> Sub msg
    , init : ( model, Cmd msg )
    }
    -> Program Never model msg
program =
    VirtualDom.program


{-| Check out the docs for [`Html.beginnerProgram`][prog].
It works exactly the same way.

[prog]: http://package.elm-lang.org/packages/elm-lang/html/2.0.0/Html#beginnerProgram
-}
beginnerProgram :
    { model : model
    , view : model -> Node msg
    , update : msg -> model -> model
    }
    -> Program Never model msg
beginnerProgram {model, view, update} =
  program
    { init = (model, Cmd.none)
    , update = \msg model -> (update msg model, Cmd.none)
    , view = view
    , subscriptions = \_ -> Sub.none
    }


{-| The core building block of a mobile application's interface.
To create a simple text node on Android:

    import Expo.Attribute as Attr

    hello : Node msg
    hello =
        node "RCTText" []
            [ node "RCTRawText"
                [ Attr.string "text" "Hello world!" ]
                []
            ]

The above common use case is wrapped in the helper function `text`, see below.
-}
type alias Node msg
    = VirtualDom.Node msg


{-| General way to create various Expo view nodes. -}
node : String -> List (Attribute msg) -> List (Node msg) -> Node msg
node =
    VirtualDom.node


{-| A helper for creating the most common and generic `View` nodes. It is
defined as:

    view =
        node "RCTView"
-}
view : List (Attribute msg) -> List (Node msg) -> Node msg
view =
    node "RCTView"


{-| A helper for creating raw text nodes. A simple "Hello world" interface, as
described in `Node` documentation, can be simplified as:

    hello : Node msg
    hello =
        text "Hello world!"
-}
text : String -> Node msg
text s =
    -- Without RCTText wrapper, I was getting error like in https://github.com/facebook/react-native/issues/13243
    node "RCTText" []
        [ node "RCTRawText"
            [ VirtualDom.attribute "Stext" s ]
            [ ]
        ]


{-| Used to specify attributes on Expo nodes. See `Expo.Attribute` module for
helpers that you should use to set particular attributes.
-}
type alias Attribute msg
    = VirtualDom.Property msg


{-| Create a custom event listener. Currently only supports touch events.

    import Json.Decode as Json

    onTouchEnd : msg -> Attribute msg
    onTouchEnd msg =
        on "topTouchEnd" (Json.succeed msg)
-}
on : String -> Decoder msg -> Attribute msg
on event =
    onWithOptions event { stopPropagation = False, preventDefault = False }


{-| Some as `on` but you can set a few options. -}
onWithOptions : String -> Options -> Decoder msg -> Attribute msg
onWithOptions event options =
    VirtualDom.onWithOptions event { options | preventDefault = False }


{-| Options for an event listener. If `stopPropagation` is true, it means the
event stops traveling through the nodes hierarchy, so it will not trigger any
other event listeners on parent nodes. The `preventDefault` option is currently
ignored, as there are no default actions implemented.
-}
type alias Options =
    { stopPropagation : Bool
    , preventDefault : Bool
    }


{-| DEPRECATED: Use Expo.Attribute.string/double/... instead -}
attribute : String -> String -> Attribute msg
attribute name =
    Debug.crash "do not use"
    -- -- legacy logic recreation
    -- VirtualDom.attribute
    -- <| if name == "flex" then "Dflex" else ("S" ++ name)


{-| Deprecated. -}
type alias Position =
    { x : Int
    , y : Int
    }


{-| Deprecated. -}
downs : (Position -> msg) -> Sub msg
downs =
    Mouse.downs
