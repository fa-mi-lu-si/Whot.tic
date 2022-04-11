// title:  game title
// author: game developer
// desc:   short description
// script: js

t = 0

width = 240
height = 136

function lerp(a, b, t) { return (1 - t) * a + t * b }

function remove(array, index) {
	//returns the array with the value at index removed
	return array.slice(0, index)
		.concat(array.slice(index + 1));
}
function shuffle(array) {
	new_array = []
	while (array.length > 0) {
		n = Math.floor(Math.random() * array.length) // random index in the stack
		new_array.push(array[n])
		array = remove(array, n)
	}
	return new_array
}

function Point(x, y) {
	return {
		x: Number(x) || 0,
		y: Number(y) || 0,
	}
}
function Point_da(dist, angle) {
	rotate_Point(Point(0, -dist), angle, Point())
}
function add_Point(a, b) {
	return Point(
		a.x + b.x,
		a.y + b.y
	)
}
function lerp_Point(a, b, t) {
	return Point(
		lerp(a.x, b.x, t),
		lerp(a.y, b.y, t)
	)
}
function rotate_Point(point, angle, origin) {
	return add_Point(
		Point(
			(point.x - origin.x) * math.cos(angle) - (point.y - origin.y) * math.sin(angle),
			(point.y - origin.y) * math.cos(angle) + (point.x - origin.x) * math.sin(angle)
		),
		origin
	)
}

Collision = {
	point_rect: function (point, rect) {
		rect.edg = add_Point(rect.pos, rect.siz)
		return (
			point.x > rect.pos.x
			&& point.x < rect.edg.x
			&& point.y > rect.pos.y
			&& point.y < rect.edg.y
		)
	},
	rect_rect: function (rect1, rect2) {
		rect1.edg = add_Point(rect1.pos, rect1.siz)
		rect2.edg = add_Point(rect2.pos, rect2.siz)
		return (
			rect1.edg.x >= rect2.pos.x
			&& rect1.pos.x <= rect2.edg.x
			&& rect1.edg.y >= rect2.pos.y
			&& rect1.pos.y <= rect2.edg.y
		)
	}
}


stack = []

suites = ["O", "#", "+", "*", "^"] // each type of card
nums = [1,2,3,4,5,7,8,10,11,12,13,14] // each possible card number
not_cards = [ // cards which shouldn't exist
	["+",4],["#",4],
	["+",8],["#",8],
	["+",12],["#",12],
	["*",10],["*",11],["*",12],["*",13],["*",14]
]
// fill the stack with all the cards
for (j = 0; j < suites.length; j++) {
	suite = suites[j]
	for (i = 0; i < nums.length; i++) {
		c = [suite, nums[i]]
        allowed = true
		// chesk if card is not allowed
        for (k = 0; k < not_cards.length; k++) {
            if (c[0] == not_cards[k][0] && c[1] == not_cards[k][1]) {
                allowed = false
            }
        }
		if (allowed) stack.push(c)
	}
}
// add the whot cards
for (i = 0; i < 5; i++) {
	stack.push(["W",20])
}
stack = shuffle(stack)


Card = function (pos) {
	this.pos = pos
	this.target_pos = pos
	this.siz = Point(8 * 3, 8 * 4)
	this.value = stack.pop()
	this.update = function () {
		if (Collision.point_rect(mouse.pos, this) && mouse.l) { // if the mouse is holding this card
			this.pos = add_Point(mouse.pos, Point(-8, -8))
		} else if (Collision.point_rect(mouse.pos, this)) {
			this.pos.y = this.target_pos.y - 8
		} else {
			this.pos = lerp_Point(this.pos, this.target_pos, 0.07)
		}
	}
	this.draw = function () {
		map(30, 0, 3, 4, this.pos.x, this.pos.y, 2)
		font(
			this.value[0] + "\n" + this.value[1],
			this.pos.x + 4, this.pos.y + 3,
			0, 5, 8, false, 1
		)
	}
}
start_cards_length = 6 // the number of cards each player starts with

cards = []

for (i = 0; i < start_cards_length; i++) {
	cards.push(
		new Card(Point(45 + (i * 16), 77+i))
	)
}

mouse = {
	fetch: mouse, // [x,y,l,m,r,sx,sy]
	image: 9,
	pos: Point(),
	l: false,
	m: false,
	r: false,
	scroll: Point(),
	update: function () {
		data = this.fetch()
		this.pos = Point(data[0], data[1])
		this.l = data[2]
		this.m = data[3]
		this.r = data[4]
		this.scroll = Point(data[5], data[6])

		poke(0x03ffb, this.image)
	}
}

function TIC() {
	cls(2)
	poke(0x03FF8, 2)
	map() //draw the board background

	mouse.update()
	// update all cards
	for (i = 0; i < cards.length; i++) {
		cards[i].update()
	}

	//draw all cards
	for (i = 0; i < cards.length; i++) {
		cards[i].draw()
	}
	t++
}
