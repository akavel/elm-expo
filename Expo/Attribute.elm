module Expo.Attribute
    exposing
        ( string
        , double
        , color
        )

{-|
@docs string, double, color
-}

import Color exposing (Color)
import Bitwise
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


{-| -}
color : String -> Color -> Attribute msg
color name color =
    let
        asInt =
            -- 0xaarrggbb
            fromBytes alpha c.red c.green c.blue
        fromBytes exp24 exp16 exp8 exp0 =
            exp0
            |> Bitwise.or (exp8 |> Bitwise.shiftLeftBy 8)
            |> Bitwise.or (exp16 |> Bitwise.shiftLeftBy 16)
            |> Bitwise.or (exp24 |> Bitwise.shiftLeftBy 24)
        alpha =
            c.alpha * 255.0 |> round
        -- TODO: can I pattern-match here?
        c =
            Color.toRgb color
    in
        -- FIXME(akavel): make sure we correctly return signed 32-bit int on Android, as in:
        -- https://github.com/facebook/react-native/blob/v0.55.4/Libraries/StyleSheet/processColor.js#L30
        typedAttr "D" name asInt


typedAttr : String -> String -> value -> Attribute msg
typedAttr sigil name value =
    -- FIXME(akavel): maybe we can use Json.Encode... instead?
    VirtualDom.attribute (sigil ++ name) (toString value)

