//Width and height
var w = 1200;
var h = 500;

var DIV_CHAPTER = 1;
var DIV_PARAGRAPH = 2;
var barPaddingHorizontal = 20;
var barPaddingVertical = 60;
var barWidth = 100;
var barHight = 40;
var labelOffsetVertical = 10;
var labelOffsetHorizontal = 10;
var colorLightBrown = "rgb(255, 235, 222)";
var colorMediumBrown = "rgb(201, 115, 68)";
var colorDarkBrown = "rgb(94, 33, 0)";

var frequencyColors = {
	1: "#F7F2E0",
	2: "#F5ECCE",
	3: "#F3E2A9",
	4: "#F5DA81",
}

var dataset = {
	"books": [
		[
			{"id": "1.1", "div": DIV_PARAGRAPH, "title": "Rodowód", "group": 1},
			{"id": "1.2", "div": DIV_PARAGRAPH, "title": "Narodzenie", "group": 2},
			{"id": "1.3", "div": DIV_PARAGRAPH, "title": "Jan", "group": 3},
			{"id": "1.4", "div": DIV_PARAGRAPH, "title": "Post", "group": 4}
		],
		[
			{"id": "2.1", "div": DIV_PARAGRAPH, "title": "Narodzenie", "group": 2},
			{"id": "2.5", "div": DIV_PARAGRAPH, "title": "Modlitwa", "group": 6},
			{"id": "2.2", "div": DIV_PARAGRAPH, "title": "Jan2", "group": 8},
			{"id": "2.4", "div": DIV_PARAGRAPH, "title": "Jałmużna", "group": 5},
			{"id": "2.3", "div": DIV_PARAGRAPH, "title": "Post", "group": 4}
		],
		[
			{"id": "3.1", "div": DIV_PARAGRAPH, "title": "Nawiedzenie", "group": 7},
			{"id": "3.2", "div": DIV_PARAGRAPH, "title": "Narodzenie", "group": 2},
			{"id": "3.3", "div": DIV_PARAGRAPH, "title": "Jan", "group": 3},
			{"id": "3.4", "div": DIV_PARAGRAPH, "title": "Post", "group": 4}
		],
		[
			{"id": "4.1", "div": DIV_PARAGRAPH, "title": "Nawiedzenie", "group": 7},
			{"id": "4.2", "div": DIV_PARAGRAPH, "title": "Narodzenie", "group": 2},
			{"id": "4.4", "div": DIV_PARAGRAPH, "title": "Post", "group": 4}
		]
	]
}

// count groups
var groupDistance = {};
var groupCount = {};

for (var i = 0; i < dataset.books.length; i++) {
	var book = dataset.books[i];
	for (var j = 0; j < book.length; j++) {
		var div = book[j];
		if (groupCount[div.group] === undefined) {groupCount[div.group] = 0}
		if (groupDistance[div.group] === undefined) {groupDistance[div.group] = [null, null, null, null]}
		groupCount[div.group]++;
		groupDistance[div.group][i] = j;
	};
};

console.log(groupDistance);
console.log(groupCount);

//Create SVG element
var svg = d3.select("body")
			.append("svg")
			.attr("width", w)
			.attr("height", h);


// Drawing the boxes
for (var index = 0; index < dataset.books.length; index++) {
	svg.selectAll("rect.i" + index)
	   .data(dataset.books[index])
	   .enter()
	   .append("rect")
	   .attr("x", function(d, i) {
	   		return index * (barWidth + barPaddingVertical);
	   })
	   .attr("y", function(d, i) {
	   		return i * (barHight + barPaddingHorizontal);
	   })
	   .attr("width", barWidth)
	   .attr("height", barHight)
	   .attr("class", function(d, i) {return "grp" + d.group})
	   .attr("fill", function(d, i) {
			return frequencyColors[groupCount[d.group]];
	   })
	   .style("stroke", colorMediumBrown)
	    .on("mouseover", function(){
	    	d3.selectAll("." + this.getAttribute("class")).style("stroke", colorDarkBrown);
	     })
	    .on("mouseclick", function(){
	    	d3.selectAll("." + this.getAttribute("class")).style("stroke", colorDarkBrown);
	     })
	    .on("mouseout", function(){
	      d3.selectAll("." + this.getAttribute("class")).style("stroke", colorMediumBrown);
	    });
}

// Adding text to the boxes
for (var index = 0; index < dataset.books.length; index++) {
	svg.selectAll("text.i" + index)
		.data(dataset.books[index])
	   	.enter()
	   	.append("text")
	   	.text(function(d) {
   			return d.title;
	   	})
	   	.attr("text-anchor", "left")
	   	.attr("x", function(d, i) {
   			return index * (barWidth + barPaddingVertical) + 5;
	   	})
	   	.attr("y", function(d, i) {
   			return i * (barHight + barPaddingHorizontal) + (barHight * 0.6);
	   	})
	   	.attr("font-family", "sans-serif")
	   	.attr("font-size", "11px")
	   	.attr("fill", colorMediumBrown);
}

var lineFunction = d3.svg.line()
		.x(function(d) { return d.x; })
		.y(function(d) { return d.y; })
		.interpolate("linear");

// Drawing the lines
for (var index = 0; index < dataset.books.length - 1; index++) {
	svg.selectAll("path.i" + index)
		.data(dataset.books[index])
	  	.enter()
	  	.append("path")	
	  	.attr("d", function(d, i) {return lineFunction(getPathCoords(index, d, i))})
	  	.attr("class", function(d, i) {return "grp" + d.group})
	  	.style("stroke", colorMediumBrown);
}

function getPathCoords(index, d, i) {
	var x2 = (index + 1) * (barWidth + barPaddingVertical);
	var x1 = function(d,i) {
		  		// if no item of the same group in next column, set x1 same as x2 to hide the line
		  		if(getNextIndex(d.group, index) < 0) {
		  			return x2;
		  		}
		  		
		  		if (index == 0) {
		  			return barWidth;
		  		}
		  		return barWidth + (index * (barPaddingVertical + barWidth));
		  	}(d, i);
	var y1 = (barHight/2) + (i * (barHight + barPaddingHorizontal));
	var y2 = function(d,i) {
	  		// if no item of the same group in next column, set y2 same as y1
	  		var nextIndex = getNextIndex(d.group, index);
	  		if(nextIndex < 0) {
	  			return y1;
	  		}
	  		return (barHight/2) + (nextIndex * (barHight + barPaddingHorizontal));
	  	}(d, i);
	return [{"x": x1, "y": y1}, {"x": x2, "y": y2}];
}

function getNextIndex(group, index) {
	var ret = -1;
	for (var i = 0; i < dataset.books[index+1].length; i++) {
		var d = dataset.books[index+1][i];
		if (d.group == group) {
			ret = i;
		}
	};
	return ret;
}