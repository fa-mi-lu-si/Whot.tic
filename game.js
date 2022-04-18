// title:  game title
// author: game developer
// desc:   short description
// script: js

t = 0

width = 240
height = 136

function lerp(a, b, t) { return (1-t)*a + t*b }
function pal(c0, c1) {
	if (c0 == undefined && c1 == undefined) {
		for (i = 0; i <= 15; i++) {
			poke4(0x3FF0*2 + i, i)
		}
	}
	else poke4(0x3FF0*2 + c0, c1)
}

function remove(array, index) {
	//returns the array with the value at index removed
	return array.slice(0, index)
		.concat(array.slice(index+1));
}
function shuffle(array) {
	newArray = []
	while (array.length>0) {
		n = Math.floor(Math.random() * array.length) // random index
		newArray.push(array[n])
		array = remove(array, n)
	}
	return newArray
}

function Point(x, y) {
	return {
		x: Number(x) || 0,
		y: Number(y) || 0,
	}
}
function PointDistAngle(dist, angle) {
	rotatePoint(Point(0, -dist), angle, Point())
}
function addPoint(a, b) {
	return Point(
		a.x+b.x,
		a.y+b.y
	)
}
function lerpPoint(a, b, t, round) {
	c = Point(
		lerp(a.x, b.x, t),
		lerp(a.y, b.y, t)
	)
	if (round && distPoint(c,b) <= round) {
		return b
	} else {
		return c
	}
}
function distPoint(a,b) {
	b= b || Point.new()
	return Math.sqrt(((b.x-a.x)*(b.x-a.x))+((b.y-a.y)*(b.y-a.y)))
}
function rotatePoint(point, angle, origin) {
	return addPoint(
		Point(
			(point.x-origin.x)*math.cos(angle)
			- (point.y-origin.y)*math.sin(angle)
		,
			(point.y-origin.y)*math.cos(angle)
			+ (point.x-origin.x)*math.sin(angle)
		),
		origin
	)
}

function Button(pos, label, callback) {
	this.pos = pos
	this.label = label
	this.callback = callback // function which is called when pressed
	this.siz = Point(8 * 2, 8 * 2)
	this.pressed = false
	this.update = function () {
		this.justPressed = (
			this.pressed == false 
			&& Collision.pointRect(mouse.pos, this)
			&& mouse.l
			&& !mouse.hovering
		)

		if (this.justPressed) {
			this.callback()
			this.pressed = true
		}

		if (this.pressed) {
			mouse.image = 7
			if (mouse.l == false) this.pressed = false
		}
	}
	this.draw = function () {
		if (Collision.pointRect(mouse.pos, this) && !mouse.hovering) mouse.image = 8
		spr(this.pressed ? 94 : 92, this.pos.x, this.pos.y, 2, 1, 0, 0, 2, 2)
		pal(1, 0)
		font(this.label, this.pos.x + 4, this.pos.y + (this.pressed ? 6 : 4))
		pal()
	}
}

