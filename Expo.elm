module Expo
    exposing
        ( beginnerProgram
        , program
        , Node
        , view
        , text
        , node
        , Attribute
        , attribute
        , Position
        , downs
        )

{-|
@docs beginnerProgram, program, Node, view, text, node, Attribute, attribute, Position, downs
-}

import VirtualDom
import Mouse


{-| -}
type alias Node msg
    = VirtualDom.Node msg


{-| -}
view : List (Attribute msg) -> List (Node msg) -> Node msg
view =
    node "RCTView"


{-| -}
text : String -> Node msg
text s =
    -- Without RCTText wrapper, I was getting error like in https://github.com/facebook/react-native/issues/13243
    node "RCTText" []
        [ node "RCTRawText"
            [ VirtualDom.attribute "Stext" s ]
            [ ]
        ]


{-| -}
node : String -> List (Attribute msg) -> List (Node msg) -> Node msg
node =
    VirtualDom.node


{-| -}
type alias Attribute msg
    = VirtualDom.Property msg


{-| DEPRECATED: Use Expo.Attribute.string/double/... instead -}
attribute : String -> String -> Attribute msg
attribute name =
    -- legacy logic recreation
    VirtualDom.attribute
    <| if name == "flex" then "Dflex" else ("S" ++ name)


{-| -}
type alias Position =
    { x : Int
    , y : Int
    }


{-| -}
downs : (Position -> msg) -> Sub msg
downs =
    Mouse.downs


{-| -}
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
-- beginnerProgram =
--     Native.Expo.beginnerProgram


{-| -}
program :
    { view : model -> Node msg
    , update : msg -> model -> ( model, Cmd msg )
    , subscriptions : model -> Sub msg
    , init : ( model, Cmd msg )
    }
    -> Program Never model msg
program =
    VirtualDom.program
