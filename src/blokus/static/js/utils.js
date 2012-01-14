blokus.utils = (function ($, _, Backbone) {
	'use strict';

	var pieceLocations = {},
		use_validation = true, //Added for debugging the server. FIXME
		block_validation = false,
		blockWidth = 0,
		blockHeight = 0,
		// Offsets of the shapes inside the right and left panels
		rXOffsets = [0, 4, 13, 8, 16.5, 9, 14.5, 19.5, 3, 0, 7, 12, 4, 19, 0, 2.5, 8.5, 12.5, 18, 17, 0],
		rYOffsets = [0.5, 0.5, 0.5, 0.5, 6, 3, 3, 3, 6, 1.8, 6, 6, 3, 6, 9.4, 10, 10, 10, 10, 0.5, 7],
		lXOffsets = [2.5, 3, 4.5, 4, 3, 0.5, 0.5, 4, 1.5, 4.2, 4, 2, 4, 4, 0, 0.5, 0.5, 0, 2, 1, 0],
		lYOffsets = [27, 4.5, 1, 34, 8, 2, 6, 29.5, 0, 18, 9, 29, 25, 5, 24, 28, 16.5, 33, 14.5, 21, 11];

	var set_use_validation = function (value) { use_validation = value; }; // FIXME remove

	var set_block_validation = function (value) {
		block_validation = value;
	};

	function makePositionArray(x, y, w, h) {
		x = Number(x);
		y = Number(y);

		var right = Number(h) < (Number(w) * 2);
		blockWidth = w / (right ? 23 : 6);
		blockHeight = h / (right ? 12 : 38);
		var xOffsets = right ? rXOffsets : lXOffsets;
		var yOffsets = right ? rYOffsets : lYOffsets;

		_(xOffsets).each(function (xOff, i) {
			var yOff = yOffsets[i];
			pieceLocations[i+1] = {
				x: Math.floor(x + (blockWidth * xOff)),
				y: Math.floor(y + (blockHeight * yOff))
			};
		});

		return pieceLocations;
	}

	//Returns an array of x,y points describing the top left coordinates for each shape.
	var get_points = function (arr, x, y, w, h) {
		var retVal = {},
			i = 0,
			l = arr.length;

		makePositionArray(x, y, w, h);
		for (i = 0; i < l; i++) {
			retVal[i + 1] = pieceLocations[Number(arr[i].id)];
		}
		return retVal;
	};

	//Returns an array of x,y points describing the top left coordinates for each shape.
	var get_points_from_masters = function (arr, x, y, w, h) {
		var retVal = {},
			i = 0,
			l = arr.length;

		makePositionArray(x, y, w, h);
		for (i = 0; i < l; i++) {
			Number(arr[i])
			retVal[id] = pieceLocations[id];
		}
		return retVal;
	};

	// Make the grid to store the colour shape for each cell
	var gridPlaced = _(_.range(20)).map(function () {
		return _(_.range(20)).map(function () {
			return '0';
		});
	});

	//Get the owner of the square or '' if out of bounds.
	var get_claim = function (x, y) {
		if ((x >= 0) && (x < 20) && (y >= 0) && (y < 20)) {
			return gridPlaced[x][y].toString();
		} else {
			return '';
		}
	};

	//Add a single square defined by (x,y) to the validation grid owned by colour
	function add_cell_to_validation_grid(x, y, colour) {
		colour = colour.toLowerCase();
		gridPlaced[x][y] = colour[0];
	}

	//Given a piece populate the validation grid with the piece information for the given colour.
	var add_piece_to_validation_grid = function (pieceData, x, y, colour) {
		var	numRows = pieceData.length,
			numCols = pieceData[0].length;

		for (var rowI = 0; rowI < numRows; rowI++) {
			for (var colJ = 0; colJ <= numCols; colJ++) {
				if (pieceData[rowI][colJ] == 1) {
					add_cell_to_validation_grid(colJ + x, rowI + y, colour);
				}
			}
		}
	};

	//True if no pieces on the board are of the current player's colour.
	var is_first_turn = function () {
		var firstTurn = true,
			colI = 0,
			rowJ = 0;
		for (colI = 0; colI < 20; colI++) {
			for (rowJ = 0; rowJ <= 20; rowJ++) {
				if (get_claim(colI, rowJ) === gameview.game.get("colour_turn")[0]) {
					firstTurn = false;
				}
			}
		}
		return firstTurn;
	};

	//True if the current piece is touching a corner.
	var is_corner = function (x, y) {
		if (((x === 0) && (y === 0)) || ((x === 0) && (y === 19)) || ((x === 19) && (y === 0)) || ((x === 19) && (y === 19))) {
			return is_first_turn();
		} else {
			return false;
		}
	};

	//True if the grid-square denoted by x,y already has an owner.
	var in_conflict = function (x, y) {
		return (!isNaN(x)) && (!isNaN(y)) && (get_claim(x, y).toString() !== '0');
	};

	//True if the grid-square denoted by x,y shares a flat side with another square owned by the same colour.
	var shares_side = function (x, y) {
		var turn = gameview.game.get("colour_turn")[0];
		return (
			(get_claim(x, y - 1) === turn) ||
			(get_claim(x, y + 1) === turn) ||
			(get_claim(x - 1, y) === turn) ||
			(get_claim(x + 1, y) === turn)
		);
	};

	//True if the grid-square denoted by x,y shares a corner with another square owned by the same colour.
	var shares_vertex = function (x, y) {
		var turn = gameview.game.get("colour_turn")[0];
		return (
			(get_claim(x - 1, y - 1) === turn) ||
			(get_claim(x + 1, y - 1) === turn) ||
			(get_claim(x - 1, y + 1) === turn) ||
			(get_claim(x + 1, y + 1) === turn)
		);
	};

	//Checks if the piece given in arr will breach any of the rules of placement.
	var valid = function (arr) {
		var corner = false,
			conflicted = false,
			sharingSide = false,
			sharingVertex = false,
			firstTurn = is_first_turn();

		//If not in board area or validation is turned off then do not validate
		//FIXME: Should not really allow users to turn validation off.
		if (!arr.length > 0 || !use_validation) {
			return true;
		}else if (block_validation){
			return false;
		}

		//If first turn ensure corner placement
		arr.forEach(function (cor) {
			if (firstTurn) {
				corner = corner || is_corner(cor.x, cor.y);
			} else {
				//If not first turn ignore this test
				corner = true;
			}
		});

		if (corner) {
			//Run remaining validation
			arr.forEach(function (cor) {
				conflicted = conflicted || in_conflict(cor.x, cor.y);
				sharingSide = sharingSide || shares_side(cor.x, cor.y);
				sharingVertex = sharingVertex || shares_vertex(cor.x, cor.y);
			});

			//Valid if not conflicting and in a corner (if first turn) or if not conflicting or sharing side but is sharing corner.
			return ((!conflicted && firstTurn) || (!conflicted && !sharingSide && sharingVertex));
		} else {
			return false;
		}
	};

	return {
		get_points: get_points,
		is_corner: is_corner,
		in_conflict: in_conflict,
		is_first_turn: is_first_turn,
		shares_side: shares_side,
		shares_vertex: shares_vertex,
		valid: valid,
		get_claim: get_claim,
		add_cell_to_validation_grid: add_cell_to_validation_grid,
		add_piece_to_validation_grid: add_piece_to_validation_grid,
		set_use_validation: set_use_validation,
		set_block_validation: set_block_validation,
		makePositionArray: makePositionArray
	};
}(jQuery, _, Backbone));
