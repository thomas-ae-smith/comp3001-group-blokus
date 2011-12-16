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
			var this_ = this,
				template = _.template($('#lobby-template').html());
			
			$(this.el).html(template());

			this.$(".modelist li").click(function (e) {
				// Which one has been selected?
				var $button = $(e.currentTarget),
					mode = $button.index();
				
				$button.addClass("sel")
					.siblings().removeClass("sel");
		        
		        if (mode == 3) {
		            this_.$("#privatelobby").slideDown();
		        } 
		        else {
		            this_.$("#privatelobby").slideUp();
		        }
			});

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
                /*_(this.paper.rect.prototype.__proto__).extend(
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
                );*/
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

                    //Temp just show that I can draw things
                    var data = window.data = blokus.pieceMasters.get(3).get("data");
                    window.shapeSet = drawPiece(50,23,data, this_);
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

	function rotateMatrix(data, rotation){
		rotation = Math.abs(rotation % 4);
		var rotatedData = _(data).clone();
		for (var numRotation  = 0; numRotation < rotation; numRotation++){
			var rotatedDataTmp = new Array();
			var numRows = rotatedData.length;
			var numCols = rotatedData[0].length;
			for (var colJ = numCols-1; colJ >= 0 ; colJ--) {
				var reverseCol = Array();
				for (var rowI = 0; rowI < numRows; rowI++){
					reverseCol.push(rotatedData[rowI][colJ]);
				}
				rotatedDataTmp.push(reverseCol);
			}
			rotatedData = _(rotatedDataTmp).clone();
		}
		return rotatedData;
	}

    function drawPiece (x, y, data, gameboard) {
		var cellSize = 25;
		var numRows = data.length;
		var numCols = data[0].length;
		var shapeSet = gameboard.paper.set();
		shapeSet.dataArr = _(data).clone();
		for (var rowI = 0; rowI < numRows; rowI++){
			for (var colJ = 0; colJ < numCols; colJ++) {
				if (data[rowI][colJ] == 1) {
					var cell = gameboard.paper.rect(x+(colJ)*cellSize, y+(rowI)*cellSize,
											cellSize, cellSize);
					cell.attr({fill:'#323'});
					shapeSet.push(cell);
				}
			}
		}
		shapeSet.initBBox = {
			x:x,
			y:y,
			width: shapeSet.getBBox().width,
			height: shapeSet.getBBox().height,
		};
		shapeSet.isSelected = false;
		shapeSet.rotation = 0;
		var highlighted_set = gameboard.paper.set();
		$(window).mousemove(
			function(e){
				//on move
				if (!shapeSet.isSelected ){
					return 0;	
				}
				var bBox = {
					x : shapeSet.getBBox().x,
					y : shapeSet.getBBox().y,
					width : shapeSet.getBBox().width,
					height : shapeSet.getBBox().height,
				};
				var tmpR = Math.abs(shapeSet.rotation % 4);
				if (tmpR == 0){
					var dx = e.pageX - shapeSet.x;
					var dy = e.pageY - shapeSet.y;
				}
				if (tmpR == 1){
					var dy = e.pageX - shapeSet.x;
					var dx = -(e.pageY - shapeSet.y);
				}
				else if (tmpR == 2){
					var dy = -(e.pageY - shapeSet.y);
					var dx = -(e.pageX - shapeSet.x);
				}
				else if (tmpR == 3){
					var dx = (e.pageY - shapeSet.y);
					var dy = -(e.pageX - shapeSet.x);
				}
				var xMove = 0;
				var yMove = 0;
				var futureX = bBox.x + dx - shapeSet.dx -1;
				var futureY = bBox.y + dy - shapeSet.dy;
				var futureWidth = bBox.x + bBox.width + dx - shapeSet.dx + 1;
				var futureHeigth = bBox.y + bBox.height + dy - shapeSet.dy;
				if ( futureX >= 0 && futureWidth <= $(gameboard.paper.canvas).attr("width")) {
					xMove = dx - shapeSet.dx;
				}
				if ( futureY >= 0 && futureHeigth <= $(gameboard.paper.canvas).attr("height")) {
					yMove = dy - shapeSet.dy;
				}
				shapeSet.translate(xMove, yMove);
				shapeSet.dx = dx;
				shapeSet.dy = dy;
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
					tmpData = rotateMatrix(data, shapeSet.rotation);
					var numRows = tmpData.length;
					var numCols = tmpData[0].length;
					for (var rowI = 0; rowI < numRows; rowI++){
						for (var colJ = 0; colJ <= numCols; colJ++) {
							if (tmpData[rowI][colJ] == 1) {
								highlighted_set.push(gameboard.board[cellIndex.x+colJ][cellIndex.y+rowI]);
							}
						}
					}
					var xrot = shapeSet.initBBox.x + shapeSet.initBBox.width/2;
					var yrot = shapeSet.initBBox.y + shapeSet.initBBox.height/2;
					var cell = gameboard.board[cellIndex.x][cellIndex.y];
					highlighted_set.forEach(function (shape) {shape.attr({"fill": "#EEE"})});
					shapeSet.dest_x = cell.attr("x");
					shapeSet.dest_y = cell.attr("y");
				}
				else {
					shapeSet.dest_x = shapeSet.initBBox.x;
					shapeSet.dest_y = shapeSet.initBBox.y;
					if (highlighted_set.length != 0){
						highlighted_set.forEach(function (shape) {shape.attr({"fill": "#GGG"})});
						highlighted_set = gameboard.paper.set();
					}
				}
			}
		);
		shapeSet.click(
			function (e, x, y){
				// on Start
				if(!shapeSet.isSelected){
					shapeSet.isSelected = true;
					shapeSet.dx = 0;
					shapeSet.dy = 0;
					shapeSet.x = e.pageX;
					shapeSet.y = e.pageY;
					shapeSet.animate({"opacity": 0.5}, 0);
				}
				else {
					shapeSet.isSelected = false;
					var xrot = shapeSet.initBBox.x + shapeSet.initBBox.width/2;
					var yrot = shapeSet.initBBox.y + shapeSet.initBBox.height/2;
					var rotation = shapeSet.rotation * 90;
					var xadd = -50,
						yadd = -25;
					if (shapeSet.rotation % 2 != 0){
						xadd = -25;
						yadd = -50;
					}
					var tmp_x = shapeSet.dest_x + xadd;
					var tmp_y = shapeSet.dest_y + yadd;
					shapeSet.animate({transform: "t"+tmp_x+" "+tmp_y+"r"+rotation+" "+xrot+" "+yrot} , 500);
					shapeSet.animate({"opacity": 1}, 500);
					//shapeSet.animate({transform:"r180,75,73"}, 500) //around the center of the shape set
				}
			}
		);
		blokus.mapKeyDown(37, 
			function () {
				var xrot = shapeSet.initBBox.x + shapeSet.initBBox.width/2;
				var yrot = shapeSet.initBBox.y + shapeSet.initBBox.height/2;
				shapeSet.rotate(90, xrot, yrot);
				shapeSet.rotation += 1;
			}
		);
		blokus.mapKeyDown(39, 
			function () {
				var xrot = shapeSet.initBBox.x + shapeSet.initBBox.width/2;
				var yrot = shapeSet.initBBox.y + shapeSet.initBBox.height/2;
				shapeSet.rotate(-90, xrot, yrot);
				shapeSet.rotation -= 1;
			}
		);
		return shapeSet;
    }


	_(blokus).extend({
		HelpView: HelpView,
		RegisterView: RegisterView,
		ForgotView: ForgotView,
		ProfileView: ProfileView,
		GameView: GameView,
		LobbyView: LobbyView,
	});
}(jQuery, _, Backbone, blokus));
