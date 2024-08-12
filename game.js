// title:   WHOT
// author:  Samuel Familusi
// desc:    An eights style card game
// site:    https://fa-mi-lu-si.itch.io
// version: 0.1
// script:  js
// saveid: whot

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
	"211e20555568a0a08be9efec",
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


function Button(pos, label, callback, onRelease,shortCutCode) {
	this.pos = pos
	this.label = label
	this.callback = callback
	this.onRelease = onRelease || function(){}
	this.shortCutCode = shortCutCode || false
	this.pressType = false

	this.width = Math.max(font(label,240) + 7,11)
	this.siz = Point(this.width, 8 * 2)

	// first parameter of update is passed into callback
	this.update = function (params) {

		hover =
			Collision.pointRect(mouse.pos, this)
			&& !mouse.hovering

		if (hover) mouse.image = 8

		if (this.pressType == false && mouse.l && hover) {
			sfx(5)
			this.callback(params)
			this.pressType = "mouse"
		}

		if (this.shortCutCode && keyp(this.shortCutCode)) {
			sfx(5)
			this.callback(params)
			this.pressType = "key"
		}

		if (this.pressType == "mouse") {
			mouse.image = 7
			mouse.hovering = true
			if (mouse.l == false || !Collision.pointRect(mouse.pos, this)) {
				sfx(10,"E-5",-1,2)
				this.onRelease()
				this.pressType = false
				mouse.hovering = false
			}
		} else if (this.pressType == "key") {
			if (key(this.shortCutCode) == false) {
				sfx(10,"E-5",-1,2)
				this.onRelease()
				this.pressType = false
			}
		}

	}
	this.draw = function () {
		spr(
			this.pressType ? 94 : 92,
			this.pos.x, this.pos.y,
			4, 1, 0, 0, 1, 2
		)
		for (i = 1; i < Math.floor(this.width/8)-1; i++) {
			spr(
				this.pressType ? 91 : 90,
				this.pos.x + i*8, this.pos.y,
				4, 1, 0, 0, 1, 2
			)
		}
		if (this.width > 16)
			spr(
				this.pressType ? 87 : 86,
				this.pos.x + (Math.floor(this.width/8)-1)*8,
				this.pos.y,
				4, 1, 0, 0, 1, 2
			)
		spr(
			this.pressType ? 95 : 93,
			this.pos.x + this.width - 8, this.pos.y,
			4, 1, 0, 0, 1, 2
		)
		pal(1, 0)
		textWidth = font(label,0,137)
		font(
			this.label,
			this.pos.x + Math.ceil((this.width - textWidth)/2),
			this.pos.y + (this.pressType ? 5 : 3)
		)
		pal()
	}
}

function Lever(pos, label, callback) {
	this.pos = pos
	this.label = label
	this.state = false // is the button on or off
	this.callback = callback || function(){}

	this.bt = new Button(
		pos,"",
		function (lev) {
			lev.state = !lev.state
			lev.callback()
		},function () {
			sfx(11,"E-5",-1,2)
		}
	)
	this.bt.siz = Point(16,8)

	this.update = function () {
		this.bt.pos = this.pos
		this.bt.update(this)
	}

	this.draw = function () {
		spr(
			this.state ? 84 : 100,
			this.pos.x,this.pos.y,
			4,1,0,0,2,1
		)
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
			if (mainMenu.active && mainMenu.text == null) {
				this.pos = lerpPoint(this.pos, Point(width/2,height/2), 0.07,2)
			} else {
				this.pos = lerpPoint(this.pos, this.targetPos, 0.07,2)
			}
			return
		}
		if (
			Collision.pointRect(mouse.pos, this)
			&& (mouse.hovering == null || mouse.hovering === index)
		) {
			mouse.hovering = index
			mouse.image = 11

			if (mouse.l) {
				this.pos = addPoint(mouse.pos, Point(-8, -8))
				mouse.image = 10
			} else {
				if (Collision.rectRect(this, stackButton)) {
					success = stackButton.add(this.value)
					if (!success) {
						this.pos.x = this.targetPos.x
					}
				} else if (stackButton.trying == this.value) {
					stackButton.trying = ""
				}
				if (this.pos.x == this.targetPos.x) {
					this.pos.y = this.targetPos.y + (hoverUp? -16:16)
				}
			}
		} else {
			this.pos = lerpPoint(this.pos, this.targetPos, 0.07,2)
		}
	}

	this.draw = function (show) {
		map(show ? 30 : 33, 0, 3, 4, this.pos.x, this.pos.y, 4)
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
			// check if card is not allowed
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
	Point(width/3, height/3 + 21), "D",
		function () {
			
			if (pile.length == 0) {
				return
			}

			players[currentPlayer].push(new Card())
			drawButton.count += 1
			if (drawButton.count > 3) {
				noteCount = 49
			}
			sfx(6)
		},
		function () {
			changePlayer = true
		},
		4
)
// how many times has the drawbutton been pressed in a row
drawButton.count = 0

