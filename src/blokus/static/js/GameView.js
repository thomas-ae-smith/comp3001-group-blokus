(function ($, _, Backbone, blokus) {

	//Helper function to visually rotate a piece
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

	//Draws a single piece
    function drawPiece (x, y, data, gameScreen) {
        var cellSize = 25;
        var numRows = data.length;
        var numCols = data[0].length;
        var shapeSet = gameScreen.paper.set();
        shapeSet.dataArr = _(data).clone();
        for (var rowI = 0; rowI < numRows; rowI++){
            for (var colJ = 0; colJ < numCols; colJ++) {
                if (data[rowI][colJ] == 1) {
                    var cell = gameScreen.paper.rect(x+(colJ)*cellSize, y+(rowI)*cellSize,
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
        var highlighted_set = gameScreen.paper.set();
        $(window).mousemove(
            function(e){
                //on move
                if ( shapeSet.isSelected ){
					var SBBox = {
						x : shapeSet.getBBox().x,
						y : shapeSet.getBBox().y,
						width : shapeSet.getBBox().width,
						height : shapeSet.getBBox().height,
					};

					var canvas = $(gameScreen.paper.canvas);
					var GSBox = {
						top: canvas.offset().top,
						left: canvas.offset().left,
						right: canvas.offset().left + canvas.width(),
						bottom: canvas.offset().top + canvas.height(),
						width: canvas.width(),
						height: canvas.height(),
					};

					var futureX = undefined, 
						futureY = undefined,
						futureWidth = undefined,
						futureHeigth = undefined;

					var tmpR = Math.abs(shapeSet.rotation % 4);
					if (tmpR == 0){
						var distX = e.pageX - shapeSet.mousePageX;
						var distY = e.pageY - shapeSet.mousePageY;
					}
					if (tmpR == 1){
						var distY = e.pageX - shapeSet.mousePageX;
						var distX = -(e.pageY - shapeSet.mousePageY);
					}
					else if (tmpR == 2){
						var distY = -(e.pageY - shapeSet.mousePageY);
						var distX = -(e.pageX - shapeSet.mousePageX);
					}
					else if (tmpR == 3){
						var distX = (e.pageY - shapeSet.mousePageY);
						var distY = -(e.pageX - shapeSet.mousePageX);
					}
					//console.log(distX, shapeSet.prevDistX, SBBox.x);
					futureX = SBBox.x + (distX - shapeSet.prevDistX);
					futureY = SBBox.y + (distY - shapeSet.prevDistY);
					futureWidth = SBBox.x + SBBox.width + (distX - shapeSet.prevDistX);
					futureHeigth = SBBox.y + SBBox.height + (distY - shapeSet.prevDistY);
					var xMove = 0,
						yMove = 0;
					var sthChanged = false;
					if ( futureX > 0 && futureWidth <= GSBox.width) {
						xMove = distX - shapeSet.prevDistX;
					}
					if ( futureY > 0 && futureHeigth <= GSBox.height) {
						yMove = distY - shapeSet.prevDistY;
					}
					if (GSBox.top < e.pageY && GSBox.bottom > e.pageY && GSBox.left < e.pageX && GSBox.right > e.pageX ){
						shapeSet.translate(xMove, yMove);
						shapeSet.prevDistX = distX;
						shapeSet.prevDistY = distY;
					}
					// game board bounds
					var gbBounds = {
						sx: gameScreen.x,
						sy: gameScreen.y,
						ex: gameScreen.x + gameScreen.width,
						ey:gameScreen.y + gameScreen.height
					};
					// Check shapes to be in the gameScreen
					if (SBBox.x >= gbBounds.sx &&
						SBBox.y >= gbBounds.sy &&
						SBBox.x + SBBox.width - gameScreen.cellXSize < gbBounds.ex &&
						SBBox.y + SBBox.height - gameScreen.cellYSize < gbBounds.ey) {
						var cellIndex = {
							x: Math.floor((SBBox.x - gbBounds.sx)/ gameScreen.cellXSize),
							y: Math.floor((SBBox.y - gbBounds.sy)/ gameScreen.cellYSize),
						}

						if (highlighted_set.length != 0){
							highlighted_set.forEach(function (shape) {shape.attr({"fill": "#GGG"})});
							highlighted_set = gameScreen.paper.set();
						}
						tmpData = rotateMatrix(data, shapeSet.rotation);
						var numRows = tmpData.length;
						var numCols = tmpData[0].length;
						for (var rowI = 0; rowI < numRows; rowI++){
							for (var colJ = 0; colJ <= numCols; colJ++) {
								if (tmpData[rowI][colJ] == 1) {
									highlighted_set.push(gameScreen.board[cellIndex.x+colJ][cellIndex.y+rowI]);
								}
							}
						}
						var xrot = shapeSet.initBBox.x + shapeSet.initBBox.width/2;
						var yrot = shapeSet.initBBox.y + shapeSet.initBBox.height/2;
						var cell = gameScreen.board[cellIndex.x][cellIndex.y];
						highlighted_set.forEach(function (shape) {shape.attr({"fill": "#EEE"})});
						shapeSet.dest_x = cell.attr("x");
						shapeSet.dest_y = cell.attr("y");
					}
					else {
						shapeSet.dest_x = shapeSet.initBBox.x;
						shapeSet.dest_y = shapeSet.initBBox.y;
						if (highlighted_set.length != 0){
							highlighted_set.forEach(function (shape) {shape.attr({"fill": "#GGG"})});
							highlighted_set = gameScreen.paper.set();
						}
					}
                }
            }
        );
        shapeSet.click(
            function (e, x, y){
                // on Start
                if(!shapeSet.isSelected){
                    shapeSet.isSelected = true;
                    shapeSet.prevDistX = 0;
                    shapeSet.prevDistY = 0;
                    shapeSet.mousePageX = e.pageX;
                    shapeSet.mousePageY = e.pageY;
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

	//The GameView class handles rendering, block selection and placement.
    blokus.GameView = Backbone.View.extend({
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
		playerPositions: [
			{ x:0, y:0, w:100, h:500 },
			{ x:640, y:0, w:160, h:200 },
			{ x:640, y:200, w:160, h:200 },
			{ x:640, y:640, w:160, h:200 }
		],
		boardPos: { x:120, y:55, w:500, h:500 },

		//Draws the player box containing pieces
        drawPlayer: function (pos, player) {
                this.paper.rect(pos.x, pos.y, pos.w, pos.h).attr("fill", "white");
				this.paper.rect(pos.x, pos.y, pos.w, 20).attr("fill", "gray");
				this.paper.text(pos.x + 8, pos.y + 10, player.name).attr({
					"text-anchor": "start",
                        "font-family": "Tahoma",
                        "font-weight": "bold",
                        "font-size": 14
				});
        },

		//Draw the game board squares
        drawBoard: function () {
			// Gameboard
			//this.paper.rect(x, y, width+10, height+10, 5).attr("fill", "#GGGGGG");
			//this.paper.rect(x+5, y+5, width, height).attr("fill", "#AAAAAA");
			var numXCells = this.numXCells;
			var numYCells = this.numYCells;

			var cellXSize = pos.width/numXCells; //Size of cell on X axis
			var cellYSize = pos.height/numYCells; //Size of cell on Y axis

			//Init the values of the board;
			this.x = boardPos.x;
			this.y = boardPos.y;
			this.width = boardPos.width;
			this.height = boardPos.height;
			this.cellXSize = cellXSize;
			this.cellYSize = cellYSize;
			this.board = new Array(numXCells);
			for (var i=boardPos.x, iBoard=0; i<boardPos.width+boardPos.x ; i+=cellXSize, iBoard++) {
				this.board[iBoard] = new Array(numYCells);
				for (var j = boardPos.y, jBoard=0; j<boardPos.height+boardPos.y ; j+=cellYSize, jBoard++) {
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

					// Main board
                    this_.drawBoard();
					
                    // Player list with pieces		
					var i = 0;					
                    this_.game.get("players").each(function (player) {
						if (i < playerPositions.length) {
							//TODO: add piece list for each player, and add it into drawPlayer()
							var user = blokus.users.get(player.get("userId"));
							this_.drawPlayer(this.playerPositions[i], user.toJSON());
							++i;
						}
                    });

                    //Temp just show that I can draw things
                    var data = window.data = blokus.pieceMasters.get(3).get("data");
                    window.shapeSet = drawPiece(50,23,data, this_);
    				window.gb = this_;
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
}(jQuery, _, Backbone, blokus));
