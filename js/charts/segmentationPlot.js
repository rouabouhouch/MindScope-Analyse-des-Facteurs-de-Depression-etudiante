import { Utils } from '../utils.js';

function createSegmentationPlot(data, selector, onSelect) {
    const container = d3.select(selector);
    container.selectAll("*").remove(); // Nettoyer l'ancien graphique
    
    const width = container.node().clientWidth || 800;
    const height = container.node().clientHeight || 500;
    const margin = { top: 30, right: 30, bottom: 50, left: 50 };

    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.pca_x))
        .range([0, innerWidth]);
    const y = d3.scaleLinear()
        .domain(d3.extent(data, d => d.pca_y))
        .range([innerHeight, 0]);

    // Couleurs par cluster simulé
    const clusterColors = d3.scaleOrdinal(d3.schemeCategory10);

    let selectedCircle = null; // Pour gérer la sélection visuelle

    svg.selectAll("circle")
        .data(data, d => d.id) // Utilise d.id pour les mises à jour
        .join("circle") // Join pour gérer enter/update/exit
        .attr("cx", d => x(d.pca_x))
        .attr("cy", d => y(d.pca_y))
        .attr("r", 5)
        .attr("fill", d => clusterColors(d.cluster_id)) // Couleur par cluster
        .attr("opacity", 0.7)
        .style("cursor", "pointer")
        .attr("stroke", d => d.isDepressed ? "#ef4444" : "none") // Cercle rouge si dépressif
        .attr("stroke-width", d => d.isDepressed ? 2 : 0)
        .on("click", function(event, d) {
            // Désélectionner l'ancien cercle
            if (selectedCircle) {
                d3.select(selectedCircle).attr("r", 5).attr("stroke-width", d => d.isDepressed ? 2 : 0);
            }
            // Sélectionner le nouveau cercle
            d3.select(this).attr("r", 8).attr("stroke", "#1e293b").attr("stroke-width", 3);
            selectedCircle = this;
            onSelect(d); // Remonte l'étudiant sélectionné
        });
    
    // Ajout des axes pour un graphique plus "scientifique"
    svg.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x));
    svg.append("g")
        .call(d3.axisLeft(y));

    // Légende des clusters
    const legend = svg.append("g")
        .attr("transform", `translate(${innerWidth - 100}, 10)`);
    
    clusterColors.domain().forEach((clusterId, i) => {
        legend.append("rect")
            .attr("x", 0)
            .attr("y", i * 20)
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", clusterColors(clusterId));
        legend.append("text")
            .attr("x", 15)
            .attr("y", i * 20 + 9)
            .text(`Cluster ${clusterId + 1}`)
            .style("font-size", "12px")
            .attr("alignment-baseline", "middle");
    });
}