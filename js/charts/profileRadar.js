

function createProfileRadar(targetProfile, comparisonProfile, selector, features) {
    const container = d3.select(selector);
    container.selectAll("*").remove();
    
    const width = 350, height = 350, radius = 100;
    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .append("g")
        .attr("transform", `translate(${width/2}, ${height/2})`);

    const angleStep = (Math.PI * 2) / features.length;
    const rScale = d3.scaleLinear().domain([0, 5]).range([0, radius]);

    // Toile de fond (niveaux)
    [1, 2, 3, 4, 5].forEach(level => {
        svg.append("circle").attr("r", rScale(level)).attr("fill", "none").attr("stroke", "#e2e8f0").attr("stroke-width", 0.5);
    });

    const line = d3.lineRadial().radius(d => rScale(d.value)).angle((d, i) => i * angleStep).curve(d3.curveLinearClosed);

    // Comparaison (gris)
    const comparisonData = features.map(f => ({value: comparisonProfile[f] || 0 }));
    svg.append("path")
        .datum([...comparisonData, comparisonData[0]])
        .attr("d", line)
        .attr("fill", "#94a3b8")
        .attr("fill-opacity", 0.1)
        .attr("stroke", "#94a3b8")
        .attr("stroke-dasharray", "4");

    // Profil ciblé (bleu/rouge)
    const targetData = features.map(f => ({value: targetProfile[f] || 0 }));
    svg.append("path")
        .datum([...targetData, targetData[0]])
        .attr("d", line)
        .attr("fill", "#6366f1")
        .attr("fill-opacity", 0.4)
        .attr("stroke", "#6366f1")
        .attr("stroke-width", 2);

    // Labels
    features.forEach((f, i) => {
        const x = Math.cos(angleStep * i - Math.PI/2) * (radius + 20);
        const y = Math.sin(angleStep * i - Math.PI/2) * (radius + 20);
        svg.append("text").attr("x", x).attr("y", y).text(f.replace(/_/g, ' ')).attr("font-size", "10px").attr("text-anchor", "middle").attr("alignment-baseline", "middle");
    });
}