stackButton = {
	pos: Point((width * (2 / 3)) - 4, (height / 3) + 15),
	siz: Point(8 * 3, 8 * 4),
	demand : "",
	trying : "",// card over the button but not accepted
	add: function (value) {
		if (whotMenu.active) return

		if (value[0] == "W") {
			sfx(4)
			stack.push(value)
			this.demand = ""
			this.trying = ""
			removeValue = value // value of card to be removed

			// only open the whot menu if this isn't the last card
			if (players[currentPlayer].length > 1) {
				whotMenu.active = true
				whotMenu.pos = addPoint(playMenu.pos,Point(-8,0))
			}
			return true
		}

		if (stack.length == 0) {
			sfx(0,noteCount)
			drawButton.count = 0 // reset the draw button count
			noteCount++
			stack.push(value)
			removeValue = value // value of card to be removed
			this.demand = ""
			this.trying = ""
			changePlayer = true
			return true
		}

		topCard = stack[stack.length - 1]
		if (
			/* compare the shape with the demanded shape
			(if one exists), otherwise the top card */
			(value[0] == (this.demand || topCard[0]))
			/* if the shapes are different
			try comparing the number , but only if
			no specific shape has been demanded
			*/
			|| (!this.demand && (value[1] == topCard[1]))
		) {
			sfx(0,noteCount)
			drawButton.count = 0 // reset the draw button count
			noteCount++
			stack.push(value)
			removeValue = value // value of card to be removed
			this.demand = ""
			this.trying = ""
			changePlayer = true
			return true
		}
		// if the card does not match
		if (this.trying != value) sfx(3)
		this.trying = value
		return false
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
						sfx(1)
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
				// align the icon
				this.pos.x + 5
				+ (this.demand == "#" ? 2 : (this.demand == "+" ? 1 : 0)),
				this.pos.y + 4,
				undefined,undefined,undefined,false,2
			)
		} else if (stack.length > 0) {
			font(
				 stack[stack.length - 1][0] + "\n"
				+stack[stack.length - 1][1],
				this.pos.x + 5, this.pos.y + 4
			)
		} else {
			font(
				"?",
				this.pos.x + 5, this.pos.y + 4,
				undefined,undefined,undefined,false,2
			)
		}
	}
}

noteCount = 48
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

		if (!(whotMenu.active||mainMenu.active)) drawButton.update()
		stackButton.update()
	},
	draw : function () {
		map(31,18,10,7,this.pos.x,this.pos.y,4)
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
			sfx(7)
		}
	},
	update : function () {
		this.pos = Point(playMenu.pos.x - 8, playMenu.pos.y)

		for (i in this.buttons) {
			this.buttons[i].pos = addPoint(this.pos,Point(4 + 18*i,8*3))
			if (!mainMenu.active && whotMenu.active) {
				this.buttons[i].update()
			}
		}
	},
	draw : function () {
		map(31,5,12,6,this.pos.x,this.pos.y,4)
		for (i in this.buttons) {
			this.buttons[i].draw()
		}
		font(
			stackButton.demand ?
				stackButton.demand + " Chosen"
			:
				"Choose a suit",
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
				sfx(11,"E-5",-1,2)
			}
		)
	)
	whotMenu.buttons[i].width = 17 // makes them easier to align
}

mainMenu = {
	pos : Point(width/2 - 8*6,height/2 - 8*7),
	siz : Point(8*12,8*14),
	active : true,
	text : "start", // shown at the top of the menu, null for default
	startNewButton : new Button(
		Point(),
		"New game",
		function () {
			initialiseGame()
			noteCount = 49
			sfx(1)
		},
		function () {
			mainMenu.active = false
			mainMenu.text = null
		},
		48
	),
	darkModeLever : new Lever(
		Point(),
		'',
		function () {
			pmem(0,!pmem(0))
		}
	),
	update : function () {
		this.darkModeLever.label = this.darkModeLever.state ? "{" : "*"
		if (
			!Collision.pointRect(mouse.pos,this)
			&& !Collision.pointRect(mouse.pos,menuButton)
			&& this.text === null
			&& mouse.l
		) {
			this.active = false
		}

		if (this.active) {
			this.pos = lerpPoint(this.pos, Point(width/2 - 8*6,height/2 - 8*7), 0.07,2)
			this.startNewButton.update()
			this.darkModeLever.update()
		}  else {
			this.pos = lerpPoint(this.pos, Point(width/2 - 8*6,height + 10), 0.07,2)
		}

		this.startNewButton.pos = addPoint(this.pos,Point(15,8*11))
		this.darkModeLever.pos = addPoint(this.pos,Point(18,8*9.5))
	},
	draw : function () {
		map(44,5,12,14,this.pos.x,this.pos.y,4)
		if (this.text == "start") {
			font(
				"WHOT?\n~~~~~",
				this.pos.x + 29,this.pos.y + 12
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
		this.darkModeLever.draw()
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
		if (mainMenu.darkModeLever.state) this.image += 16
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
	stackButton.demand = ""
	whotMenu.active = false

	pile = createPile() // fill the pile with shuffled cards
	stack = []
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
}

// remember the darkmode status
mainMenu.darkModeLever.state = pmem(0)

function TIC() {
	cls(2)
	poke(0x03FF8, 2)
	loadPalette(pallete[mainMenu.darkModeLever.state?1:0])

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

	mainMenu.update()
	whotMenu.update()
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
	mainMenu.draw()
	mouse.imageUpdate()
	t++
}
