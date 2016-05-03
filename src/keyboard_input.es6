
// based off mapping here
// http://tutorials.renoise.com/w//images/d/d6/2.8_renoisekeyboard.png


// letter, and number of halfsteps from root
export const KEYBOARD_MAP = {
  // octave 1
  "z": 0,
  "s": 1,
  "x": 2,
  "d": 3,
  "c": 4,
  "v": 5,
  "g": 6,
  "b": 7,
  "h": 8,
  "n": 9,
  "j": 10,
  "m": 11,


  // octave 2
  ",": 12 + 0,
  "l": 12 + 1,
  ".": 12 + 2,
  ";": 12 + 3,
  "/": 12 + 4,
  
  "q": 12 + 0,
  "2": 12 + 1,
  "w": 12 + 2,
  "3": 12 + 3,
  "e": 12 + 4,
  "r": 12 + 5,
  "5": 12 + 6,
  "t": 12 + 7,
  "6": 12 + 8,
  "y": 12 + 9,
  "7": 12 + 10,
  "u": 12 + 11,

  // octave 3
  "i": 12*2 + 0,
  "9": 12*2 + 1,
  "o": 12*2 + 2,
  "0": 12*2 + 3,
  "p": 12*2 + 4,
  "[": 12*2 + 5,
  "=": 12*2 + 6,
  "]": 12*2 + 7,
}

export function noteForKey(root, key) {
  const offset = KEYBOARD_MAP[key]
  if (!offset) {
    throw `Invalid key: ${key}`
  }
}

