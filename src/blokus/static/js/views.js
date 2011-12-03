// Define the views used by blokus
(function ($, _, Backbone) {
	var GameBoard = Backbone.View.extend({
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
		numYCells: 20,


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
					var cell = this.paper.rect(i, j, cellXSize-2, cellYSize-2);
					this.board[iBoard][jBoard] = cell;
					//cell.onDragOver(function (elem){console.log("tmp");});
					cell.mouseover(function(){this.attr("fill", "#AAA");});
					cell.mouseout(function(){this.attr("fill", "#GGG")});
				}
			}
		}, 

		render: function () {
			var this_ = this;
			// Reset element
			$(this.el).html("");

			// Make the Raphael element 800 x 600 in this view
			this.paper = Raphael(this.el, 800, 600);

			// Player list with pieces
			var y = 30;
			this.options.game.get("players").each(function (player) {
				var user = blokus.users.get(player.get("userId"));
				this_.drawPlayer(10, y, user.toJSON());
				y += 120;
			});

			this.drawBoard(290, 10, 500, 500);

			return this;
		}
	});

	var GameList = Backbone.View.extend({
		tagName: "url",
		className: "lobbylist",

		$items: undefined,

		render: function () {
			var this_ = this,
				$el = $(this.el);

			this.$items = [];

			// Reset element
			$el.html("");

			// Render li tag for each game
			$.fn.append.apply($el, this.options.games.map(function (game) {
				var $item = this_.$items[game.get("id")] = $('<li><a href="javascript:;">' + 
					game.get("name") + '</a></li>');
				
				$item.click(function () {
					this_.selectItem(game);
				});

				return $item;
			}));

			return this;
		},

		selectItem: function (game) {
			var $item = this.$items[game.get("id")];
			$item.find("a").addClass("sel");
			$item.siblings().find("a").removeClass("sel");
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
		shape_set.drag(
				function(dx,dy,x,y, e){
					//on move
					shape_set.translate(dx - shape_set.x, dy - shape_set.y) ;
					shape_set.x = dx;
					shape_set.y = dy;
					//console.log(x,y, e.layerX, e.layerY,x - blokus.gameboard.paper.canvas.offsetLeft);
				},
				function (x, y, e){
					// on Start
					shape_set.x = 0;
					shape_set.y = 0;
				}, 
				null
				);

	}

	_(window.blokus).extend({
		GameBoard: GameBoard,
		GameList: GameList,
		drawPiece: drawPiece,
	});
}(jQuery, _, Backbone));
