module Expo.Attribute
    exposing
        ( string
        , double
        )

{-|
@docs string, float
-}

import VirtualDom
import Expo

type alias Attribute msg
    = Expo.Attribute msg

{-| -}
string : String -> String -> Attribute msg
string name value =
    VirtualDom.attribute ("S" ++ name) value


{-| -}
double : String -> Float -> Attribute msg
double =
    typedAttr "D"


typedAttr : String -> String -> value -> Attribute msg
typedAttr sigil name value =
    VirtualDom.attribute (sigil ++ name) (toString value)

