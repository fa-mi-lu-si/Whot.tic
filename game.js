// title:  game title
// author: game developer
// desc:   short description
// script: js

t = 0

const width = 240
const height = 136

function lerp(a, b, t) { return (1-t)*a + t*b }
function pal(c0, c1) {
	// swap two pallete colors
	// pal() resets to default
	if (c0 == undefined && c1 == undefined) {
		for (i = 0; i <= 15; i++) {
			poke4(0x3FF0*2 + i, i)
		}
	}
	else poke4(0x3FF0*2 + c0, c1)
}
function loadPalette(string){
	for(i=0;i<16;i++){
		poke(0x03FC0+(i*3),parseInt(string.substr(i*6,2),16));
		poke(0x03FC0+(i*3)+1,parseInt(string.substr((i*6)+2,2),16));
		poke(0x03FC0+(i*3)+2,parseInt(string.substr((i*6)+4,2),16));
	}
}

pallete = [
	"00303bff7777ffce96f1f2da",
	"7c3f58eb6b6ff9a875fff6d3",
]
for (i in pallete) {
	pallete[i] += "0".repeat(72)
}

function remove(array, index) {
	//returns the array with the value at index removed
	return array.slice(0, index)
		.concat(array.slice(index+1));
}
function shuffle(array) {
	newArray = []
	while (array.length>0) {
		// random index
		n = Math.floor(Math.random() * array.length)
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
	if (dist(c,b) <= (round || 0)) {
		return b
	} else {
		return c
	}
}
function dist(a, b) {
	b = b || Point.new()
	return Math.sqrt(
		((b.x-a.x)*(b.x-a.x))
		+((b.y-a.y)*(b.y-a.y))
	)
}


function Button(pos, label, callback, onRelease) {
	this.pos = pos
	this.label = label
	this.callback = callback
	this.onRelease = onRelease || function(){}
	this.pressed = false

	this.width = Math.max(font(label) + 7,11)
	this.siz = Point(this.width, 8 * 2)

	// first parameter of update is passed into callback
	this.update = function (params) {

		hover = 
			Collision.pointRect(mouse.pos, this)
			&& !mouse.hovering

		if (hover) mouse.image = 8

		if (
			this.pressed == false
			&& mouse.l
			&& hover
		) {
			this.callback(params)
			this.pressed = true
		}

		if (this.pressed) {
			mouse.image = 7
			mouse.hovering = true
			if (mouse.l == false) {
				this.onRelease()
				this.pressed = false
				mouse.hovering = false
			}
		}
	}
	this.draw = function () {
		spr(
			this.pressed ? 94 : 92,
			this.pos.x, this.pos.y,
			2, 1, 0, 0, 1, 2
		)
		for (i = 1; i < Math.floor(this.width/8)-1; i++) {
			spr(
				this.pressed ? 91 : 90,
				this.pos.x + i*8, this.pos.y,
				2, 1, 0, 0, 1, 2
			)
		}
		if (this.width > 16)
			spr(
				this.pressed ? 87 : 86,
				this.pos.x + (Math.floor(this.width/8)-1)*8, this.pos.y,
				2, 1, 0, 0, 1, 2
			)
		spr(
			this.pressed ? 95 : 93,
			this.pos.x + this.width - 8, this.pos.y,
			2, 1, 0, 0, 1, 2
		)
		pal(1, 0)
		font(
			this.label,
			this.pos.x + 4, this.pos.y + (this.pressed ? 5 : 3)
		)
		pal()
	}
}
function Lever(pos, label) {
	this.pos = pos
	this.label = label
	this.value = false
	this.state = false // is the button on or off

	this.bt = new Button(
		pos,"",
		function (lev) {
			lev.state = !lev.state
		}
	)
	this.bt.siz = Point(16,8)

	this.update = function () {
		this.bt.update(this)
	}

	this.draw = function () {
		spr(this.state ? 84 : 100,this.pos.x,this.pos.y,1,1,0,0,2,1)
		font(this.label,this.pos.x+18,this.pos.y)
	}
}

function Card() {
	this.pos = addPoint(drawButton.pos, Point(0, 26))
	this.targetPos = Point(0, 0)
	this.siz = Point(8 * 3, 8 * 4)
	this.value = pile.pop()
	this.update = function (index, active, hoverUp) {
		if (active ==  false) {
			this.pos = lerpPoint(this.pos, this.targetPos, 0.07,2)
			return
		}
		if (
			Collision.pointRect(mouse.pos, this) // if the mouse is over
			&& (mouse.hovering == null || mouse.hovering === index)
		) {
			mouse.hovering = index
			mouse.image = 11

			if (mouse.l) {
				this.pos = addPoint(mouse.pos, Point(-8, -8))
				mouse.image = 10
			} else {
				if (Collision.rectRect(this, stackButton)) {
					stackButton.add(this.value)
				}
				if (this.pos.x == this.targetPos.x) {
					this.pos.y = this.targetPos.y + (hoverUp ? -16 : 16)
				}
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
	w = 88
	for (i in array) {
		array[i].targetPos = Point(
			pos.x + ((i / array.length) * w),
			pos.y
		)
	}
}

// each type of card
const suits = ["O", "#", "+", "*", "^"]
// each possible card number
const nums = [1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14]
const notCards = [
	["+", 4], ["#", 4],
	["+", 8], ["#", 8],
	["+", 12], ["#", 12],
	["*", 10], ["*", 11], ["*", 12], ["*", 13], ["*", 14]
]
function createPile() {
	p = []
	// fill the pile with all the cards
	for (j in suits) {
		suit = suits[j]
		for (i in nums) {
			c = [suit, nums[i]]
			allowed = true
			// chesk if card is not allowed
			for (k = 0; k < notCards.length; k++) {
				if (
					c[0] == notCards[k][0]
					&& c[1] == notCards[k][1]
				) {
					allowed = false
				}
			}
			if (allowed) p.push(c)
		}
	}
	// add the whot cards
	for (i = 0; i < 5; i++) {
		p.push(["W", 20])
	}
	p = shuffle(p)
	return p
}

const Collision = { 
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

drawButton = new Button(
	Point(
		width/3, height/3 + 21), "D",
		function () {
			players[currentPlayer].push(new Card())
		},
		function () {
			changePlayer = true
		}
)

stackButton = {
	pos: Point((width * (2 / 3)) - 4, (height / 3) + 15),
	siz: Point(8 * 3, 8 * 4),
	demand : "",
	add: function (value) {
		if (whotMenu.active) return
		
		if (value[0] == "W") {
			stack.push(value)
			this.demand = ""
			removeValue = value // value of card to be removed
			// only open the whot menu if this isn't the last card
			if (players[currentPlayer].length > 1) {
				whotMenu.active = true
				whotMenu.pos = addPoint(playMenu.pos,Point(-8,0))
			}
			return
		}

		topCard = stack[stack.length - 1]
		if (
			value[0] == (this.demand || topCard[0])
			|| (!this.demand && (value[1] == topCard[1]))
		) {
			stack.push(value)
			removeValue = value // value of card to be removed
			this.demand = ""
			changePlayer = true
		}
	},
	update: function () {
		if (removeValue) {
			found = false
			for (i = 0; i < players[currentPlayer].length; i++) {
				if (
					!found
					&& (players[currentPlayer][i].value[0] == removeValue[0]) 
					&& (players[currentPlayer][i].value[1] == removeValue[1])
				) {
					found = true
					players[currentPlayer] = remove(players[currentPlayer], i)
					if (players[currentPlayer].length == 0) {
						mainMenu.active = true
						// set the menu text
						mainMenu.text = "Player " + currentPlayer
					}
				}
			}
		}
		removeValue = null // reset the value for the next frame
	},
	draw: function () {
		if (this.demand) {
			font(
				this.demand,
				this.pos.x + 5, this.pos.y + 4,
				undefined,undefined,undefined,false,2
			)
		} else if (stack.length > 0) {
			font(
				stack[stack.length - 1][0] + "\n" + stack[stack.length - 1][1],
				this.pos.x + 5, this.pos.y + 4
			)
		}
	}
}

playMenu = {
	targetPos : Point(8*10,8*5),
	pos : Point(8*10,height+1),
	update : function () {
		if (mainMenu.active) {
			this.targetPos = Point(8*10,height+1)
		} else {
			this.targetPos = Point(
				20 + (currentPlayer == 0 ? 0 : width/2),
				8*5 + (currentPlayer == 0 ? -16 : 16)
			)
		}
		this.pos = lerpPoint(this.pos,this.targetPos,0.2)

		drawButton.pos = addPoint(this.pos,Point(8*1.5 ,8*2 +6))
		stackButton.pos = addPoint(this.pos,Point(8*6,8*2))

		if (!whotMenu.active) drawButton.update()
		stackButton.update()
	},
	draw : function () {
		map(31,18,10,7,this.pos.x,this.pos.y)
		drawButton.draw()
		stackButton.draw()
	}
}

whotMenu = {
	pos : Point(width / 3, (height / 3) + 6),
	titleBar : {
		pos : Point(width / 3, (height / 3) + 6),
		siz : Point(8*12,8),
		held : false
	},
	active : false,
	buttons : [],
	buttonFunction : function (suit) {
		return function () {
			stackButton.demand = suit
		}
	},
	update : function () {
		this.titleBar.pos = this.pos
		if (Collision.pointRect(mouse.pos,this.titleBar)) {
			mouse.image = 11
			if (this.titleBar.held && !mouse.l) mouse.hovering = false
			this.titleBar.held = mouse.l
		}
		if (this.titleBar.held) {
			mouse.hovering = true
			this.pos = addPoint(mouse.pos,Point(-48,-4))
			mouse.image = 10
		}

		for (i in this.buttons) {
			this.buttons[i].pos = addPoint(this.pos,Point(4 + 18*i,8*3))
			this.buttons[i].update()
		}
	},
	draw : function () {
		map(31,5,12,6,this.pos.x,this.pos.y)
		for (i in this.buttons) {
			this.buttons[i].draw()
		}
		font(
			stackButton.demand ? stackButton.demand + " Chosen" :"Choose a suit",
			this.pos.x + 4, this.pos.y + 12
		)
	}
}
for (i in suits) {
	whotMenu.buttons.push(
		new Button(
			Point(),suits[i],
			whotMenu.buttonFunction(suits[i]),
			function(){
				whotMenu.active = false
				changePlayer = true
			}
		)
	)
	whotMenu.buttons[i].width = 16 // makes them easier to align
}

mainMenu = {
	pos : Point(width/2 - 8*6,height/2 - 8*7),
	active : true,
	text : "start", // shown at the top of the menu, null for default
	startNewButton : new Button(
		Point(width/2 - 8*6 + 15, 8*4 + height/2),
		"New game",
		function () {
			initialiseGame()
		},
		function () {
			mainMenu.active = false
			mainMenu.text = null
		}
	),
	colorSwitch : new Lever(
		Point(width/2 - 8*6 + 4,8*2.5 + height/2),
		"Colour"
	),
	update : function () {
		this.startNewButton.update()
		this.colorSwitch.update()
	},
	draw : function () {
		map(44,5,12,14,this.pos.x,this.pos.y)
		if (this.text == "start") {
			font(
				"WHOT \n~~~~~~",
				this.pos.x + 21,this.pos.y + 12
			)
		} else if (this.text != null) {
			font(
				this.text + "\n wins !",
				this.pos.x + 21,this.pos.y + 12
			)
		} else {
			// when the main menu is opened during gameplay
		}
		this.startNewButton.draw()
		this.colorSwitch.draw()
	}
}
menuButton = new Button(
	Point(4,4),
	"=",
	function () {
		mainMenu.active = !mainMenu.active
	}
)

mouse = {
	fetch: mouse,
	image: 9,
	pos: Point(),
	l: false,
	m: false,
	r: false,
	hovering: null,
	scroll: Point(),
	update: function () {
		data = this.fetch() // [x,y,l,m,r,sx,sy]
		this.pos = Point(data[0], data[1])
		this.l = data[2]
		this.m = data[3]
		this.r = data[4]
		this.scroll = Point(data[5], data[6])

		this.hovering = this.hovering === true ? true : null
	},
	imageUpdate: function () {
		this.image = this.image || 9
		if (mainMenu.colorSwitch.state) this.image += 16
		poke(0x03ffb, this.image)
		this.image = null // reset to default
	}
}

pile = []
stack = []
players = [ // cards held by each player
	[],
	[]
]
currentPlayer = 0
changePlayer = false
removeValue = null

function initialiseGame() {
	currentPlayer = Math.round(Math.random())
	changePlayer = false
	removeValue = null

	pile = createPile() // fill the pile with shuffled cards
	stack = [
		pile.pop() // add a card to start the stack
	]
	players = [
		[],
		[]
	]
	
	// give each player 6 cards
	for (j in players) {
		for (i = 0; i < 6; i++) {
			players[j].push(new Card())
		}
	}
	// the stack can't start with whot
	while (stack[0][0] == "W") {
		pile.unshift(stack.pop())
		stack.push(pile.pop())
	}
}


function TIC() {
	cls(2)
	poke(0x03FF8, 2)
	loadPalette(pallete[mainMenu.colorSwitch.state?1:0])

	if (whotMenu.active || mainMenu.active) {
		map(0,17) //draw the secondary background
	} else {
		map() //draw the board background
	}

	mouse.update()

	if (pile.length == 0 && mainMenu.text != "start") {
		/* Move all cards, except the last
		from the stack into the pile
		then shuffle them*/
		pile = shuffle(stack.slice(0,stack.length-1))
		stack = [stack[stack.length-1]]
	}

	// update all cards
	for (p in players) {
		for (i in players[p]) {
			players[p][i].update(
				i,
				(whotMenu.active || mainMenu.active) ? false : p==currentPlayer,
				p == 0
			)
		}
	}
	
	if (mainMenu.text === null) menuButton.update()

	if (mainMenu.active) {
		mainMenu.update()
		
	} else if (whotMenu.active) {
		whotMenu.update()
	}
	playMenu.update()

	alignCards(players[0], Point(8, 101))
	alignCards(players[1], Point(126, 5))
	if (changePlayer) {
		currentPlayer = (currentPlayer+1) % players.length
		changePlayer = false
	}

	menuButton.draw()
	if (!whotMenu.active) playMenu.draw()
	//draw all cards
	for (p in players) {
		for (i in players[p]) {
			players[p][i].draw(mainMenu.active ? false : p == currentPlayer)
		}
	}
	if (whotMenu.active) whotMenu.draw()
	if (mainMenu.active) mainMenu.draw()
	mouse.imageUpdate()

	t++
}
