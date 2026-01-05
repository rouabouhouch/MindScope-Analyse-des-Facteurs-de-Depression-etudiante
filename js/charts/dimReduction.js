function createClusterPlot(data, selector, onSelect) {
    const container = d3.select(selector);
    container.selectAll("*").remove();
    
    const width = container.node().clientWidth;
    const height = container.node().clientHeight;
    const margin = 20;

    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`);

    const x = d3.scaleLinear().domain([0, 100]).range([margin, width - margin]);
    const y = d3.scaleLinear().domain([0, 100]).range([height - margin, margin]);

    svg.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.x))
        .attr("cy", d => y(d.y))
        .attr("r", 4)
        .attr("fill", d => d.isDepressed ? "#ef4444" : "#6366f1")
        .attr("opacity", 0.6)
        .style("cursor", "pointer")
        .on("mouseover", function() { d3.select(this).attr("r", 8).attr("opacity", 1); })
        .on("mouseout", function() { d3.select(this).attr("r", 4).attr("opacity", 0.6); })
        .on("click", (event, d) => onSelect(d));
}