function Card() {
	this.pos = addPoint(drawButton.pos, Point(0, 26))
	this.targetPos = Point(0, 0)
	this.siz = Point(8 * 3, 8 * 4)
	this.value = pile.pop()
	this.update = function (index, active, hoverDir) {
		if (active ==  false) {
			this.pos = lerpPoint(this.pos, this.targetPos, 0.07,2)
			
			return
		}
		if (
			Collision.pointRect(mouse.pos, this) // if the mouse is over
			&& (mouse.hovering == null || mouse.hovering == index)
		) {
			mouse.hovering = index

			if (mouse.l) {
				this.pos = addPoint(mouse.pos, Point(-8, -8))
			} else {
				if (Collision.rectRect(this, stackButton)) {
					stackButton.add(this.value)
				}
				this.pos.y = this.targetPos.y + (hoverDir ? -16 : 16)
			}
		} else {
			this.pos = lerpPoint(this.pos, this.targetPos, 0.07,2)
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
function alignCards(array, pos) {
	w = 96
	for (i in array) {
		array[i].targetPos = Point(
			pos.x + ((i / array.length) * w),
			pos.y
		)
	}
}

function createPile() {
	suites = ["O", "#", "+", "*", "^"] // each type of card
	nums = [1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14] // each possible card number
	notCards = [
		["+", 4], ["#", 4],
		["+", 8], ["#", 8],
		["+", 12], ["#", 12],
		["*", 10], ["*", 11], ["*", 12], ["*", 13], ["*", 14]
	]
	// fill the pile with all the cards
	for (j in suites) {
		suite = suites[j]
		for (i in nums) {
			c = [suite, nums[i]]
			allowed = true
			// chesk if card is not allowed
			for (k = 0; k < notCards.length; k++) {
				if (c[0] == notCards[k][0] && c[1] == notCards[k][1]) {
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

	return pile
}

Collision = {
	pointRect: function (point, rect) {
		rect.edg = addPoint(rect.pos, rect.siz)
		return (
			point.x > rect.pos.x
			&& point.x < rect.edg.x
			&& point.y > rect.pos.y
			&& point.y < rect.edg.y
		)
	},
	rectRect: function (rect1, rect2) {
		rect1.edg = addPoint(rect1.pos, rect1.siz)
		rect2.edg = addPoint(rect2.pos, rect2.siz)
		return (
			rect1.edg.x >= rect2.pos.x
			&& rect1.pos.x <= rect2.edg.x
			&& rect1.edg.y >= rect2.pos.y
			&& rect1.pos.y <= rect2.edg.y
		)
	}
}


pile = [] // the pile which the players draw from

pile = createPile()

drawButton = new Button(
	Point(width/3, height/3 + 21), "D",
			function () {
				players[currentPlayer].push(new Card())
				changePlayer = true
			}
)


players = [ // cards held by each player
	[],
	[]
]
currentPlayer = 0
changePlayer = false

for (j in players) {
	for (i = 0; i < 6; i++) {
		players[j].push(new Card())
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
removeValue = null
stackButton = {
	pos: Point((width * (2 / 3)) - 4, (height / 3) + 15),
	siz: Point(8 * 3, 8 * 4),
	add: function (value) {
		if (value[0] == "W") {
			whotMenu.active = true
			removeValue = value // value of card to be removed
		}
		topCard = stack[stack.length - 1]
		if (value[0] == topCard[0] || value[1] == topCard[1]) {
			stack.push(value)
			removeValue = value // value of card to be removed
			changePlayer = true
		}
	},
	update: function () {
		if (removeValue) {
			for (i = 0; i < players[currentPlayer].length; i++) {
				if (
					(players[currentPlayer][i].value[0] == removeValue[0]) 
					&& (players[currentPlayer][i].value[1] == removeValue[1])
				) {
					players[currentPlayer] = remove(players[currentPlayer], i)
				}
			}
		}
		removeValue = null // reset the value for the next frame
	},
	draw: function () {
		map(30, 0, 3, 4, this.pos.x, this.pos.y, 2)
		font(
			stack[stack.length - 1][0] + "\n" + stack[stack.length - 1][1],
			this.pos.x + 5, this.pos.y + 4
		)
	}
}

whotMenu = {
	pos : Point(width / 3, (height / 3) + 6),
	active : false,
	update : function () {
		
	},
	draw : function () {
		map(31,5,11,6,this.pos.x,this.pos.y,2)
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
	imageUpdate: function () {
		if (!this.image) this.image = (this.hovering && this.l) ? 10 : 9
		poke(0x03ffb, this.image)
		this.image = null // reset to default
	}
}

function TIC() {
	cls(2)
	poke(0x03FF8, 2)
	map() //draw the board background

	mouse.update()
	// update all cards
	for (p in players) {
		for (i in players[p]) {
			players[p][i].update(i, p==currentPlayer, p == 0)
		}
	}
	if (whotMenu.active) whotMenu.update()
	drawButton.update()
	stackButton.update()
	alignCards(players[0], Point(32, 101))
	alignCards(players[1], Point(94, 5))
	if (changePlayer) {
		currentPlayer = (currentPlayer+1) % players.length
		changePlayer = false
	}

	map(33, 0, 3, 4, drawButton.pos.x - 4, drawButton.pos.y - 6, 2)
	drawButton.draw()
	stackButton.draw()
	//draw all cards
	for (p in players) {
		for (i in players[p]) {
			players[p][i].draw(p == currentPlayer)
		}
	}
	if (whotMenu.active) whotMenu.draw()
	mouse.imageUpdate()

	t++
}
