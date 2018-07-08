module Expo.Attribute
    exposing
        ( string
        , double
        , bool
        , color
        )

{-|
@docs string, double, bool, color
-}

import Color exposing (Color)
import Bitwise
import VirtualDom
import Expo

type alias Attribute msg
    = Expo.Attribute msg

{-| Use it to set attributes with string values. Examples:

    Attr.string "flexDirection" "row"
    Attr.string "justifyContent" "space-between"

**Important Note:** for attributes with numeric values, use `double` instead;
for attributes with color values, use `color`.
-}
string : String -> String -> Attribute msg
string name value =
    VirtualDom.attribute ("S" ++ name) value


{-| Use it to set attributes with numeric values. Examples:

    Attr.double "flex" 1
    Attr.double "width" 80
    Attr.double "shadowOpacity" 0.25

If you accidentally use `string` instead of `double` or `color`, you may get a
"Red Screen of Death" in Expo, with an error message similar like below:

    Error while updating property 'Sflex' in shadow node of type: RCTView

    java.lang.String cannot be cast to java.lang.Double

    updateShadowNodeProp - ViewManagersPropertyCache.java:113
    setProperty - ViewmanagerPropertyUpdater.java:154
    ...

The above example message would mean there are some `string "flex"` attributes
in code, which have to be changed to `double "flex"`.
-}
double : String -> Float -> Attribute msg
double =
    typedAttr "D"


bool : String -> Bool -> Attribute msg
bool =
    typedAttr "B"


{-| Use it to set attributes with numeric values. Examples:

    import Color

    Attr.color "color" Color.white
    Attr.color "backgroundColor" Color.red
    Attr.color "shadowColor" Color.black
-}
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

