 function createClusterPlot(data, selector) {
    const margin = {top: 20, right: 20, bottom: 40, left: 40},
          width = 600 - margin.left - margin.right,
          height = 400 - margin.top - margin.bottom;

    const svg = d3.select(selector)
        .append("svg")
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Échelles (Simulées ici sur les composantes PCA1 et PCA2 calculées en amont)
    const x = d3.scaleLinear().domain(d3.extent(data, d => d.pca_x)).range([0, width]);
    const y = d3.scaleLinear().domain(d3.extent(data, d => d.pca_y)).range([height, 0]);

    // Color Scale: Rouge pour dépression, Bleu pour sain
    const color = d3.scaleOrdinal()
        .domain([0, 1])
        .range(["#6366F1", "#EF4444"]); 

    // Points avec transition fluide
    svg.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.pca_x))
        .attr("cy", d => y(d.pca_y))
        .attr("r", 4)
        .attr("fill", d => color(d.depression))
        .attr("opacity", 0.6)
        .on("mouseover", function(event, d) {
            d3.select(this).attr("stroke", "#000").attr("r", 6).attr("opacity", 1);
            // Ici, on déclencherait le "Brushing" : mettre à jour le Radar Chart
            updateRadarChart(d); 
        })
        .on("mouseout", function() {
            d3.select(this).attr("stroke", "none").attr("r", 4).attr("opacity", 0.6);
        });

    // Annotations automatiques pour les clusters
    svg.append("text").attr("x", 10).attr("y", 10)
       .text("← Profils Résilients").style("font-size", "12px").attr("fill", "#64748b");
}