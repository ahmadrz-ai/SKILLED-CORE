"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Smile, Leaf, Coffee, Trophy, MapPin, Lightbulb, Heart, Flag, History, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Emoji {
    char: string;
    name: string;
}

interface CustomEmojiPickerProps {
    onEmojiSelect: (emoji: string) => void;
    onClose?: () => void;
}

// Compact premium emoji dataset grouped by categories
const EMOJI_CATEGORIES = [
    {
        id: "smileys",
        name: "Smileys & People",
        icon: Smile,
        emojis: [
            { char: "😀", name: "grinning face" },
            { char: "😃", name: "grinning face with big eyes" },
            { char: "😄", name: "grinning face with smiling eyes" },
            { char: "😁", name: "beaming face with smiling eyes" },
            { char: "😆", name: "grinning squinting face" },
            { char: "😅", name: "grinning face with sweat" },
            { char: "😂", name: "face with tears of joy" },
            { char: "🤣", name: "rolling on the floor laughing" },
            { char: "😊", name: "smiling face with smiling eyes" },
            { char: "😇", name: "smiling face with halo" },
            { char: "🙂", name: "slightly smiling face" },
            { char: "🙃", name: "upside-down face" },
            { char: "😉", name: "winking face" },
            { char: "😌", name: "relieved face" },
            { char: "😍", name: "smiling face with heart-eyes" },
            { char: "🥰", name: "smiling face with hearts" },
            { char: "😘", name: "face blowing a kiss" },
            { char: "😗", name: "kissing face" },
            { char: "😙", name: "kissing face with smiling eyes" },
            { char: "😚", name: "kissing face with closed eyes" },
            { char: "😋", name: "face savoring food" },
            { char: "😛", name: "face with tongue" },
            { char: "😝", name: "squinting face with tongue" },
            { char: "😜", name: "winking face with tongue" },
            { char: "🤪", name: "zany face" },
            { char: "🤨", name: "face with raised eyebrow" },
            { char: "🧐", name: "face with monocle" },
            { char: "🤓", name: "nerd face" },
            { char: "😎", name: "smiling face with sunglasses" },
            { char: "🥸", name: "disguised face" },
            { char: "🤩", name: "star-struck" },
            { char: "🥳", name: "partying face" },
            { char: "😏", name: "smirking face" },
            { char: "😒", name: "unamused face" },
            { char: "😞", name: "disappointed face" },
            { char: "😔", name: "pensive face" },
            { char: "😟", name: "worried face" },
            { char: "😕", name: "confused face" },
            { char: "🙁", name: "slightly frowning face" },
            { char: "☹️", name: "frowning face" },
            { char: "😣", name: "persevering face" },
            { char: "😖", name: "confounded face" },
            { char: "😫", name: "tired face" },
            { char: "😩", name: "weary face" },
            { char: "🥺", name: "pleading face" },
            { char: "😢", name: "crying face" },
            { char: "😭", name: "loudly crying face" },
            { char: "😤", name: "face with steam from nose" },
            { char: "😠", name: "angry face" },
            { char: "😡", name: "enraged face" },
            { char: "🤬", name: "face with symbols on mouth" },
            { char: "🤯", name: "exploding head" },
            { char: "😳", name: "flushed face" },
            { char: "🥵", name: "hot face" },
            { char: "🥶", name: "cold face" },
            { char: "😱", name: "face screaming in fear" },
            { char: "😨", name: "fearful face" },
            { char: "😰", name: "anxious face with sweat" },
            { char: "😥", name: "sad but relieved face" },
            { char: "😓", name: "downcast face with sweat" },
            { char: "🤗", name: "hugging face" },
            { char: "🤔", name: "thinking face" },
            { char: "🫣", name: "face with peeking eye" },
            { char: "🤭", name: "face with hand over mouth" },
            { char: "🫢", name: "face with open eyes and hand over mouth" },
            { char: "🤫", name: "shushing face" },
            { char: "🤥", name: "lying face" },
            { char: "😶", name: "face without mouth" },
            { char: "😐", name: "neutral face" },
            { char: "😑", name: "expressionless face" },
            { char: "😬", name: "grimacing face" },
            { char: "🫨", name: "shaking face" },
            { char: "🙄", name: "face with rolling eyes" },
            { char: "😯", name: "hushed face" },
            { char: "😦", name: "frowning face with open mouth" },
            { char: "😧", name: "anguished face" },
            { char: "😮", name: "face with open mouth" },
            { char: "😲", name: "astonished face" },
            { char: "🥱", name: "yawning face" },
            { char: "😴", name: "sleeping face" },
            { char: "🤤", name: "drooling face" },
            { char: "😪", name: "sleepy face" },
            { char: "😵", name: "face with crossed-out eyes" },
            { char: "🥴", name: "woozy face" },
            { char: "🤢", name: "nauseated face" },
            { char: "🤮", name: "face vomiting" },
            { char: "🤧", name: "sneezing face" },
            { char: "😷", name: "face with medical mask" },
            { char: "🤒", name: "face with thermometer" },
            { char: "🤕", name: "face with head-bandage" },
            { char: "🤑", name: "money-mouth face" },
            { char: "🤠", name: "cowboy hat face" },
            { char: "😈", name: "smiling face with horns" },
            { char: "👿", name: "angry face with horns" },
            { char: "👹", name: "ogre" },
            { char: "👺", name: "goblin" },
            { char: "🤡", name: "clown face" },
            { char: "💩", name: "pile of poo" },
            { char: "👻", name: "ghost" },
            { char: "💀", name: "skull" },
            { char: "☠️", name: "skull and crossbones" },
            { char: "👽", name: "alien" },
            { char: "👾", name: "alien monster" },
            { char: "🤖", name: "robot" },
            { char: "🎃", name: "jack-o-lantern" },
            { char: "😺", name: "grinning cat" },
            { char: "😸", name: "grinning cat with smiling eyes" },
            { char: "😹", name: "cat with tears of joy" },
            { char: "😻", name: "smiling cat with heart-eyes" },
            { char: "😼", name: "cat with wry smile" },
            { char: "😽", name: "kissing cat" },
            { char: "🙀", name: "weary cat" },
            { char: "😿", name: "crying cat" },
            { char: "😾", name: "pouting cat" },
            { char: "👋", name: "waving hand" },
            { char: "🤚", name: "raised back of hand" },
            { char: "🖐️", name: "hand with fingers splayed" },
            { char: "✋", name: "raised hand" },
            { char: "🖖", name: "vulcan salute" },
            { char: "👌", name: "OK hand" },
            { char: "🤌", name: "pinched fingers" },
            { char: "🤏", name: "pinching hand" },
            { char: "✌️", name: "victory hand" },
            { char: "🤞", name: "crossed fingers" },
            { char: "🫰", name: "hand with index finger and thumb crossed" },
            { char: "🤟", name: "love-you gesture" },
            { char: "🤘", name: "sign of the horns" },
            { char: "🤙", name: "call me hand" },
            { char: "👈", name: "backhand index pointing left" },
            { char: "👉", name: "backhand index pointing right" },
            { char: "👆", name: "backhand index pointing up" },
            { char: "🖕", name: "middle finger" },
            { char: "👇", name: "backhand index pointing down" },
            { char: "☝️", name: "index pointing up" },
            { char: "👍", name: "thumbs up" },
            { char: "👎", name: "thumbs down" },
            { char: "✊", name: "raised fist" },
            { char: "👊", name: "oncoming fist" },
            { char: "🤛", name: "left-facing fist" },
            { char: "🤜", name: "right-facing fist" },
            { char: "👏", name: "clapping hands" },
            { char: "🙌", name: "raising hands" },
            { char: "👐", name: "open hands" },
            { char: "🤲", name: "palms up together" },
            { char: "🤝", name: "handshake" },
            { char: "🙏", name: "folded hands" },
            { char: "✍️", name: "writing hand" },
            { char: "💅", name: "nail polish" },
            { char: "🤳", name: "selfie" },
            { char: "💪", name: "flexed biceps" },
            { char: "🦾", name: "mechanical arm" },
            { char: "🦿", name: "mechanical leg" },
            { char: "🦵", name: "leg" },
            { char: "🦶", name: "foot" },
            { char: "👂", name: "ear" },
            { char: "🦻", name: "ear with hearing aid" },
            { char: "👃", name: "nose" },
            { char: "🧠", name: "brain" },
            { char: "🫀", name: "heart organ" },
            { char: "🫁", name: "lungs organ" },
            { char: "🦷", name: "tooth" },
            { char: "🦴", name: "bone" },
            { char: "👀", name: "eyes" },
            { char: "👁️", name: "eye" },
            { char: "👅", name: "tongue" },
            { char: "👄", name: "mouth" },
            { char: "💋", name: "kiss mark" },
            { char: "🩸", name: "drop of blood" }
        ]
    },
    {
        id: "animals",
        name: "Animals & Nature",
        icon: Leaf,
        emojis: [
            { char: "🐶", name: "dog face" },
            { char: "🐱", name: "cat face" },
            { char: "🐭", name: "mouse face" },
            { char: "🐹", name: "hamster face" },
            { char: "🐰", name: "rabbit face" },
            { char: "🦊", name: "fox face" },
            { char: "🐻", name: "bear face" },
            { char: "🐼", name: "panda face" },
            { char: "🐨", name: "koala" },
            { char: "🐯", name: "tiger face" },
            { char: "🦁", name: "lion face" },
            { char: "🐮", name: "cow face" },
            { char: "🐷", name: "pig face" },
            { char: "🐽", name: "pig nose" },
            { char: "🐸", name: "frog face" },
            { char: "🐵", name: "monkey face" },
            { char: "🙈", name: "see-no-evil monkey" },
            { char: "🙉", name: "hear-no-evil monkey" },
            { char: "🙊", name: "speak-no-evil monkey" },
            { char: "🐒", name: "monkey" },
            { char: "🐔", name: "chicken" },
            { char: "🐧", name: "penguin" },
            { char: "🐦", name: "bird" },
            { char: "🐤", name: "baby chick" },
            { char: "🐣", name: "hatching chick" },
            { char: "🐥", name: "front-facing baby chick" },
            { char: "🦆", name: "duck" },
            { char: "🦅", name: "eagle" },
            { char: "🦉", name: "owl" },
            { char: "🦇", name: "bat" },
            { char: "🐺", name: "wolf" },
            { char: "🐗", name: "boar" },
            { char: "🐴", name: "horse face" },
            { char: "🦄", name: "unicorn" },
            { char: "🐝", name: "honeybee" },
            { char: "🐛", name: "bug" },
            { char: "🦋", name: "butterfly" },
            { char: "🐌", name: "snail" },
            { char: "🐞", name: "lady beetle" },
            { char: "🐜", name: "ant" },
            { char: "🕷️", name: "spider" },
            { char: "🕸️", name: "spider web" },
            { char: "🐢", name: "turtle" },
            { char: "🐍", name: "snake" },
            { char: "🦎", name: "lizard" },
            { char: "🐙", name: "octopus" },
            { char: "🦑", name: "squid" },
            { char: "🦞", name: "lobster" },
            { char: "🦀", name: "crab" },
            { char: "🐠", name: "tropical fish" },
            { char: "🐟", name: "fish" },
            { char: "🐬", name: "dolphin" },
            { char: "🐳", name: "spouting whale" },
            { char: "🐋", name: "whale" },
            { char: "🦈", name: "shark" },
            { char: "🐊", name: "crocodile" },
            { char: "🐅", name: "tiger" },
            { char: "🐆", name: "leopard" },
            { char: "ZEBRA", name: "zebra" },
            { char: "🦓", name: "zebra" },
            { char: "🦍", name: "gorilla" },
            { char: "🦧", name: "orangutan" },
            { char: "🐘", name: "elephant" },
            { char: "🦛", name: "hippopotamus" },
            { char: "🦏", name: "rhinoceros" },
            { char: "🐪", name: "camel" },
            { char: "🐫", name: "two-hump camel" },
            { char: "🦒", name: "giraffe" },
            { char: "🦘", name: "kangaroo" },
            { char: "🐂", name: "ox" },
            { char: "🐃", name: "water buffalo" },
            { char: "🐄", name: "cow" },
            { char: "🐎", name: "horse" },
            { char: "🐖", name: "pig" },
            { char: "🐏", name: "ram" },
            { char: "🐑", name: "ewe" },
            { char: "🐐", name: "goat" },
            { char: "🦙", name: "llama" },
            { char: "🦌", name: "deer" },
            { char: "🐕", name: "dog" },
            { char: "🐩", name: "poodle" },
            { char: "🐈", name: "cat" },
            { char: "🐈‍⬛", name: "black cat" },
            { char: "🐓", name: "rooster" },
            { char: "🦃", name: "turkey" },
            { char: "🦚", name: "peacock" },
            { char: "🦜", name: "parrot" },
            { char: "🦢", name: "swan" },
            { char: "🦩", name: "flamingo" },
            { char: "🕊️", name: "dove" },
            { char: "🐇", name: "rabbit" },
            { char: "🦝", name: "raccoon" },
            { char: "🦡", name: "badger" },
            { char: "🦦", name: "otter" },
            { char: "🦥", name: "sloth" },
            { char: "🐿️", name: "chipmunk" },
            { char: "🦔", name: "hedgehog" },
            { char: "🐾", name: "paw prints" },
            { char: "🐉", name: "dragon" },
            { char: "🌵", name: "cactus" },
            { char: "🎄", name: "Christmas tree" },
            { char: "🌲", name: "evergreen tree" },
            { char: "🌳", name: "deciduous tree" },
            { char: "🌴", name: "palm tree" },
            { char: "🌱", name: "seedling" },
            { char: "🌿", name: "herb" },
            { char: "☘️", name: "shamrock" },
            { char: "🍀", name: "four leaf clover" },
            { char: "🍁", name: "maple leaf" },
            { char: "🍂", name: "fallen leaf" },
            { char: "🍃", name: "leaf fluttering in wind" }
        ]
    },
    {
        id: "food",
        name: "Food & Drink",
        icon: Coffee,
        emojis: [
            { char: "🍏", name: "green apple" },
            { char: "🍎", name: "red apple" },
            { char: "🍐", name: "pear" },
            { char: "🍊", name: "tangerine" },
            { char: "🍋", name: "lemon" },
            { char: "🍌", name: "banana" },
            { char: "🍉", name: "watermelon" },
            { char: "🍇", name: "grapes" },
            { char: "🍓", name: "strawberry" },
            { char: "🍒", name: "cherries" },
            { char: "🍑", name: "peach" },
            { char: "🥭", name: "mango" },
            { char: "🍍", name: "pineapple" },
            { char: "🥥", name: "coconut" },
            { char: "🥝", name: "kiwi fruit" },
            { char: "🍅", name: "tomato" },
            { char: "🍆", name: "eggplant" },
            { char: "🥑", name: "avocado" },
            { char: "🥦", name: "broccoli" },
            { char: "🥬", name: "leafy green" },
            { char: "🥒", name: "cucumber" },
            { char: "🌶️", name: "hot pepper" },
            { char: "🫑", name: "bell pepper" },
            { char: "🌽", name: "ear of corn" },
            { char: "🥕", name: "carrot" },
            { char: "🥔", name: "potato" },
            { char: "🥐", name: "croissant" },
            { char: "🥯", name: "bagel" },
            { char: "🍞", name: "bread" },
            { char: "🥖", name: "baguette bread" },
            { char: "🥨", name: "pretzel" },
            { char: "🧀", name: "cheese wedge" },
            { char: "🥚", name: "egg" },
            { char: "🍳", name: "cooking" },
            { char: "🥞", name: "pancakes" },
            { char: "🥓", name: "bacon strip" },
            { char: "🥩", name: "cut of meat" },
            { char: "🍔", name: "hamburger" },
            { char: "🍟", name: "fries" },
            { char: "🍕", name: "pizza" },
            { char: "🥪", name: "sandwich" },
            { char: "🌮", name: "taco" },
            { char: "🌯", name: "burrito" },
            { char: "🍿", name: "popcorn" },
            { char: "🥗", name: "green salad" },
            { char: "🍜", name: "steaming bowl" },
            { char: "🍝", name: "spaghetti" },
            { char: "🍣", name: "sushi" },
            { char: "🍤", name: "fried shrimp" },
            { char: "🍩", name: "donut" },
            { char: "🍪", name: "cookie" },
            { char: "🎂", name: "birthday cake" },
            { char: "🍰", name: "shortcake" },
            { char: "🥧", name: "pie" },
            { char: "🍫", name: "chocolate bar" },
            { char: "🍬", name: "candy" },
            { char: "🍭", name: "lollipop" },
            { char: "🍯", name: "honey pot" },
            { char: "🥛", name: "glass of milk" },
            { char: "☕", name: "hot beverage" },
            { char: "🍵", name: "teacup without handle" },
            { char: "🍷", name: "wine glass" },
            { char: "🍸", name: "cocktail glass" },
            { char: "🍹", name: "tropical drink" },
            { char: "🍺", name: "beer mug" },
            { char: "🍻", name: "clinking beer mugs" },
            { char: "🥂", name: "clinking glasses" },
            { char: "🥃", name: "tumbler glass" },
            { char: "🥤", name: "cup with straw" },
            { char: "🧋", name: "bubble tea" }
        ]
    },
    {
        id: "activity",
        name: "Activity & Sports",
        icon: Trophy,
        emojis: [
            { char: "⚽", name: "soccer ball" },
            { char: "🏀", name: "basketball" },
            { char: "🏈", name: "american football" },
            { char: "⚾", name: "baseball" },
            { char: "🥎", name: "softball" },
            { char: "🎾", name: "tennis" },
            { char: "🏐", name: "volleyball" },
            { char: "🏉", name: "rugby football" },
            { char: "🥏", name: "flying disc" },
            { char: "🎱", name: "pool 8 ball" },
            { char: "🏓", name: "ping pong" },
            { char: "🏸", name: "badminton" },
            { char: "🏒", name: "ice hockey" },
            { char: "🏑", name: "field hockey" },
            { char: "🏏", name: "cricket game" },
            { char: "🎯", name: "bullseye" },
            { char: "🏹", name: "bow and arrow" },
            { char: "⛳", name: "flag in hole" },
            { char: "🎣", name: "fishing pole" },
            { char: "🥊", name: "boxing glove" },
            { char: "🥋", name: "martial arts uniform" },
            { char: "⛸️", name: "ice skate" },
            { char: "🎿", name: "skis" },
            { char: "🏋️", name: "person lifting weights" },
            { char: "🤸", name: "person cartwheeling" },
            { char: "⛹️", name: "person bouncing ball" },
            { char: "🤺", name: "fencer" },
            { char: "🏌️", name: "person golfing" },
            { char: "🧘", name: "person in lotus position" },
            { char: "🏄", name: "person surfing" },
            { char: "🏊", name: "person swimming" },
            { char: "🤽", name: "person playing water polo" },
            { char: "🚣", name: "person rowing boat" },
            { char: "🧗", name: "person climbing" },
            { char: "🚴", name: "person biking" },
            { char: "🏆", name: "trophy" },
            { char: "🥇", name: "1st place medal" },
            { char: "🥈", name: "2nd place medal" },
            { char: "🥉", name: "3rd place medal" },
            { char: "🏅", name: "sports medal" },
            { char: "🎟️", name: "admission tickets" },
            { char: "🎭", name: "performing arts" },
            { char: "🎨", name: "artist palette" },
            { char: "🎬", name: "clapper board" },
            { char: "🎤", name: "microphone" },
            { char: "🎧", name: "headphone" },
            { char: "🎼", name: "musical score" },
            { char: "🎹", name: "musical keyboard" },
            { char: "🥁", name: "drum" },
            { char: "🎷", name: "saxophone" },
            { char: "🎺", name: "trumpet" },
            { char: "🎸", name: "guitar" },
            { char: "🎻", name: "violin" },
            { char: "🎲", name: "game die" },
            { char: "♟️", name: "chess pawn" },
            { char: "🎳", name: "bowling" },
            { char: "🎮", name: "video game" },
            { char: "🧩", name: "puzzle piece" }
        ]
    },
    {
        id: "travel",
        name: "Travel & Places",
        icon: MapPin,
        emojis: [
            { char: "🚗", name: "automobile" },
            { char: "🚕", name: "taxi" },
            { char: "🚙", name: "sport utility vehicle" },
            { char: "🚌", name: "bus" },
            { char: "🚓", name: "police car" },
            { char: "🚑", name: "ambulance" },
            { char: "🚒", name: "fire engine" },
            { char: "🚚", name: "delivery truck" },
            { char: "🚛", name: "articulated lorry" },
            { char: "🚜", name: "tractor" },
            { char: "🛵", name: "motor scooter" },
            { char: "🚲", name: "bicycle" },
            { char: "🚨", name: "police car light" },
            { char: "🚇", name: "metro" },
            { char: "🛫", name: "airplane departure" },
            { char: "✈️", name: "airplane" },
            { char: "🚁", name: "helicopter" },
            { char: "🚀", name: "rocket" },
            { char: "🛸", name: "flying saucer" },
            { char: "⛵", name: "sailboat" },
            { char: "🚢", name: "ship" },
            { char: "⚓", name: "anchor" },
            { char: "🚧", name: "construction" },
            { char: "⛽", name: "fuel pump" },
            { char: "🗺️", name: "world map" },
            { char: "🧭", name: "compass" },
            { char: "🏔️", name: "snow-capped mountain" },
            { char: "⛰️", name: "mountain" },
            { char: "🌋", name: "volcano" },
            { char: "🗻", name: "mount fuji" },
            { char: "🏕️", name: "camping" },
            { char: "🏖️", name: "beach with umbrella" },
            { char: "🏜️", name: "desert" },
            { char: "🏝️", name: "desert island" },
            { char: "🏞️", name: "national park" },
            { char: "🏟️", name: "stadium" },
            { char: "🏛️", name: "classical building" },
            { char: "🏚️", name: "derelict house" },
            { char: "🏠", name: "house" },
            { char: "🏡", name: "house with garden" },
            { char: "🏢", name: "office building" },
            { char: "🏤", name: "post office" },
            { char: "🏥", name: "hospital" },
            { char: "🏦", name: "bank" },
            { char: "🏨", name: "hotel" },
            { char: "🏪", name: "convenience store" },
            { char: "🏫", name: "school" },
            { char: "🏬", name: "department store" },
            { char: "🏭", name: "factory" },
            { char: "🏯", name: "japanese castle" },
            { char: "🏰", name: "castle" },
            { char: "💒", name: "wedding" },
            { char: "🗼", name: "tokyo tower" },
            { char: "🗽", name: "statue of liberty" },
            { char: "⛪", name: "church" },
            { char: "🕌", name: "mosque" },
            { char: "⛩️", name: "shinto shrine" },
            { char: "⛲", name: "fountain" },
            { char: "⛺", name: "tent" },
            { char: "🌁", name: "foggy" },
            { char: "🏙️", name: "cityscape" },
            { char: "🌇", name: "sunset" },
            { char: "🌅", name: "sunrise" },
            { char: "🌉", name: "bridge at night" },
            { char: "🎡", name: "ferris wheel" },
            { char: "🎢", name: "roller coaster" }
        ]
    },
    {
        id: "objects",
        name: "Objects",
        icon: Lightbulb,
        emojis: [
            { char: "⌚", name: "watch" },
            { char: "📱", name: "mobile phone" },
            { char: "💻", name: "laptop" },
            { char: "⌨️", name: "keyboard" },
            { char: "🖱️", name: "computer mouse" },
            { char: "🖨️", name: "printer" },
            { char: "📷", name: "camera" },
            { char: "📹", name: "video camera" },
            { char: "🔍", name: "magnifying glass tilted left" },
            { char: "💡", name: "light bulb" },
            { char: "🔦", name: "flashlight" },
            { char: "🕯️", name: "candle" },
            { char: "📖", name: "open book" },
            { char: "📕", name: "closed book" },
            { char: "📚", name: "books" },
            { char: "📝", name: "memo" },
            { char: "✉️", name: "envelope" },
            { char: "📧", name: "e-mail" },
            { char: "📨", name: "incoming envelope" },
            { char: "📦", name: "package" },
            { char: "🏷️", name: "label" },
            { char: "💳", name: "credit card" },
            { char: "💸", name: "money with wings" },
            { char: "💵", name: "dollar banknote" },
            { char: "🪙", name: "coin" },
            { char: "💎", name: "gem stone" },
            { char: "⚖️", name: "balance scale" },
            { char: "🔧", name: "wrench" },
            { char: "🔨", name: "hammer" },
            { char: "🛠️", name: "hammer and wrench" },
            { char: "⛏️", name: "pick" },
            { char: "🔩", name: "nut and bolt" },
            { char: "⚙️", name: "gear" },
            { char: "⛓️", name: "chains" },
            { char: "🧲", name: "magnet" },
            { char: "💣", name: "bomb" },
            { char: "🪓", name: "axe" },
            { char: "🔪", name: "kitchen knife" },
            { char: "🛡️", name: "shield" },
            { char: "🔑", name: "key" },
            { char: "🗝️", name: "old key" },
            { char: "🧪", name: "test tube" },
            { char: "🧫", name: "petri dish" },
            { char: "🔬", name: "microscope" },
            { char: "🔭", name: "telescope" },
            { char: "📡", name: "satellite antenna" },
            { char: "💉", name: "syringe" },
            { char: "🩺", name: "stethoscope" },
            { char: "💊", name: "pill" },
            { char: "🩹", name: "adhesive bandage" },
            { char: "🪞", name: "mirror" },
            { char: "🧴", name: "lotion bottle" },
            { char: "🧼", name: "soap" },
            { char: "🧽", name: "sponge" },
            { char: "🧹", name: "broom" },
            { char: "🧺", name: "basket" },
            { char: "🧻", name: "roll of paper" },
            { char: "🪣", name: "bucket" },
            { char: "🪤", name: "mouse trap" },
            { char: "🛌", name: "person in bed" },
            { char: "🪑", name: "chair" },
            { char: "🚿", name: "shower" },
            { char: "🛁", name: "bathtub" },
            { char: "🚪", name: "door" },
            { char: "🎈", name: "balloon" },
            { char: "🎀", name: "ribbon" },
            { char: "🎁", name: "wrapped gift" },
            { char: "🪄", name: "magic wand" },
            { char: "🎉", name: "party popper" },
            { char: "🎊", name: "confetti ball" },
            { char: "📁", name: "file folder" },
            { char: "📂", name: "open file folder" },
            { char: "📅", name: "calendar" },
            { char: "📊", name: "bar chart" },
            { char: "📈", name: "chart increasing" },
            { char: "📉", name: "chart decreasing" },
            { char: "📋", name: "clipboard" },
            { char: "📌", name: "pushpin" },
            { char: "📍", name: "round pushpin" },
            { char: "📎", name: "paperclip" },
            { char: "📏", name: "straight ruler" },
            { char: "📐", name: "triangular ruler" },
            { char: "✂️", name: "scissors" },
            { char: "🗑️", name: "wastebasket" },
            { char: "🔒", name: "locked" },
            { char: "🔓", name: "unlocked" }
        ]
    },
    {
        id: "symbols",
        name: "Symbols",
        icon: Heart,
        emojis: [
            { char: "❤️", name: "red heart" },
            { char: "🧡", name: "orange heart" },
            { char: "💛", name: "yellow heart" },
            { char: "💚", name: "green heart" },
            { char: "💙", name: "blue heart" },
            { char: "💜", name: "purple heart" },
            { char: "🖤", name: "black heart" },
            { char: "🤍", name: "white heart" },
            { char: "🤎", name: "brown heart" },
            { char: "💔", name: "broken heart" },
            { char: "❤️‍🔥", name: "heart on fire" },
            { char: "❤️‍🩹", name: "mending heart" },
            { char: "❣️", name: "heart exclamation" },
            { char: "💕", name: "two hearts" },
            { char: "💞", name: "revolving hearts" },
            { char: "💓", name: "beating heart" },
            { char: "💗", name: "growing heart" },
            { char: "💖", name: "sparkling heart" },
            { char: "💘", name: "heart with arrow" },
            { char: "💝", name: "heart with ribbon" },
            { char: "💟", name: "heart decoration" },
            { char: "☮️", name: "peace symbol" },
            { char: "✝️", name: "latin cross" },
            { char: "☪️", name: "star and crescent" },
            { char: "🕉️", name: "om" },
            { char: "☸️", name: "wheel of dharma" },
            { char: "✡️", name: "star of david" },
            { char: "☯️", name: "yin yang" },
            { char: "☦️", name: "orthodox cross" },
            { char: "🛐", name: "place of worship" },
            { char: "♈", name: "Aries" },
            { char: "♉", name: "Taurus" },
            { char: "♊", name: "Gemini" },
            { char: "♋", name: "Cancer" },
            { char: "♌", name: "Leo" },
            { char: "♍", name: "Virgo" },
            { char: "♎", name: "Libra" },
            { char: "♏", name: "Scorpio" },
            { char: "♐", name: "Sagittarius" },
            { char: "♑", name: "Capricorn" },
            { char: "♒", name: "Aquarius" },
            { char: "♓", name: "Pisces" },
            { char: "🔀", name: "shuffle tracks button" },
            { char: "🔁", name: "repeat button" },
            { char: "🔂", name: "repeat single button" },
            { char: "▶️", name: "play button" },
            { char: "⏩", name: "fast-forward button" },
            { char: "◀️", name: "reverse button" },
            { char: "⏪", name: "fast reverse button" },
            { char: "🔼", name: "upwards button" },
            { char: "📶", name: "antenna bars" },
            { char: "📳", name: "vibration mode" },
            { char: "📴", name: "mobile phone off" },
            { char: "✖️", name: "multiply sign" },
            { char: "➕", name: "plus sign" },
            { char: "➖", name: "minus sign" },
            { char: "➗", name: "divide sign" },
            { char: "♾️", name: "infinity" },
            { char: "‼️", name: "double exclamation mark" },
            { char: "⁉️", name: "exclamation question mark" },
            { char: "❓", name: "question mark" },
            { char: "❔", name: "white question mark" },
            { char: "❕", name: "white exclamation mark" },
            { char: "❗️", name: "exclamation mark" },
            { char: "〰️", name: "wavy dash" },
            { char: "💲", name: "heavy dollar sign" },
            { char: "⚕️", name: "medical symbol" },
            { char: "♻️", name: "recycling symbol" },
            { char: "⚜️", name: "fleur-de-lis" },
            { char: "🔱", name: "trident emblem" },
            { char: "📛", name: "name badge" },
            { char: "🔰", name: "Japanese symbol for beginner" },
            { char: "⭕", name: "hollow red circle" },
            { char: "✅", name: "green button check" },
            { char: "☑️", name: "check box with check" },
            { char: "✔️", name: "check mark" },
            { char: "❌", name: "cross mark" },
            { char: "❎", name: "cross mark button" },
            { char: "🛑", name: "stop sign" },
            { char: "⛔", name: "no entry" },
            { char: "🚫", name: "prohibited" },
            { char: "♨️", name: "hot springs" },
            { char: "🚷", name: "no pedestrians" },
            { char: "🚯", name: "no littering" },
            { char: "🚳", name: "no bicycles" },
            { char: "🚱", name: "non-potable water" },
            { char: "🔞", name: "no one under eighteen" },
            { char: "🔴", name: "red circle" },
            { char: "🔵", name: "blue circle" },
            { char: "⚫", name: "black circle" },
            { char: "⚪", name: "white circle" },
            { char: "🟥", name: "red square" },
            { char: "🟦", name: "blue square" }
        ]
    },
    {
        id: "flags",
        name: "Flags",
        icon: Flag,
        emojis: [
            { char: "🏁", name: "chequered flag" },
            { char: "🚩", name: "triangular flag" },
            { char: "🎌", name: "crossed flags" },
            { char: "🏴‍☠️", name: "pirate flag" },
            { char: "🏳️", name: "white flag" },
            { char: "🏳️‍🌈", name: "rainbow flag" },
            { char: "🏳️‍⚧️", name: "transgender flag" },
            { char: "🏴", name: "black flag" },
            { char: "🇺🇸", name: "United States flag" },
            { char: "🇬🇧", name: "United Kingdom flag" },
            { char: "🇨🇦", name: "Canada flag" },
            { char: "🇦🇺", name: "Australia flag" },
            { char: "🇩🇪", name: "Germany flag" },
            { char: "🇫🇷", name: "France flag" },
            { char: "🇯🇵", name: "Japan flag" },
            { char: "🇨🇳", name: "China flag" },
            { char: "🇮🇳", name: "India flag" },
            { char: "🇧🇷", name: "Brazil flag" },
            { char: "🇵🇰", name: "Pakistan flag" },
            { char: "🇸🇦", name: "Saudi Arabia flag" },
            { char: "🇪🇸", name: "Spain flag" },
            { char: "🇮🇹", name: "Italy flag" },
            { char: "🇲🇽", name: "Mexico flag" },
            { char: "🇰🇷", name: "South Korea flag" },
            { char: "🇹🇷", name: "Turkey flag" }
        ]
    }
];

