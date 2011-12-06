// Define the views used by blokus
(function ($, _, Backbone, blokus) {
	var HelpView = Backbone.View.extend({
		render: function () {
			// Use underscore templating.
			var template = _.template($('#help-template').html());
			$(this.el).html(template());
			return this;
		}
	});

	var RegisterView = Backbone.View.extend({
		render: function () {
			var template = _.template($('#register-template').html());
			$(this.el).html(template());
			return this;
		}
	});

	var ForgotView = Backbone.View.extend({
		render: function () {
			var template = _.template($('#forgot-template').html());
			$(this.el).html(template());
			return this;
		}
	});

	var ProfileView = Backbone.View.extend({
	});

	var LobbyView = Backbone.View.extend({
		render: function () {
			var template = _.template($('#lobby-template').html());
			$(this.el).html(template());
			return this;
		}
	});

	var GameView = Backbone.View.extend({
		className: "gameboard",

		paper: undefined,
		board: undefined,

		x: undefined,
		y: undefined,
		width: undefined,
		height: undefined,
		cellXSize: undefined,
		cellYSize: undefined,
		numXCells: 20,
		xBorder: 2,
		numYCells: 20,
		yBorder: 2,


		drawPlayer: function (x, y, player) {
			this.paper.rect(x, y, 250, 110, 5).attr("fill", "#E3EEF2");
			this.paper.text(x + 8, y + 10, player.name).attr({
				"text-anchor": "start",
				"font-family": "Tahoma",
				"font-weight": "bold",
				"font-size": 14
			});
		},

		drawBoard: function (x, y, width, height) {
			// Gameboard
			//this.paper.rect(x, y, width+10, height+10, 5).attr("fill", "#GGGGGG");
			//this.paper.rect(x+5, y+5, width, height).attr("fill", "#AAAAAA");
			var numXCells = this.numXCells;
			var numYCells = this.numYCells;

			var cellXSize = width/numXCells; //Size of cell on X axis
			var cellYSize = height/numYCells; //Size of cell on Y axis

			//Init the values of the board;
			this.x = x;
			this.y = y;
			this.width = width;
			this.height = height;
			this.cellXSize = cellXSize;
			this.cellYSize = cellYSize;
			/*
			for (var i = x+5+cellXSize; i<=width+x ; i+=cellXSize) {
				this.paper.path("M"+i+","+(y+5)+"L"+i+","+(height+y+5)+"z");
			}
			for (var j = y+5+cellYSize; j<=height+y ; j+=cellYSize) {
				this.paper.path("M"+(x+5)+","+j+"L"+(x+width+5)+","+j+"z");
			}
			*/
			// Adding the contains function to the rectangles of Raphael
			_(this.paper.rect.prototype.__proto__).extend(
				{contains: function (x, y) {
								var startX = this.attrs.x;
								var startY = this.attrs.y;
								var endX = this.attrs.x + this.attrs.width;
								var endY = this.attrs.y + this.attrs.height;
								if (x >= startX && y >= startY &&
										x <= endX && y <= endY){
									return true;
								}
								else {
									return false;
								}
							}
				}
			);
			this.board = new Array(numXCells);
			for (var i=x, iBoard=0; i<width+x ; i+=cellXSize, iBoard++) {
				this.board[iBoard] = new Array(numYCells);
				for (var j = y, jBoard=0; j<height+y ; j+=cellYSize, jBoard++) {
					var cell = this.paper.rect(i, j, cellXSize - this.xBorder, cellYSize - this.yBorder);
					cell.attr("fill", "#GGG");
					this.board[iBoard][jBoard] = cell;
					//cell.mouseover(function(){this.attr("fill", "#AAA");});
					//cell.mouseout(function(){this.attr("fill", "#GGG")});
				}
			}
		},

		render: function () {
			var this_ = this,
				loading = $('<div class="loading"></div>');
			// Reset element
			$(this.el).html("").append(loading);

			this.game = new blokus.Game({ id: this.options.id });

			// Get information about the game
			this.game.fetch({
				success: function () {
					loading.fadeOut(200, function () { loading.remove(); });

					// Make the Raphael element 800 x 600 in this view
					this_.paper = Raphael(this_.el, 800, 600);

					// Player list with pieces
					var y = 30;
					this_.game.get("players").each(function (player) {
						var user = blokus.users.get(player.get("userId"));
						this_.drawPlayer(10, y, user.toJSON());
						y += 120;
					});

					this_.drawBoard(290, 10, 500, 500);
				},
				error: function (model, response) {
					var msg = '';
					if (response.status === 404) {
						loading.fadeOut(200, function () { loading.remove(); });
						msg = "This game does not exist";
					} else {
						msg = response.responseText || "An error occured";
					}
					$(this_.el).html('<div class="error">' + msg + '</div>');
				}
			});


			return this;
		}
	});

	//blokus.pieceMasters.get(3).get("data")
	function drawPiece (x, y, data, gameboard) {
		var cellSize = 25;
		var numRows = data.length;
		var numCols = data[0].length;
		var shape_set = gameboard.paper.set();
		for (var rowI = 0; rowI < numRows; rowI++){
			for (var colJ = 0; colJ <= numCols; colJ++) {
				if (data[rowI][colJ] == 1) {
					var cell = gameboard.paper.rect(x+(colJ)*cellSize, y+(rowI)*cellSize,
								cellSize, cellSize);
					cell.attr({fill:'#323'});
					shape_set.push(cell);
				}
			}
		}
		shape_set.initCoordinates = {
			x:x,
			y:y
		};
		var highlighted_set = gameboard.paper.set();
		shape_set.drag(
			function(dx,dy,x,y, e){
				//on move
				var bBox = shape_set.getBBox();
				var xMove = 0;
				var yMove = 0;
				var futureX = bBox.x + dx - shape_set.dx -1;
				var futureY = bBox.y + dy - shape_set.dy;
				var futureWidth = bBox.x + bBox.width + dx - shape_set.dx + 1;
				var futureHeigth = bBox.y + bBox.height + dy - shape_set.dy;
				if ( futureX >= 0 && futureWidth <= $(blokus.gameboard.paper.canvas).attr("width")) {
					xMove = dx - shape_set.dx;
				}
				if ( futureY >= 0 && futureHeigth <= $(blokus.gameboard.paper.canvas).attr("height")) {
					yMove = dy - shape_set.dy;
				}
				shape_set.translate(xMove, yMove);
				blokus.log(xMove, yMove);
				shape_set.dx = dx;
				shape_set.dy = dy;
				var offsets = $(gameboard.paper.canvas).position()
				// game board bounds
				var gbBounds = {
					sx: gameboard.x,
					sy: gameboard.y,
					ex: gameboard.x + gameboard.width,
					ey:gameboard.y + gameboard.height
				};
				// Check shapes to be in the gameboard
				if (bBox.x >= gbBounds.sx &&
					bBox.y >= gbBounds.sy &&
					bBox.x + bBox.width - gameboard.cellXSize < gbBounds.ex &&
					bBox.y + bBox.height - gameboard.cellYSize < gbBounds.ey) {
					var cellIndex = {
						x: Math.floor((bBox.x - gbBounds.sx)/ gameboard.cellXSize),
						y: Math.floor((bBox.y - gbBounds.sy)/ gameboard.cellYSize),
					}

					if (highlighted_set.length != 0){
						highlighted_set.forEach(function (shape) {shape.attr({"fill": "#GGG"})});
						highlighted_set = gameboard.paper.set();
					}
					for (var rowI = 0; rowI < numRows; rowI++){
						for (var colJ = 0; colJ <= numCols; colJ++) {
							if (data[rowI][colJ] == 1) {
								highlighted_set.push(gameboard.board[cellIndex.x+colJ][cellIndex.y+rowI]);
							}
						}
					}
					var cell = gameboard.board[cellIndex.x][cellIndex.y];
					highlighted_set.forEach(function (shape) {shape.attr({"fill": "#EEE"})});
					shape_set.dest_x = cell.attr("x");
					shape_set.dest_y = cell.attr("y");
				}
				else {
					shape_set.dest_x = shape_set.initCoordinates.x;
					shape_set.dest_y = shape_set.initCoordinates.y;
					if (highlighted_set.length != 0){
						highlighted_set.forEach(function (shape) {shape.attr({"fill": "#GGG"})});
						highlighted_set = gameboard.paper.set();
					}
				}
			},
			function (x, y, e){
				// on Start
				shape_set.dx = 0;
				shape_set.dy = 0;
				shape_set.animate({"opacity": 0.5}, 0);
			},
			function (x, y, e){
				// on end
				var tmp_x = shape_set.dest_x - 50;
				var tmp_y = shape_set.dest_y - 25;
				shape_set.animate({transform: "t"+tmp_x+" "+tmp_y} , 500);
				shape_set.animate({"opacity": 1}, 500);
				//shape_set.animate({transform:"r180,75,73"}, 500) //around the center of the shape set
			}
		);
		return shape_set;
	}

	_(blokus).extend({
		HelpView: HelpView,
		RegisterView: RegisterView,
		ForgotView: ForgotView,
		ProfileView: ProfileView,
		GameView: GameView,
		LobbyView: LobbyView,
		drawPiece: drawPiece,
	});
}(jQuery, _, Backbone, blokus));
