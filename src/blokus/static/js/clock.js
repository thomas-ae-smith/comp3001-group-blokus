(function ($, _, Backbone, blokus) {
	blokus.Clock = Backbone.View.extend({
		
		center: {x:undefined, y:undefined},
		radius: 25,
		paper: undefined,
		colour: "#FFF",

		initialize: function(){
			this.center = this.options.center;
			this.paper = this.options.paper;
			//this.border = this.paper.circle(this.center.x, this.center.y, this.radius);
			//this.border.attr("stroke", this.colour);
		},

		render: function(){
			for (var i=0; i <= 360; i+=30){
				var from = this.toCoords(this.center, this.radius, i);
				var to = this.toCoords(this.center, this.radius+4, i);
				var min = this.paper.path("M"+from.x+" "+from.y+" l "+to.x+" "+to.y+"z");
				console.log("TEMP");
				min.attr("fill", this.colour);
			}
			return this;
		},

		arc: function(center, radius, startAngle, endAngle) {
			var angle = startAngle;
			var coords = this.toCoords(center, radius, angle);
			var path = "M " + coords.x + " " + coords.y;
			while(angle<=endAngle) {
				coords = this.toCoords(center, radius, angle);
				path += " L " + coords.x + " " + coords.y;
				angle += 1;
			}
			return path;
		},

		toCoords: function(center, radius, angle){
			var radians = (angle/180) * Math.PI;
			var x = center.x + Math.cos(radians) * radius;
			var y = center.y + Math.sin(radians) * radius;
			return {x:x, y:y};
		}
		
	});
}(jQuery, _, Backbone, blokus));