export default function CustomEmojiPicker({ onEmojiSelect, onClose }: CustomEmojiPickerProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("smileys");
    const [hoveredEmoji, setHoveredEmoji] = useState<Emoji | null>(null);
    const [recentEmojis, setRecentEmojis] = useState<Emoji[]>([]);
    
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

    // Load recent emojis from local storage
    useEffect(() => {
        try {
            const saved = localStorage.getItem("skilledcore_recent_emojis");
            if (saved) {
                setRecentEmojis(JSON.parse(saved));
            }
        } catch (e) {
            console.error("Failed to load recent emojis", e);
        }
    }, []);

    // Save recent emoji on click
    const handleEmojiClick = (emoji: Emoji) => {
        onEmojiSelect(emoji.char);
        
        // Add to recent list, max 16 (2 rows of 8), avoid duplicates
        const updated = [emoji, ...recentEmojis.filter(x => x.char !== emoji.char)].slice(0, 16);
        setRecentEmojis(updated);
        
        try {
            localStorage.setItem("skilledcore_recent_emojis", JSON.stringify(updated));
        } catch (e) {
            console.error("Failed to save recent emoji", e);
        }
    };

    // Filter emojis based on search
    const filteredResults = useMemo(() => {
        if (!searchQuery.trim()) return null;
        
        const query = searchQuery.toLowerCase().trim();
        const results: Emoji[] = [];
        
        EMOJI_CATEGORIES.forEach(category => {
            category.emojis.forEach(emoji => {
                if (emoji.name.toLowerCase().includes(query)) {
                    results.push(emoji);
                }
            });
        });
        
        return results;
    }, [searchQuery]);

    // Handle tab selection (scroll to category)
    const handleTabClick = (tabId: string) => {
        setActiveTab(tabId);
        setSearchQuery(""); // Clear search when switching tabs

        const element = categoryRefs.current[tabId];
        if (element && scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
                top: element.offsetTop - 8,
                behavior: "smooth"
            });
        }
    };

    // Track active category during scroll
    const handleScroll = () => {
        if (searchQuery) return; // Disable scroll detection during search
        
        const container = scrollContainerRef.current;
        if (!container) return;

        const scrollPosition = container.scrollTop + container.clientHeight / 3;
        
        let currentTab = "smileys";
        if (recentEmojis.length > 0) {
            const recentElement = categoryRefs.current["recent"];
            if (recentElement && scrollPosition >= recentElement.offsetTop) {
                currentTab = "recent";
            }
        }

        for (const category of EMOJI_CATEGORIES) {
            const element = categoryRefs.current[category.id];
            if (element && scrollPosition >= element.offsetTop) {
                currentTab = category.id;
            }
        }

        setActiveTab(currentTab);
    };

    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl flex flex-col overflow-hidden w-[340px] h-[390px] select-none transition-all duration-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Search Input Area */}
            <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20">
                <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search emojis..."
                    className="w-full bg-transparent border-0 outline-none p-0 text-sm text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:ring-0 focus:outline-none"
                    autoFocus
                />
                {searchQuery && (
                    <button 
                        onClick={() => setSearchQuery("")}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:underline px-1 py-0.5 rounded"
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* Category Navigation Tabs */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-50/30 dark:bg-zinc-950/10 border-b border-zinc-100 dark:border-zinc-800/80 overflow-x-auto scrollbar-none shrink-0">
                {recentEmojis.length > 0 && (
                    <button
                        onClick={() => handleTabClick("recent")}
                        className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 active:scale-95 shrink-0",
                            activeTab === "recent" 
                                ? "text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/40 font-bold scale-105" 
                                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                        )}
                        title="Recently Used"
                    >
                        <History className="w-4 h-4" />
                    </button>
                )}
                {EMOJI_CATEGORIES.map((category) => {
                    const IconComponent = category.icon;
                    return (
                        <button
                            key={category.id}
                            onClick={() => handleTabClick(category.id)}
                            className={cn(
                                "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 active:scale-95 shrink-0",
                                activeTab === category.id 
                                    ? "text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/40 font-bold scale-105" 
                                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                            )}
                            title={category.name}
                        >
                            <IconComponent className="w-4 h-4" />
                        </button>
                    );
                })}
            </div>

            {/* Scrollable Emojis Container */}
            <div 
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent"
            >
                {searchQuery ? (
                    /* Search Results */
                    <div>
                        <div className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 mb-2 px-1">
                            Search Results ({filteredResults?.length || 0})
                        </div>
                        {filteredResults && filteredResults.length > 0 ? (
                            <div className="grid grid-cols-8 gap-1">
                                {filteredResults.map((emoji) => (
                                    <button
                                        key={emoji.char + emoji.name}
                                        onClick={() => handleEmojiClick(emoji)}
                                        onMouseEnter={() => setHoveredEmoji(emoji)}
                                        onMouseLeave={() => setHoveredEmoji(null)}
                                        className="flex items-center justify-center w-[34px] h-[34px] rounded-lg text-xl hover:bg-indigo-50/80 dark:hover:bg-indigo-950/30 transition-all duration-150 hover:scale-120 active:scale-90"
                                    >
                                        {emoji.char}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-sm text-zinc-400 dark:text-zinc-500">
                                No matching emojis found 😢
                            </div>
                        )}
                    </div>
                ) : (
                    /* Categorized View */
                    <div className="space-y-4">
                        {/* Recently Used Category */}
                        {recentEmojis.length > 0 && (
                            <div 
                                ref={(el) => { categoryRefs.current["recent"] = el; }}
                                className="space-y-1.5"
                            >
                                <div className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 px-1 flex items-center gap-1.5">
                                    <History className="w-3.5 h-3.5 text-indigo-500/80" />
                                    <span>Recently Used</span>
                                </div>
                                <div className="grid grid-cols-8 gap-1">
                                    {recentEmojis.map((emoji) => (
                                        <button
                                            key={`recent-${emoji.char}-${emoji.name}`}
                                            onClick={() => handleEmojiClick(emoji)}
                                            onMouseEnter={() => setHoveredEmoji(emoji)}
                                            onMouseLeave={() => setHoveredEmoji(null)}
                                            className="flex items-center justify-center w-[34px] h-[34px] rounded-lg text-xl hover:bg-indigo-50/80 dark:hover:bg-indigo-950/30 transition-all duration-150 hover:scale-120 active:scale-90"
                                        >
                                            {emoji.char}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Standard Categories */}
                        {EMOJI_CATEGORIES.map((category) => (
                            <div 
                                key={category.id} 
                                ref={(el) => { categoryRefs.current[category.id] = el; }}
                                className="space-y-1.5"
                            >
                                <div className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 px-1">
                                    {category.name}
                                </div>
                                <div className="grid grid-cols-8 gap-1">
                                    {category.emojis.map((emoji) => (
                                        <button
                                            key={`${category.id}-${emoji.char}-${emoji.name}`}
                                            onClick={() => handleEmojiClick(emoji)}
                                            onMouseEnter={() => setHoveredEmoji(emoji)}
                                            onMouseLeave={() => setHoveredEmoji(null)}
                                            className="flex items-center justify-center w-[34px] h-[34px] rounded-lg text-xl hover:bg-indigo-50/80 dark:hover:bg-indigo-950/30 transition-all duration-150 hover:scale-120 active:scale-90"
                                        >
                                            {emoji.char}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Hover Tooltip / Detail Footer */}
            <div className="h-10 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/30 flex items-center px-4 shrink-0 transition-colors duration-150">
                {hoveredEmoji ? (
                    <div className="flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-100">
                        <span className="text-2xl">{hoveredEmoji.char}</span>
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 capitalize truncate max-w-[240px]">
                            :{hoveredEmoji.name.replace(/\s+/g, "_")}:
                        </span>
                    </div>
                ) : (
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                        Select an emoji
                    </span>
                )}
            </div>
        </div>
    );
}
