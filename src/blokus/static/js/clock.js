(function ($, _, Backbone, blokus) {
	blokus.Clock = Backbone.View.extend({
		
		center: {x:undefined, y:undefined},
		radius: 20,
		paper: undefined,
		colour: "#FFF",
		secHandle: undefined,
		minHandle: undefined,
		seconds: 0,
		minutes: 0,

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
				var pointers = this.paper.path("M "+from.x+" "+from.y+" L "+to.x+" "+to.y+"z");
				pointers.attr({stroke:"#fff", "stroke-width": i%30 ? 0.1:1})
			}
			this.drawHandle();
			return this;
		},

		drawHandle: function(){
			var this_ = this;
			if(this.secHandle != undefined)
				this.secHandle.remove();
			if(this.minHandle != undefined)
				this.minHandle.remove();
			var to = this.toCoords(this.center, this.radius-3, this.seconds*6-90);
			this.secHandle = this.paper.path("M "+this.center.x+" "+this.center.y+" L "+to.x+" "+to.y+"z");
			to = this.toCoords(this.center, this.radius-6, this.minutes*6-90);
			this.secHandle.attr({stroke:"#fff", "stroke-width": 1})
			this.minHandle = this.paper.path("M "+this.center.x+" "+this.center.y+" L "+to.x+" "+to.y+"z");
			this.minHandle.attr({stroke:"#fff", "stroke-width": 2})
			this.seconds += 1;
			if(this.seconds > 59){
				this.seconds = 0;
				this.minutes += 1;
			}
			if(this.minutes > 59){
				this.minutes = 0;
			}
			setTimeout(function(){this_.drawHandle();}, 1000);
		},

		toCoords: function(center, radius, angle){
			var radians = (angle/180) * Math.PI;
			var x = center.x + Math.cos(radians) * radius;
			var y = center.y + Math.sin(radians) * radius;
			return {x:x, y:y};
		}
		
	});
}(jQuery, _, Backbone, blokus));
