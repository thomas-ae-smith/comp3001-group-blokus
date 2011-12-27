blokus.utils = (function ($, _, Backbone){
	var pieceLocations = {};

	var get_points = function (arr, x, y, w, h) {
		var retVal = [];
		makePositionArray(x, y, w, h);
		for(var i=0;i<arr.length;i++){
			retVal[i] = pieceLocations[Number(arr[i].id)];
		}
		return retVal;
	};

	function makePositionArray(x, y, w, h){
		var blockWidth = w / 23;
		var blockHeight = h / 12;

		//row 1
		pieceLocations[0] = {x: Math.floor(Number(x) + (blockWidth * 0)),y: Math.floor(Number(y) + (blockHeight * 0))};
		pieceLocations[1] = {x: Math.floor(Number(x) + (blockWidth * 3)),y: Math.floor(Number(y) + (blockHeight * 0))};
		pieceLocations[2] = {x: Math.floor(Number(x) + (blockWidth * 7)),y: Math.floor(Number(y) + (blockHeight * 0))};
		pieceLocations[3] = {x: Math.floor(Number(x) + (blockWidth * 12)),y: Math.floor(Number(y) + (blockHeight * 0))};

		//row 2
		pieceLocations[4] = {x: Math.floor(Number(x) + (blockWidth * 0)),y: Math.floor(Number(y) + (blockHeight * 2))};
		pieceLocations[5] = {x: Math.floor(Number(x) + (blockWidth * 4)),y: Math.floor(Number(y) + (blockHeight * 2))};
		pieceLocations[6] = {x: Math.floor(Number(x) + (blockWidth * 9)),y: Math.floor(Number(y) + (blockHeight * 3))};
		pieceLocations[7] = {x: Math.floor(Number(x) + (blockWidth * 15)),y: Math.floor(Number(y) + (blockHeight * 2))};
		pieceLocations[8] = {x: Math.floor(Number(x) + (blockWidth * 20)),y: Math.floor(Number(y) + (blockHeight * 2))};
		
		//row 3
		pieceLocations[9] = {x: Math.floor(Number(x) + (blockWidth * 0)),y: Math.floor(Number(y) + (blockHeight * 6))};
		pieceLocations[10] = {x: Math.floor(Number(x) + (blockWidth * 5)),y: Math.floor(Number(y) + (blockHeight * 5))};
		pieceLocations[11] = {x: Math.floor(Number(x) + (blockWidth * 9)),y: Math.floor(Number(y) + (blockHeight * 5))};
		pieceLocations[12] = {x: Math.floor(Number(x) + (blockWidth * 13)),y: Math.floor(Number(y) + (blockHeight * 6))};
		pieceLocations[13] = {x: Math.floor(Number(x) + (blockWidth * 18)),y: Math.floor(Number(y) + (blockHeight * 5))};
		pieceLocations[14] = {x: Math.floor(Number(x) + (blockWidth * 22)),y: Math.floor(Number(y) + (blockHeight * 5))};
		
		//row 4
		pieceLocations[15] = {x: Math.floor(Number(x) + (blockWidth * 0)),y: Math.floor(Number(y) + (blockHeight * 8.6))};
		pieceLocations[16] = {x: Math.floor(Number(x) + (blockWidth * 5)),y: Math.floor(Number(y) + (blockHeight * 9))};
		pieceLocations[17] = {x: Math.floor(Number(x) + (blockWidth * 11)),y: Math.floor(Number(y) + (blockHeight * 9))};
		pieceLocations[18] = {x: Math.floor(Number(x) + (blockWidth * 15)),y: Math.floor(Number(y) + (blockHeight * 9))};
		pieceLocations[19] = {x: Math.floor(Number(x) + (blockWidth * 20.5)),y: Math.floor(Number(y) + (blockHeight * 9))};

		//Put the last shape on the first line
		pieceLocations[20] = {x: Math.floor(Number(x) + (blockWidth * 17)),y: Math.floor(Number(y) + (blockHeight * 0))};
	};

	var is_corner = function (x, y){
		if (((x == 0) && (y == 0)) || ((x == 0) && (y == 19)) || ((x == 19) && (y == 0)) || ((x == 19) && (y == 19))){
			return true;
		}else{
			return false;
		}
	};

	var in_conflict = function (x, y){
		if(isNaN(x) || isNaN(y)){
			return false;
		}else{
			console.log(x);
			console.log(y);
			if (blokus.board.get("gridPlaced")[x][y] != '0'){
				return true;
			}else{
				return false;
			}	
		}
	};
	
	return {
		get_points: get_points,
		is_corner: is_corner,
		in_conflict: in_conflict
	};
}(jQuery, _, Backbone));
