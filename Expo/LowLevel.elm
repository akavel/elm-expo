module Expo.LowLevel exposing
    ( node
    )

import VirtualDom
import Expo exposing (..)


{-| -}
node : String -> List (Attribute msg) -> List (Node msg) -> Node msg
node =
    VirtualDom.node
