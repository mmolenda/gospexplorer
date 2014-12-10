
// author: Marcin Molenda <spamm@molenda.eu>
// since: 09/16/2014


var barPaddingHorizontal = 10;
var barPaddingVertical = 20;
var barWidth = 200;
var barHeight = 20;
var labelOffsetVertical = 10;
var labelOffsetHorizontal = 10;
var colorLightBrown = "#FFE5C9";
var colorMediumBrown = "rgb(201, 115, 68)";
var colorDarkBrown = "rgb(94, 33, 0)";
var colorWhite = "#FFF";

//Width and height
var w = 1200;
var h = (barHeight + barPaddingHorizontal) * 200;

var frequencyColors = {
    1: "#FFF",
    2: "#F5ECCE",
    3: "#F3E2A9",
    4: "#F5DA81",
}

var defaultContent = "<p>PATER NOSTER, qui es in caelis, sanctificetur nomen tuum. Adveniat regnum tuum. Fiat voluntas tua, sicut in caelo et in terra. Panem nostrum quotidianum da nobis hodie, et dimitte nobis debita nostra sicut et nos dimittimus debitoribus nostris. Et ne nos inducas in tentationem, sed libera nos a malo. Amen.</p>";

d3.json("data/data.json", function(dataset) {
    document.getElementById("paragraphs").innerHTML = defaultContent;
    main(dataset);
});

function main(dataset) {
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
    for (var i=0; i<dataset.length; i++) {
        var book = dataset[i];
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
    for (var index=0; index<dataset.length; index++) {
        groups.push(
            svg.append("g")
            .attr("id", "grp-" + index)
            .call(drag)
            .attr("transform", "translate(0, 0)"));
    }

    // Drawing the boxes
    for (var index=0; index<dataset.length; index++) {
        groups[index]
            .selectAll("rect.i" + index)
            .data(dataset[index])
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
                // // Related boxes and paths belong to the same group;
                // // for highlighting purposes
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
                return (d.group) ? frequencyColors[Math.max.apply(Math, groupCounts)] : colorWhite;
            })
            .on("mouseover", boxMouseOver)
            .on("mouseout", boxMouseOut)
            .on("click", adjustOtherBooks);
    }

    // Adding text to the boxes
    for (var index=0; index<dataset.length; index++) {
        groups[index]
            .selectAll("text.i" + index)
            .data(dataset[index])
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
            .attr("fill", colorMediumBrown)
            .on("mouseover", boxMouseOver)
            .on("mouseout", boxMouseOut)
            .on("click", adjustOtherBooks);
    }

    function boxMouseOver(d, i) {
        highlightGroup(d.group);
    }

    function boxMouseOut(d, i) {
        unhighlightGroup(d.group);
    }

    function highlightGroup(group) {
        for(i=0; i<group.length; i++) {
            d3.selectAll(".grp-" + group[i]).classed("highlighted", true);
        }
    }

    function unhighlightGroup(group) {
        for(i=0; i<group.length; i++) {
            d3.selectAll(".grp-" + group[i]).classed("highlighted", false);
        }
    }

    function selectGroup(group) {
        d3.selectAll("rect.selected").classed("selected", false);
        for(i=0; i<group.length; i++) {
            d3.selectAll(".grp-" + group[i]).classed("selected", true);
        }
    }

    function fetchContents(group) {
        var refs = [];
        var titles = [];
        var refsString;
        for(i=0; i<group.length; i++) {
            var rects = d3.selectAll("rect.grp-" + group[i]);
            for(j=0; j<rects[0].length; j++) {
                refs.push(d3.select(rects[0][j]).data()[0].ref);
                titles.push(d3.select(rects[0][j]).data()[0].title);
            }
        }

        // Send AJAX request
        refsString = refs.join(";");
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open("GET", "paragraph.php?q=" + refsString, false);
        xmlhttp.send();
        var obj = JSON.parse(xmlhttp.responseText);
        
        // Prepare right pane HTML
        var rightPaneContents = "";
        for(i=0; i<obj.length; i++) {
            rightPaneContents += "<h1>";
            rightPaneContents += titles[i] + " (" + obj[i]["ref"] + ")";
            rightPaneContents += "</h1>";
            rightPaneContents += "<p>";
            rightPaneContents += obj[i]["content"];
            rightPaneContents += "</p>";
        }
        document.getElementById("paragraphs").innerHTML = rightPaneContents;
    }

    function adjustOtherBooks(d, i) {
        selectGroup(d.group);
        fetchContents(d.group);
        // get the offset of selected book (if any) - it will be added to other books
        // so everything will be correctly adjusted even if clicked book was moved
        var selectedTranslateY = d3.transform(d3.select("g#grp-" + d.book).attr("transform"))["translate"][1];
        // adjust other books to clicked one by group
        for (var book=0; book<dataset.length; book++) {
            var bookGrp = d3.select("g#grp-" + book);
            var index = groupCoordinates[d.group[0]][book];
            // do not touch current book and books that don't contain the group
            if (d.book == book || index == null) { continue; }
            var diff = ((i - index ) * (barHeight + barPaddingHorizontal)) + selectedTranslateY;
            bookGrp.transition().attr("transform", "translate(0," + diff + ")");
        }
    }

    // function resetAll() {
        // document.getElementById("paragraphs").innerHTML = defaultContent;
        // d3.bookGrp.attr("transform", "translate(0,0)");
    // }
}
