blokus.utils = (function ($, _, Backbone){
	var pieceLocations = {};
	var use_validation = false; //Added for debugging the server. FIXME
	var blockWidth = 0;
	var blockHeight = 0;

	var set_use_validation = function (value) {
		use_validation = value;
	};

	var get_points = function (arr, x, y, w, h) {
		var retVal = {};
		makePositionArray(x, y, w, h);
		for(var i=0;i<arr.length;i++){
			retVal[i+1] = pieceLocations[Number(arr[i].id)];
		}
		return retVal;
	};

	function makePositionArray(x, y, w, h){
		if (Number(h) < (Number(w)*2)){
			blockWidth = w / 23;
			blockHeight = h / 12;

			//row 1
			pieceLocations[20] = {x: Math.floor(Number(x) + (blockWidth * 17)),y: Math.floor(Number(y) + (blockHeight * 0))};
			pieceLocations[1] = {x: Math.floor(Number(x) + (blockWidth * 3)),y: Math.floor(Number(y) + (blockHeight * 0))};
			pieceLocations[2] = {x: Math.floor(Number(x) + (blockWidth * 7)),y: Math.floor(Number(y) + (blockHeight * 0))};
			pieceLocations[3] = {x: Math.floor(Number(x) + (blockWidth * 12)),y: Math.floor(Number(y) + (blockHeight * 0))};

			//row 2
			pieceLocations[4] = {x: Math.floor(Number(x) + (blockWidth * 0)),y: Math.floor(Number(y) + (blockHeight * 2))};
			pieceLocations[5] = {x: Math.floor(Number(x) + (blockWidth * 5)),y: Math.floor(Number(y) + (blockHeight * 2))};
			pieceLocations[6] = {x: Math.floor(Number(x) + (blockWidth * 9)),y: Math.floor(Number(y) + (blockHeight * 2))};
			pieceLocations[7] = {x: Math.floor(Number(x) + (blockWidth * 15)),y: Math.floor(Number(y) + (blockHeight * 2))};
			pieceLocations[8] = {x: Math.floor(Number(x) + (blockWidth * 20)),y: Math.floor(Number(y) + (blockHeight * 2))};

			//row 3
			pieceLocations[9] = {x: Math.floor(Number(x) + (blockWidth * 0)),y: Math.floor(Number(y) + (blockHeight * 5.5))};
			pieceLocations[10] = {x: Math.floor(Number(x) + (blockWidth * 5.5)),y: Math.floor(Number(y) + (blockHeight * 5.5))};
			pieceLocations[11] = {x: Math.floor(Number(x) + (blockWidth * 9)),y: Math.floor(Number(y) + (blockHeight * 5))};
			pieceLocations[12] = {x: Math.floor(Number(x) + (blockWidth * 13)),y: Math.floor(Number(y) + (blockHeight * 6))};
			pieceLocations[13] = {x: Math.floor(Number(x) + (blockWidth * 18)),y: Math.floor(Number(y) + (blockHeight * 5))};
			pieceLocations[14] = {x: Math.floor(Number(x) + (blockWidth * 22)),y: Math.floor(Number(y) + (blockHeight * 5))};
			pieceLocations[21] = {x: Math.floor(Number(x) + (blockWidth * 20.5)),y: Math.floor(Number(y) + (blockHeight * 6.8))};

			//row 4
			pieceLocations[15] = {x: Math.floor(Number(x) + (blockWidth * 0)),y: Math.floor(Number(y) + (blockHeight * 8.6))};
			pieceLocations[16] = {x: Math.floor(Number(x) + (blockWidth * 5)),y: Math.floor(Number(y) + (blockHeight * 9))};
			pieceLocations[17] = {x: Math.floor(Number(x) + (blockWidth * 11)),y: Math.floor(Number(y) + (blockHeight * 9))};
			pieceLocations[18] = {x: Math.floor(Number(x) + (blockWidth * 15)),y: Math.floor(Number(y) + (blockHeight * 9))};
			pieceLocations[19] = {x: Math.floor(Number(x) + (blockWidth * 20.5)),y: Math.floor(Number(y) + (blockHeight * 9))};
		}else{
			blockWidth = w / 6;
			blockHeight = h / 38;

			//row 1
			pieceLocations[1] = {x: Math.floor(Number(x) + (blockWidth * 2)),y: Math.floor(Number(y) + (blockHeight * 6))};
			pieceLocations[2] = {x: Math.floor(Number(x) + (blockWidth * 2)),y: Math.floor(Number(y) + (blockHeight * 3))};
			pieceLocations[3] = {x: Math.floor(Number(x) + (blockWidth * 0)),y: Math.floor(Number(y) + (blockHeight * 2))};
			pieceLocations[20] = {x: Math.floor(Number(x) + (blockWidth * 0)),y: Math.floor(Number(y) + (blockHeight * 11))};

			//row 2
			pieceLocations[4] = {x: Math.floor(Number(x) + (blockWidth * 4)),y: Math.floor(Number(y) + (blockHeight * 34))};
			pieceLocations[5] = {x: Math.floor(Number(x) + (blockWidth * 0)),y: Math.floor(Number(y) + (blockHeight * 6))};
			pieceLocations[6] = {x: Math.floor(Number(x) + (blockWidth * 4)),y: Math.floor(Number(y) + (blockHeight * 1))};
			pieceLocations[7] = {x: Math.floor(Number(x) + (blockWidth * 2)),y: Math.floor(Number(y) + (blockHeight * 8))};
			pieceLocations[8] = {x: Math.floor(Number(x) + (blockWidth * 0)),y: Math.floor(Number(y) + (blockHeight * 15))};

			//row 3
			pieceLocations[9] = {x: Math.floor(Number(x) + (blockWidth * 1)),y: Math.floor(Number(y) + (blockHeight * 0))};
			pieceLocations[10] = {x: Math.floor(Number(x) + (blockWidth * 0)),y: Math.floor(Number(y) + (blockHeight * 18))};
			pieceLocations[11] = {x: Math.floor(Number(x) + (blockWidth * 4)),y: Math.floor(Number(y) + (blockHeight * 9))};
			pieceLocations[12] = {x: Math.floor(Number(x) + (blockWidth * 0)),y: Math.floor(Number(y) + (blockHeight * 28))};
			pieceLocations[13] = {x: Math.floor(Number(x) + (blockWidth * 4)),y: Math.floor(Number(y) + (blockHeight * 25))};
			pieceLocations[14] = {x: Math.floor(Number(x) + (blockWidth * 4)),y: Math.floor(Number(y) + (blockHeight * 5))};
			pieceLocations[21] = {x: Math.floor(Number(x) + (blockWidth * 0)),y: Math.floor(Number(y) + (blockHeight * 24))};

			//row 4
			pieceLocations[15] = {x: Math.floor(Number(x) + (blockWidth * 3)),y: Math.floor(Number(y) + (blockHeight * 29))};
			pieceLocations[16] = {x: Math.floor(Number(x) + (blockWidth * 2)),y: Math.floor(Number(y) + (blockHeight * 17))};
			pieceLocations[17] = {x: Math.floor(Number(x) + (blockWidth * 0)),y: Math.floor(Number(y) + (blockHeight * 33))};
			pieceLocations[18] = {x: Math.floor(Number(x) + (blockWidth * 3)),y: Math.floor(Number(y) + (blockHeight * 14))};
			pieceLocations[19] = {x: Math.floor(Number(x) + (blockWidth * 2)),y: Math.floor(Number(y) + (blockHeight * 21))};
		}
	};

	//Get the owner of the square or '' if out of bounds.
	var get_claim = function(x, y){
		if ((x >= 0) && (x < 20) && (y >= 0) && (y < 20)){
			return blokus.board.get("gridPlaced")[x][y];
		}else{
			return '';
		}
	};

	var place_piece = function (piece) {
		var pieceMasterData = blokus.pieceMaster.get(piece.get("master_id")).get("data"),
			x = piece.get("x"),
			y = piece.get("y");

		_(pieceMasterData).each(function (row, rowi) {
			_(row).each(function (val, coli) {
				if (val === 0)
			})
		})

	}

	//True if no pieces on the board are of the current player's colour.
	var is_first_turn = function (){
		var firstTurn = true;
		for (var colI = 0; colI < 20; colI++){
			for (var rowJ = 0; rowJ <= 20; rowJ++) {
				if (get_claim(colI, rowJ) == gameview.game.get("colour_turn")[0]) {
					firstTurn = false;
				}
			}
		}
		return firstTurn;
	};

	//True if the current piece is touching a corner.
	var is_corner = function (x, y){
		if (((x == 0) && (y == 0)) || ((x == 0) && (y == 19)) || ((x == 19) && (y == 0)) || ((x == 19) && (y == 19))){
			return is_first_turn();
		}else{
			return false;
		}
	};

	//True if the grid-square denoted by x,y already has an owner.
	var in_conflict = function (x, y){
		if(isNaN(x) || isNaN(y)){
			return false;
		}else{
			if (get_claim(x, y) != '0'){
				return true;
			}else{
				return false;
			}
		}
	};

	//True if the grid-square denoted by x,y shares a flat side with another square owned by the same colour.
	var shares_side = function (x, y){
		var turn = gameview.game.get("colour_turn")[0];
		return (
			(get_claim(x, y - 1) == turn) ||
			(get_claim(x, y + 1) == turn) ||
			(get_claim(x - 1, y) == turn) ||
			(get_claim(x + 1, y) == turn)
		);
	};

	//True if the grid-square denoted by x,y shares a corner with another square owned by the same colour.
	var shares_vertex = function (x, y){
		var turn = gameview.game.get("colour_turn")[0];
		return (
			(get_claim(x - 1, y - 1) == turn) ||
			(get_claim(x + 1, y - 1) == turn) ||
			(get_claim(x - 1, y + 1) == turn) ||
			(get_claim(x + 1, y + 1) == turn)
		);
	};

	//Checks if the piece given in arr will breach any of the rules of placement.
	var valid = function (arr){
		var corner = false;
		var conflicted = false;
		var sharingSide = false;
		var sharingVertex = false;
		var firstTurn = is_first_turn();

		//If not in board area or validation is turned off then do not validate
		//FIXME: Should not really allow users to turn validation off.
		if(!arr.length > 0 || !use_validation){
			return true;
		}

		//If first turn ensure corner placement
		arr.forEach(function (cor) {
			if (firstTurn){
				corner = corner || is_corner(cor.x, cor.y);
			}else{
				//If not first turn ignore this test
				corner = true;
			}
		});

		if(corner){
			//Run remaining validation
			arr.forEach(function (cor) {
				conflicted = conflicted || in_conflict(cor.x, cor.y);
				sharingSide = sharingSide || shares_side(cor.x, cor.y);
				sharingVertex = sharingVertex || shares_vertex(cor.x, cor.y);
			});

			//Valid if not conflicting and in a corner (if first turn) or if not conflicting or sharing side but is sharing corner.
			return ((!conflicted && firstTurn) || (!conflicted && !sharingSide && sharingVertex));
		}else{
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
		set_use_validation: set_use_validation
	};
}(jQuery, _, Backbone));
