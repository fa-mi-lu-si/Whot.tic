// title:  game title
// author: game developer
// desc:   short description
// script: js

t = 0

width = 240
height = 136

function lerp(a, b, t) { return (1 - t) * a + t * b }
function pal(c0, c1) {
	if (c0 == undefined && c1 == undefined) {
		for (i = 0; i <= 15; i++) {
			poke4(0x3FF0 * 2 + i, i)
		}
	}
	else poke4(0x3FF0 * 2 + c0, c1)
}

function remove(array, index) {
	//returns the array with the value at index removed
	return array.slice(0, index)
		.concat(array.slice(index + 1));
}
function shuffle(array) {
	new_array = []
	while (array.length > 0) {
		n = Math.floor(Math.random() * array.length) // random index in the pile
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


pile = [] // the pile which the players draw from

suites = ["O", "#", "+", "*", "^"] // each type of card
nums = [1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14] // each possible card number
not_cards = [ // cards which shouldn't exist
	["+", 4], ["#", 4],
	["+", 8], ["#", 8],
	["+", 12], ["#", 12],
	["*", 10], ["*", 11], ["*", 12], ["*", 13], ["*", 14]
]
// fill the pile with all the cards
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
		if (allowed) pile.push(c)
	}
}
// add the whot cards
for (i = 0; i < 5; i++) {
	pile.push(["W", 20])
}
pile = shuffle(pile)

draw_button = new Button(
	Point(width / 3, (height / 3) + 6), "D",
			function () {players[current_player].push(new Card());change_player = true}
)

function Card() {
	this.pos = add_Point(draw_button.pos, Point(0, 26))
	this.target_pos = Point(0, 0)
	this.siz = Point(8 * 3, 8 * 4)
	this.value = pile.pop()
	this.update = function (index,active) {
		if (active ==  false) {
			this.pos = lerp_Point(this.pos, this.target_pos, 0.07)
			return
		}
		if (Collision.point_rect(mouse.pos, this) && (mouse.hovering == null || mouse.hovering == index)) { // if the mouse is over
			mouse.hovering = index

			if (mouse.l) {
				this.pos = add_Point(mouse.pos, Point(-8, -8))
			} else {
				if (Collision.rect_rect(this, stack_button)) {
					stack_button.add(this.value)
				}
				this.pos.y = this.target_pos.y - 16
			}
		} else {
			this.pos = lerp_Point(this.pos, this.target_pos, 0.07)
		}
	}

	this.draw = function (show) {
		map(show ? 30 : 33, 0, 3, 4, this.pos.x, this.pos.y, 2)
		if (show) font(
			this.value[0] + "\n" + this.value[1],
			this.pos.x + 5, this.pos.y + 4,
			0, 5, 8, false, 1
		)
	}
}
function align_cards(array, pos) {
	w = 96
	for (i = 0; i < array.length; i++) {
		array[i].target_pos = Point(
			pos.x + ((i / array.length) * w),
			pos.y
		)
	}
}

players = [ // cards held by each player
	[],
	[]
]
current_player = 1
change_player = false

for (j = 0; j < players.length; j++) {
	for (i = 0; i < 6; i++) {
		players[j].push(
			new Card()
		)
	}
}

stack = [ // the pile which players add to
	pile.pop()
]
// the stack can't start with whot
while (stack[0][0] == "W") {
	pile.unshift(stack.pop())
	stack.push(pile.pop())
}
remove_value = null
stack_button = {
	pos: Point((width * (2 / 3)) - 4, (height / 3)),
	siz: Point(8 * 3, 8 * 4),
	add: function (value) {
		top_card = stack[stack.length - 1]
		if (value[0] == top_card[0] || value[1] == top_card[1]) {
			stack.push(value)
			remove_value = value // value of card to be removed
			change_player = true
			return true
		} else {
			return false
		}
	},
	update: function () {
		if (remove_value) {
			for (i = 0; i < players[current_player].length; i++) {
				if ((players[current_player][i].value[0] == remove_value[0]) && (players[current_player][i].value[1] == remove_value[1])) {
					players[current_player] = remove(players[current_player], i)
				}
			}
		}
		remove_value = null // reset the value for the next frame
	},
	draw: function () {
		map(30, 0, 3, 4, this.pos.x, this.pos.y, 2)
		font(
			stack[stack.length - 1][0] + "\n" + stack[stack.length - 1][1],
			this.pos.x + 5, this.pos.y + 4
		)
	}
}

function Button(pos, label, callback) {
	this.pos = pos
	this.label = label
	this.callback = callback // function which is called when pressed
	this.siz = Point(8 * 2, 8 * 2)
	this.pressed = false
	this.update = function () {
		if (Collision.point_rect(mouse.pos, this)) mouse.image = 8
		this.just_pressed = (this.pressed == false && Collision.point_rect(mouse.pos, this) && mouse.l)

		if (this.just_pressed) {
			this.callback()
			this.pressed = true
		}

		if (this.pressed) {
			mouse.image = 7
			if (mouse.l == false) this.pressed = false
		}
	}
	this.draw = function () {
		spr(this.pressed ? 94 : 92, this.pos.x, this.pos.y, 2, 1, 0, 0, 2, 2)
		pal(1, 0)
		font(this.label, this.pos.x + 4, this.pos.y + (this.pressed ? 6 : 4))
		pal()
	}
}


mouse = {
	fetch: mouse,
	image: 9,
	pos: Point(),
	l: false,
	m: false,
	r: false,
	hovering: false,
	scroll: Point(),
	update: function () {
		data = this.fetch() // [x,y,l,m,r,sx,sy]
		this.pos = Point(data[0], data[1])
		this.l = data[2]
		this.m = data[3]
		this.r = data[4]
		this.scroll = Point(data[5], data[6])

		this.hovering = null
	},
	image_update: function () {
		if (!this.image) this.image = (this.hovering && this.l) ? 10 : 9
		poke(0x03ffb, this.image)
		this.image = false // reset to default
	}
}

function TIC() {
	cls(2)
	poke(0x03FF8, 2)
	map() //draw the board background

	mouse.update()
	draw_button.update()
	// update all cards
	for (j = 0; j < players.length; j++) {
		for (i = 0; i < players[j].length; i++) {
			players[j][i].update(i,j==current_player)
		}
	}

	stack_button.update()
	align_cards(players[0], Point(32, 102))
	align_cards(players[1], Point(94, 5))
	if (change_player) {
		current_player = (current_player + 1) % players.length
		change_player = false
	}

	mouse.image_update()
	map(33, 0, 3, 4, draw_button.pos.x - 4, draw_button.pos.y - 6, 2)
	draw_button.draw()
	stack_button.draw()
	//draw all cards
	for (j = 0; j < players.length; j++) {
		for (i = 0; i < players[j].length; i++) {
			players[j][i].draw(j == current_player)
		}
	}

	t++
}
