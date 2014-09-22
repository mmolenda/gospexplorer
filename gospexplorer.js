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
			{"id": "1.4", "div": DIV_PARAGRAPH, "title": "Wnieb", "group": 9},
			{"id": "1.5", "div": DIV_PARAGRAPH, "title": "Post", "group": 4}
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
			{"id": "3.3", "div": DIV_PARAGRAPH, "title": "Jan", "group": 3},
			{"id": "3.2", "div": DIV_PARAGRAPH, "title": "Narodzenie", "group": 2},
			{"id": "3.4", "div": DIV_PARAGRAPH, "title": "Post", "group": 4}
		],
		[
			{"id": "4.1", "div": DIV_PARAGRAPH, "title": "Nawiedzenie", "group": 7},
			{"id": "4.2", "div": DIV_PARAGRAPH, "title": "Narodzenie", "group": 2},
			{"id": "4.3", "div": DIV_PARAGRAPH, "title": "Wnieb", "group": 9},
			{"id": "4.4", "div": DIV_PARAGRAPH, "title": "Post", "group": 4}
		]
	]
}

// count groups
var groupCoordinates = {};
var groupCount = {};

for (var i=0; i<dataset.books.length; i++) {
	var book = dataset.books[i];
	for (var j=0; j<book.length; j++) {
		var div = book[j];
		if (groupCount[div.group] === undefined) {groupCount[div.group] = 0}
		if (groupCoordinates[div.group] === undefined) {groupCoordinates[div.group] = [null, null, null, null]}
		groupCount[div.group]++;
		groupCoordinates[div.group][i] = j;
	};
};

console.log(groupCoordinates);
console.log(groupCount);

//Create SVG element
var svg = d3.select("body")
			.append("svg")
			.attr("width", w)
			.attr("height", h);


// Drawing the boxes
for (var index=0; index<dataset.books.length; index++) {
	svg.selectAll("rect.i" + index)
	   .data(dataset.books[index])
	   .enter()
	   .append("rect")
	   .attr("x", function(d, i) {
	   		return barPaddingVertical + (index * (barWidth + barPaddingVertical));
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
	    	d3.selectAll("." + this.getAttribute("class")).style("stroke-width", 3);
	     })
	    .on("mouseclick", function(){
	    	d3.selectAll("." + this.getAttribute("class")).style("stroke", colorDarkBrown);
	     })
	    .on("mouseout", function(){
	      d3.selectAll("." + this.getAttribute("class")).style("stroke", colorMediumBrown);
	    	d3.selectAll("." + this.getAttribute("class")).style("stroke-width", 1);
	    });
}

// Adding text to the boxes
for (var index=0; index<dataset.books.length; index++) {
	svg.selectAll("text.i" + index)
		.data(dataset.books[index])
	   	.enter()
	   	.append("text")
	   	.text(function(d) {
   			return d.title;
	   	})
	   	.attr("text-anchor", "left")
	   	.attr("x", function(d, i) {
   			return barPaddingVertical + (index * (barWidth + barPaddingVertical)) + 5;
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
for (var index=0; index<dataset.books.length-1; index++) {
	svg.selectAll("path.i" + index)
		.data(dataset.books[index])
	  	.enter()
	  	.append("path")	
	  	.attr("d", function(d, i) {return lineFunction(getPathCoords(index, d, i))})
	  	.attr("class", function(d, i) {return "grp" + d.group})
	  	.style("stroke", colorMediumBrown)
	  	.attr("fill", "none");
}

function getPathCoords(index, d, i) {
	var nextCoordinates = getNextCoordinates(d.group, index);
	if (nextCoordinates == null) {
		return [{"x": 0, "y": 0}, {"x": 0, "y": 0}];
	}
	var x1 = (index + 1) * (barPaddingVertical + barWidth);
	var x2 = barPaddingVertical + ((nextCoordinates["x"]) * (barPaddingVertical + barWidth));
	var y1 = (barHight/2) + (i * (barHight + barPaddingHorizontal));
	var y2 = (barHight/2) + ((nextCoordinates["y"]) * (barHight + barPaddingHorizontal));

	var pathCoordinates = [{"x": x1, "y": y1}, {"x": x2, "y": y2}];
	// bend the line by adding two additional points, if distance > 1
	var distance = nextCoordinates["x"] - index;
	if (distance > 1) {
		leftx = x1 + barPaddingVertical;
		lefty = y1 - (barHight / 2) - (barPaddingHorizontal / 2);
		rightx = x2 - barPaddingVertical;
		righty = lefty;
		pathCoordinates = [pathCoordinates[0], {"x": leftx, "y": lefty}, {"x": rightx, "y": righty}, pathCoordinates[1]]


	}
	return pathCoordinates;
}

function getNextCoordinates(group, index) {
	var ret = null;
	if (index > 2) {
		return ret;
	}
	var nextCoordinates = groupCoordinates[group];
	// console.log("nextcoord", nextCoordinates);
	for (var x=index+1; x<nextCoordinates.length; x++) {
		if (nextCoordinates[x] != null) {
			return {"x": x, "y": nextCoordinates[x]};
		}
	}
	return ret;
}
