// Set up variables
// Amount of loops per draw call, a big number can make framerate to drop
let loops = 500;

// How much the loops variable increase between draw calls
let increase_loop = 1;

// Corners
let points_carpet = {
    big: [[0, 0], [1080, 1080]],
}

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

// Use random
let use_random = false;

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
    console.log('Available functions:\n' +
        'Help() -> Print this help\n' +
        'push_color_pallet(base, accent) -> Add a new color pallet (base: [0 <= r <= 255, 0 <= g <= 255, 0 <= b <= 255], accent: [0 <= r <= 255, 0 <= g <= 255, 0 <= b <= 255])\n' +
        'push_ignore_remainder(r_x, r_y) -> Add new ignore remainder\n' +
        'pop_ignore_remainder(index) -> Add remove ignore remainder\n' +
        'new_base(b_x, b_y) -> Create a new base\n' +
        'new_drawnew_draw(index_palette, loop_speed?) -> Clear screen and select new color pallet\n' +
        '\n' +
        'Variables:\n' +
        'loop -> Amount of loops per draw call, a big number can make framerate to drop\n' +
        'increase_loop -> How much the loops variable increase between draw calls\n' +
        'palettes -> colors palettes\n' +
        '\n' +
        'How to record:\n' +
        'start_record(loop_speed?, new_increase_loop?)\n' +
        'stop_record()\n' +
        '\n');
}

help();

// Function to update variables, this functions can be call through the console

// Add a new color pallet
// base: [0 <= r <= 255, 0 <= g <= 255, 0 <= b <= 255]
// accent: [0 <= r <= 255, 0 <= g <= 255, 0 <= b <= 255]
function push_color_pallet(base, accent) {
    palettes.push([base, accent]);
    return `New color pallet added, index: ${palettes.length - 1}`;
}

// Add new ignore remainder
function push_ignore_remainder(r_x, r_y) {
    if (!r_x || r_x < 1 || !r_y || r_y < 1) {
        return `Error: r_x and r_y must be grater than 1`
    }
    ignored_remainder.push([r_x, r_y]);
    new_draw(current_palette);
    return ignored_remainder;
}

// Add remove ignore remainder
function pop_ignore_remainder(index) {
    ignored_remainder.splice(index, 1);
}

// Create a new base
function new_base(b_x, b_y) {
    if (!b_x || b_x < 1 || !b_y || b_y < 1) {
        return `Error: b_x and b_y must be grater than 1`
    }
    base = [b_x, b_y]
    new_draw(current_palette);
    return base;
}

// Public sketch functions

// Clear screen and select new color pallet
function new_draw(index_palette, loop_speed) {
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
    loops = loop_speed || loops;

    // create buffer
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            _buffer[(y * width) + x] = (y * width) + x;
        }
    }
    _shuffle_buffer();
    _buffer_index = 0

    return `Using palette: ${current_palette}`;
}

function start_record(loop_speed, new_increase_loop) {
    loops = loop_speed || loops;
    increase_loop = new_increase_loop || increase_loop;
    _recording = true;
    new_draw();
    capturer.start();
}

function stop_record() {
    _recording = false;
    capturer.stop();
    capturer.save();
}

// p5js start up and update
// Setup p5js
function setup() {
    // Create canvas
    createCanvas(1080, 1035); //1920);
    // Start with the first color pallet
    new_draw(0);
}

// Draw p5js
function draw() {
    fill(palettes[current_palette][1]);
    noStroke();
    // Draw 500 frames in one
    for (let i = 0; i < loops; i++) {
        if (use_random) {
            _new_point_carpet_random('big');
        } else {
            _new_point_carpet_buffer();
        }
    }

    loops = min(loops * increase_loop, 1000);

    if (_recording) {
        capturer.capture(document.getElementById('defaultCanvas0'));
    }
}

// Private execution functions, you can use them from the console too

// Draw a new random point
function _new_point_carpet_random(quadrant) {
    // Select limits of the drawing
    const top_left_corner = points_carpet[quadrant][0];
    const bot_down_corner = points_carpet[quadrant][1];

    // Select random point
    const x = floor(random(top_left_corner[0] + 1, bot_down_corner[0] + 1));
    const y = floor(random(top_left_corner[1] + 1, bot_down_corner[1] + 1));

    // Draw the point if necessary
    if (_can_draw_carpet_point(x, y)) {
        ellipse(x, y, 1);
    }
}

function _to_x(num) {
    return floor(num % width);
}

function _to_y(num) {
    return floor((num - (num % width)) / width);
}

function _shuffle_buffer() {
    for (let r = 0; r < 20; r++) {
        for (let i = _buffer.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            let temp = _buffer[i];
            _buffer[i] = _buffer[j];
            _buffer[j] = temp;
        }
    }
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