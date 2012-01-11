(function ($, _, Backbone, blokus) {
	blokus.Clock = Backbone.View.extend({
		
		center: {x:undefined, y:undefined},
		radius: 20,
		paper: undefined,
		colour: "#FFF",
		handle: undefined,
		seconds: 0,

		initialize: function(){
			this.center = this.options.center;
			this.paper = this.options.paper;
			//this.border = this.paper.circle(this.center.x, this.center.y, this.radius);
			//this.border.attr("stroke", this.colour);
		},

		render: function(){
			for (var i=0; i <= 360; i+=6){
				var from = this.toCoords(this.center, this.radius, i);
				var to = this.toCoords(this.center, this.radius+6, i);
				var min = this.paper.path("M "+from.x+" "+from.y+" L "+to.x+" "+to.y+"z");
				min.attr({stroke:"#fff", "stroke-width": i%30 ? 0.1:1})
			}
			this.drawHandle();
			return this;
		},

		drawHandle: function(){
			var this_ = this;
			if(this.handle != undefined)
				this.handle.remove();
			var to = this.toCoords(this.center, this.radius-1, this.seconds*6);
			this.handle = this.paper.path("M "+this.center.x+" "+this.center.y+" L "+to.x+" "+to.y+"z");
			this.handle.attr({stroke:"#fff", "stroke-width": 1})
			this.seconds += 1;
			this.seconds = this.seconds > 59 ? 0 : this.seconds;
			setTimeout(function(){this_.drawHandle();}, 1000);
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
