// Set up variables
// Amount of pixels to draw per draw call (a big number can make framerate to drop)
let draw_speed = 500;

// Color palettes
let palettes = [
    [[46, 52, 64], [216, 222, 233]],
    [[89, 110, 121], [228, 232, 209]],
    [[34, 35, 35], [240, 246, 240]],
    [[62, 35, 44], [237, 246, 214]],
    [[198, 186, 172], [30, 28, 50]],
    [[10, 46, 68], [252, 255, 204]],
    [[0, 0, 0], [255, 255, 255]],
]

// Current color pallet
let current_palette = 0;

// Carpet base
let base = [3, 3];

// Ignored points
let ignored_remainder = [[1, 1]];

// Record interface
let capturer = new CCapture({
    format: 'png',
    framerate: 60,
});

let _recording = false;

let _buffer = [];
let _buffer_index = 0;

// Help
function help() {
    console.log(
        `Available functions:
    help() -> Print this help.
    new_draw(index_palette, random, new_draw_speed) -> Clear screen, create a new draw buffer (can shuffle it if needed) and select new color pallet (index of the color palette to use, if needs to shuffle the draw buffer, new draw speed ).
    add_color_pallet(base, accent) -> Add a new color pallet (base: [0 <= r <= 255, 0 <= g <= 255, 0 <= b <= 255] accent: [0 <= r <= 255, 0 <= g <= 255, 0 <= b <= 255]).
    add_ignore_remainder(r_x, r_y) -> Add new ignore remainder (0 <= r_x, 0 <= r_y).
    remove_ignore_remainder(index) -> Add remove ignore remainder (0 <= index <= ignored_remainder.length).
    change_base(b_x, b_y) -> Change base of the fractal (0 <= b_x, 0 <= b_y).
    shuffle_buffer() -> Shuffle draw buffer.
    
    
    Variables:
    draw_speed -> Amount of pixels to draw per draw call (a big number can make framerate to drop).
    palettes -> List of color palettes.
    current_palette -> The index of the color palette in use.
    base -> Current base of the fractal.
    ignored_remainder -> A list of current ignored remainder.
     
    How to record:
    start_record(index_palette, random, loop_speed) -> Start recording, before recording runs new_draw(), so the function need the new_draw() arguments.
    stop_record() -> Stop the recording and saves to disc.
    `);
}

help();

// Function to update variables, this functions can be call through the console

// Add a new color pallet
// base: [0 <= r <= 255, 0 <= g <= 255, 0 <= b <= 255]
// accent: [0 <= r <= 255, 0 <= g <= 255, 0 <= b <= 255]
function add_color_pallet(base, accent) {
    palettes.push([base, accent]);
    return `New color pallet added, index: ${palettes.length - 1}`;
}

// Add new ignore remainder
function add_ignore_remainder(r_x, r_y) {
    if (!r_x || r_x < 1 || !r_y || r_y < 1) {
        return `Error: r_x and r_y must be grater than 1`
    }
    ignored_remainder.push([r_x, r_y]);
    return ignored_remainder;
}

// Add remove ignore remainder
function remove_ignore_remainder(index) {
    ignored_remainder.splice(index, 1);
}

// Create a new base
function change_base(b_x, b_y) {
    if (!b_x || b_x < 1 || !b_y || b_y < 1) {
        return `Error: b_x and b_y must be grater than 1`
    }
    base = [b_x, b_y]
    return base;
}

// Public sketch functions
// Clear screen, create a new draw buffer (can shuffle it if needed) and select new color pallet
function new_draw(index_palette, random, new_draw_speed) {
    // If the palette dont exist
    if (!palettes[index_palette] || palettes[index_palette].length < 2 ||
        !palettes[index_palette][0] || palettes[index_palette][0].length < 1 ||
        !palettes[index_palette][1] || palettes[index_palette][1].length < 1) {
        return "Palette dont exist";
    }

    // Select new pallet
    current_palette = index_palette;
    // Clear background
    background(palettes[current_palette][0]);

    // set loops
    draw_speed = new_draw_speed || draw_speed;

    // create buffer
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            _buffer[(y * width) + x] = (y * width) + x;
        }
    }
    _buffer_index = 0

    if (random) {
        shuffle_buffer();
    }

    return `Using palette: ${current_palette}`;
}

// Shuffle draw buffer
function shuffle_buffer() {
    for (let i = _buffer_index; i < _buffer.length; i++) {
        let j = floor(random(_buffer_index, _buffer.length));
        let temp = _buffer[i];
        _buffer[i] = _buffer[j];
        _buffer[j] = temp;
    }
}

// Start recording, before recording runs new_draw(), so the function need the
// new_draw() arguments
function start_record(index_palette, random, loop_speed) {
    _recording = true;
    new_draw(index_palette, random, loop_speed);
    capturer.start();
}

// Stop the recording and saves to disc
function stop_record() {
    _recording = false;
    capturer.stop();
    capturer.save();
}

// p5js start up and update
// Setup p5js
function setup() {
    // Create canvas
    createCanvas(1080, 1080); //1920);
    // Start with the first color pallet
    new_draw(0);
}

// Draw p5js
function draw() {
    // Get colors
    fill(palettes[current_palette][1]);
    noStroke();
    // draw
    for (let i = 0; i < draw_speed; i++) {
        _new_point_carpet_buffer();
    }

    if (_recording) {
        capturer.capture(document.getElementById('defaultCanvas0'));
    }
}

// Private execution functions, you can use them from the console too
// but is not recommended
function _to_x(num) {
    return floor(num % width);
}

function _to_y(num) {
    return floor((num - (num % width)) / width);
}

function _new_point_carpet_buffer() {
    if (_buffer.length > _buffer_index) {
        const x = _to_x(_buffer[_buffer_index]);
        const y = _to_y(_buffer[_buffer_index]);

        // Draw the point if necessary
        if (_can_draw_carpet_point(x, y)) {
            ellipse(x, y, 1);
        }

        _buffer_index++;
    }
}

// Check if the point can be draw
function _can_draw_carpet_point(x, y) {
    // Can draw
    if (x === 0 || y === 0) {
        return true
    }
    // If the points is in the ignored list dont draw
    for (let remainder in ignored_remainder) {
        const [r_x, r_y] = ignored_remainder[remainder];
        if (x % base[0] === r_x && y % base[1] === r_y) {
            return false;
        }
    }
    // Recursive call
    return _can_draw_carpet_point(floor(x / base[0]), floor(y / base[1]));
}