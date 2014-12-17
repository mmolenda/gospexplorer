
// author: Marcin Molenda <spamm@molenda.eu>
// since: 09/16/2014

var __version__ = null

var barPaddingHorizontal = 10;
var barPaddingVertical = 20;
var barWidth = 200;
var barHeight = 20;
var labelOffsetVertical = 10;
var labelOffsetHorizontal = 10;

var colorBlue1 = "#f7f8fa";
var colorBlue2 = "#e3e4e6";
var colorBlue3 = "#cfd0d1";
var colorBlue4 = "#b8b9ba";
var colorBlue5 = "#a4a5a6";
var colorBlue6 = "#909191";
var colorBlue7 = "#797a7a";
var colorBlue8 = "#5b5b5c";
var colorRed2 = "#b61a01";

//Width and height
var w = 920;
var h = (barHeight + barPaddingHorizontal) * 200;

var frequencyColors = {
    1: colorBlue1,
    2: colorBlue2,
    3: colorBlue3,
    4: colorBlue4
}

var intro = "" + 
"<p>" + 
"<span style=\"color: #b61a01\">PRZEZNACZENIEM</span> tego narzędzia jest wizualizacja ewangelii pod względem struktury i współwystępowania poszczególnych fragmentów oraz ułatwienie czytania powiązanych fragmentów<br /><br />" +
"<span style=\"color: #b61a01\">INTENSYWNOŚĆ</span> koloru jest proporcjonalna do liczby wystąpień danego fragmentu w ewangeliach - im ciemniejszy kolor w tym większej liczbie ewangelii dany fragment występuje<br /><br />" +
"<span style=\"color: #b61a01\">KLIKNIJ</span> wybrany fragment, aby pokazać jego treść oraz powiązane fragmenty z pozostałych ewangelii<br /><br />" +
"<span style=\"color: #b61a01\">PRZECIĄGNIJ</span> wybraną ewangelię w pionie aby zmienić jej pozycję względem pozostałych<br /><br />" +
"<span style=\"color: #b61a01\">WSZYSTKIE</span> cytaty pochodzą z Biblii Tysiąclecia<br /><br />" +
"<span style=\"color: #b61a01\">AD MAIOREM DEI GLORIAM</span>" +
"</p>";


function injectToRightpane(selector, html) {
    d3.select(selector).html(html)
    .style("color", colorBlue1)
    .transition().duration("500").style("color", colorBlue8);
}

// Setting up intro text
injectToRightpane("#paragraphs", intro);
d3.select("#leftpane").html("Loading...");

// Loading the data and running main function in case of success
d3.json("data/bt_titles.json", function(error, datasetTitles) {
    if (error != null) {
        alert("Cannot load the data - titles");
        return;
    }
    d3.json("data/bt_contents.json", function(error, datasetContents) {
        if (error != null) {
            alert("Cannot load the data - contents");
            return;
        }
        d3.select("#leftpane").html("");
        main(datasetTitles, datasetContents);
    })
});


