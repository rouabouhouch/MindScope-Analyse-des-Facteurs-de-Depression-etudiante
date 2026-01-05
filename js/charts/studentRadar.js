function createRadarChart(student, averages, selector) {
    const container = d3.select(selector);
    container.selectAll("*").remove();
    
    const width = 300, height = 300, radius = 120;
    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width + 100} ${height + 100}`)
        .append("g")
        .attr("transform", `translate(${(width+100)/2}, ${(height+100)/2})`);

    const features = Object.keys(averages);
    const angleStep = (Math.PI * 2) / features.length;

    // Échelle de 1 à 5
    const rScale = d3.scaleLinear().domain([0, 5]).range([0, radius]);

    // Dessin des axes
    features.forEach((f, i) => {
        const x = Math.cos(angleStep * i - Math.PI/2) * radius;
        const y = Math.sin(angleStep * i - Math.PI/2) * radius;
        svg.append("line").attr("x1", 0).attr("y1", 0).attr("x2", x).attr("y2", y).attr("stroke", "#e2e8f0");
        svg.append("text").attr("x", x*1.2).attr("y", y*1.1).text(f).attr("font-size", "10px").attr("text-anchor", "middle");
    });

    const line = d3.lineRadial()
        .radius(d => rScale(d.value))
        .angle((d, i) => i * angleStep);

    // Formater les données pour D3
    const avgPath = features.map(f => ({value: averages[f]}));
    
    // Tracer la moyenne (fond gris)
    svg.append("path")
        .datum([...avgPath, avgPath[0]])
        .attr("d", line)
        .attr("fill", "#94a3b8")
        .attr("fill-opacity", 0.3)
        .attr("stroke", "#94a3b8");

    // Tracer l'étudiant sélectionné (si présent)
    if (student) {
        const studentPath = features.map(f => ({value: student[f] || student['Pression'] })); // Fallback
        svg.append("path")
            .datum([...studentPath, studentPath[0]])
            .attr("d", line)
            .attr("fill", "#ef4444")
            .attr("fill-opacity", 0.5)
            .attr("stroke", "#ef4444")
            .attr("stroke-width", 3);
    }
}