function main(datasetTitles, datasetContents) {
    // key - group ID
    // value - list of y indexes for each book 
    // 1: [0, null, null, null]
    // 2: [1, 0, 2, 1]
    var groupCoordinates = {};

    // Number of occcurrences for each group
    // for boxes' coloring
    // 1: 1
    // 2: 4
    var groupCount = {};

    // Filling in groupCoordinates and groupCount dictionaries
    for (var i=0; i<datasetTitles.length; i++) {
        var book = datasetTitles[i];
        for (var j=0; j<book.length; j++) {
            var div = book[j];
            for (var k=0; k<div.group.length; k++) {
                var group = div.group[k];
                if (groupCount[group] === undefined) {
                    groupCount[group] = 0
                }
                if (groupCoordinates[group] === undefined) {
                    groupCoordinates[group] = [null, null, null, null]
                }
                groupCount[group]++;
                groupCoordinates[group][i] = j;
            }
        };
    };

    //Create SVG element
    var svg = d3.select("#leftpane")
        .append("svg")
        .attr("width", w)
        .attr("height", h);

    var drag = d3.behavior.drag().origin(function () {
        var g = this; //.parentNode;
        return {
            x: d3.transform(g.getAttribute("transform")).translate[0],
            y: d3.transform(g.getAttribute("transform")).translate[1]
        };
    }).on("drag", function (d, i) {
        var g = this; //.parentNode;
        translate = d3.transform(g.getAttribute("transform")).translate;
        x = d3.event.dx + translate[0],
        y = d3.event.dy + translate[1];

        var grp = d3.select(g).attr('id')

        // Only allow vertical movement
        d3.select("g#" + grp).attr("transform", "translate(" + 0 + "," + (d3.event.dy + translate[1]) + ")");
        d3.event.sourceEvent.stopPropagation();
    });

    // each book consisting of boxes and texts is in separate group
    var groups = [];
    for (var index=0; index<datasetTitles.length; index++) {
        groups.push(
            svg.append("g")
            .attr("id", "grp-" + index)
            .call(drag)
            .attr("transform", "translate(0, 0)"));
    }

    // Drawing the boxes
    for (var index=0; index<datasetTitles.length; index++) {
        groups[index]
            .selectAll("rect.i" + index)
            .data(datasetTitles[index])
            .enter()
            .append("rect")
            .attr("x", function (d, i) {
                return barPaddingVertical + (index * (barWidth + barPaddingVertical));
            })
            .attr("y", function (d, i) {
                return i * (barHeight + barPaddingHorizontal);
            })
            .attr("rx", 3)
            .attr("ry", 3)
            .attr("width", barWidth)
            .attr("height", barHeight)
            .attr("group", function(d, i) {return d.group;})
            .attr("class", function (d, i) {
                var classes = [];
                // Related boxes and paths belong to the same group;
                // for highlighting purposes
                for (var i=0; i<d.group.length; i++) {
                    classes.push("grp-" + d.group[i]);
                }
                return classes.join(" ");
            })
            .attr("fill", function (d, i) {
                // for more than one group coloring according to one with highest number of occurencies
                var groupCounts = [];
                for(i=0; i<d.group.length; i++) {
                    groupCounts.push(groupCount[d.group[i]]);
                }
                return (d.group) ? frequencyColors[Math.max.apply(Math, groupCounts)] : colorBlue1;
            })
            .on("mouseover", boxMouseOver)
            .on("mouseout", boxMouseOut)
            .on("click", boxMouseClick);
    }

    // Adding text to the boxes
    for (var index=0; index<datasetTitles.length; index++) {
        groups[index]
            .selectAll("text.i" + index)
            .data(datasetTitles[index])
            .enter()
            .append("text")
            .text(function (d) {
                return truncate(d.ref + " " + d.title);
            })
            .attr("text-anchor", "left")
            .attr("x", function (d, i) {
                return barPaddingVertical + (index * (barWidth + barPaddingVertical)) + 5;
            })
            .attr("y", function (d, i) {
                return i * (barHeight + barPaddingHorizontal) + (barHeight * 0.65);
            })
            .attr("font-family", "sans-serif")
            .attr("font-size", "11px")
            .attr("fill", colorBlue8)
            .on("mouseover", boxMouseOver)
            .on("mouseout", boxMouseOut)
            .on("click", boxMouseClick);
    }

    function boxMouseOver(d, i) {
        highlightGroup(d.group);
    }

    function boxMouseOut(d, i) {  
        unhighlightGroup(d.group);
    }

    function highlightGroup(group) {
        for(i=0; i<group.length; i++) {
            d3.selectAll(".grp-" + group[i] + ":not(.selected)")
            .style("stroke-width", 2)
            .transition().duration(150).style("stroke", colorBlue6);
        }
    }

    function unhighlightGroup(group) {
        for(i=0; i<group.length; i++) {
            d3.selectAll(".grp-" + group[i] + ":not(.selected)")
            .style("stroke-width", 1)
            .transition().duration(150).style("stroke", colorBlue2);
        }
    }

    function unselectSelected() {
        d3.selectAll("rect.selected")
        .classed("selected", false)
        .style("stroke", colorBlue2)
        .style("stroke-width", 1);
    }

    function selectGroup(group) {
        unselectSelected()
        for(i=0; i<group.length; i++) {
            d3.selectAll(".grp-" + group[i]).classed("selected", true)
            .style("stroke-width", 2)
            .transition().duration(500).style("stroke", colorRed2);
        }
    }

    function fetchAndInjectStories(group) {
        var refs = [];
        var titles = {};
        for(i=0; i<group.length; i++) {
            var rects = d3.selectAll("rect.grp-" + group[i]);
            for(j=0; j<rects[0].length; j++) {
                var ref = d3.select(rects[0][j]).data()[0].ref;
                refs.push(ref);
                titles[ref] = d3.select(rects[0][j]).data()[0].title;
            }
        }

        // Prepare right pane HTML
        var rightPaneContents = "";
        for(i=0; i<refs.length; i++) {
            var ref = refs[i];
            rightPaneContents += "<div class=\"paragraph\">";
            rightPaneContents += "<h1>";
            rightPaneContents += titles[ref].toUpperCase() + " (" + ref + ")";
            rightPaneContents += "</h1>";
            rightPaneContents += "<p>";
            rightPaneContents += datasetContents[ref];
            rightPaneContents += "</p>";
            rightPaneContents += "</div>";
        }
        // reset scroll in paragraphs pane
        var paragraphs = document.getElementById('paragraphs');
        paragraphs.scrollTop = 0;
        // inject fetched data
        injectToRightpane(paragraphs, rightPaneContents);
    }

    function boxMouseClick(d, i) {
        selectGroup(d.group);
        fetchAndInjectStories(d.group);
        // get the offset of selected book (if any) - it will be added to other books
        // so everything will be correctly adjusted even if clicked book was moved
        var selectedTranslateY = d3.transform(d3.select("g#grp-" + d.book).attr("transform"))["translate"][1];
        // adjust other books to clicked one by group
        for (var book=0; book<datasetTitles.length; book++) {
            var bookGrp = d3.select("g#grp-" + book);
            var index = groupCoordinates[d.group[0]][book];
            // do not touch current book and books that don't contain the group
            if (d.book == book || index == null) { continue; }
            var diff = ((i - index ) * (barHeight + barPaddingHorizontal)) + selectedTranslateY;
            bookGrp.transition().attr("transform", "translate(0," + diff + ")");
        }
    }

    function getNextCoordinates(groupCoordinates, group, index) {
        var ret = null;
        if (index > 2) {
            return ret;
        }
        var nextCoordinates = groupCoordinates[group];
        for (var x=index+1; x<nextCoordinates.length; x++) {
            if (nextCoordinates[x] != null) {
                return {"x": x, "y": nextCoordinates[x]};
            }
        }
        return ret;
    }

    function truncate(string){
        var length = 28;
       if (string.length > length)
          return string.substring(0, length) + '...';
       else
          return string;
    };

    d3.select("a#title").on("click", function() {
        // Reset everything
        d3.event.preventDefault();
        unselectSelected();
        injectToRightpane("#paragraphs", intro);
        d3.selectAll("g").transition().duration(125).attr("transform", "translate(0,0)");
    });
}
