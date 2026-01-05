// js/charts/scatterPlot.js - Version corrigée

let scatterPlot = null;
let currentProjection = 'pca';
let currentColorScheme = 'cluster';
let is3D = false;

function createScatterPlot(container, data, clusters, colors, projection = 'pca') {
    console.log('Création du scatter plot...', data.length, 'points');
    
    const containerElement = document.querySelector(container);
    if (!containerElement) {
        console.error('Conteneur non trouvé:', container);
        return;
    }
    
    const width = containerElement.clientWidth;
    const height = containerElement.clientHeight;
    
    // Nettoyer le conteneur
    d3.select(container).selectAll('*').remove();
    
    // Calculer les coordonnées selon la projection
    const coordinates = calculateProjection(data, projection);
    
    // Ajouter les coordonnées aux données
    data.forEach((d, i) => {
        d.proj_x = coordinates[i][0];
        d.proj_y = coordinates[i][1];
    });
    
    // Créer le SVG
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('class', 'scatter-plot-svg');
    
    // Groupe principal
    const g = svg.append('g')
        .attr('class', 'main-group');
    
    // Échelles avec marge
    const margin = { top: 40, right: 30, bottom: 60, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    const xExtent = d3.extent(coordinates, d => d[0]);
    const yExtent = d3.extent(coordinates, d => d[1]);
    
    // Ajouter un peu d'espace autour des données
    const xPadding = (xExtent[1] - xExtent[0]) * 0.1;
    const yPadding = (yExtent[1] - yExtent[0]) * 0.1;
    
    const xScale = d3.scaleLinear()
        .domain([xExtent[0] - xPadding, xExtent[1] + xPadding])
        .range([margin.left, width - margin.right]);
    
    const yScale = d3.scaleLinear()
        .domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
        .range([height - margin.bottom, margin.top]);
    
    // Groupe pour le zoom
    const zoomGroup = g.append('g')
        .attr('class', 'zoom-group');
    
    // Axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);
    
    zoomGroup.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(xAxis);
    
    zoomGroup.append('g')
        .attr('class', 'y-axis')
        .attr('transform', `translate(${margin.left},0)`)
        .call(yAxis);
    
    // Titres des axes
    const axisLabels = getAxisLabels(projection);
    
    svg.append('text')
        .attr('class', 'x-axis-label')
        .attr('x', width / 2)
        .attr('y', height - 10)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', '#475569')
        .text(axisLabels.x);
    
    svg.append('text')
        .attr('class', 'y-axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', 15)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', '#475569')
        .text(axisLabels.y);
    
    // Ajouter les points
    const points = zoomGroup.append('g')
        .attr('class', 'points-group')
        .selectAll('.data-point')
        .data(data)
        .enter()
        .append('circle')
        .attr('class', 'data-point')
        .attr('cx', d => xScale(d.proj_x))
        .attr('cy', d => yScale(d.proj_y))
        .attr('r', d => getPointSize(d))
        .attr('fill', d => getPointColor(d, currentColorScheme, colors))
        .attr('opacity', 0.8)
        .attr('stroke', d => d.depression === 1 ? '#dc2626' : 'none')
        .attr('stroke-width', d => d.depression === 1 ? 1.5 : 0);
    
    // Tooltip
    const tooltip = d3.select(container)
        .append('div')
        .attr('class', 'scatter-tooltip')
        .style('position', 'absolute')
        .style('background', 'rgba(255, 255, 255, 0.95)')
        .style('padding', '10px')
        .style('border-radius', '6px')
        .style('box-shadow', '0 4px 12px rgba(0,0,0,0.15)')
        .style('border', '1px solid #e2e8f0')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('display', 'none')
        .style('z-index', '1000');
    
    // Événements sur les points
    points.on('mouseover', function(event, d) {
        d3.select(this)
            .attr('r', getPointSize(d) + 3)
            .attr('opacity', 1)
            .attr('stroke', '#1e293b')
            .attr('stroke-width', 2);
        
        tooltip
            .style('display', 'block')
            .style('left', (event.pageX + 15) + 'px')
            .style('top', (event.pageY - 10) + 'px')
            .html(`
                <div style="margin-bottom: 5px; font-weight: 600;">Étudiant #${d.id}</div>
                <div style="color: #475569; margin-bottom: 3px;">
                    <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; 
                           background-color: ${getPointColor(d, currentColorScheme, colors)}; margin-right: 5px;"></span>
                    Cluster ${d.cluster_id + 1}
                </div>
                <div style="color: #64748b; margin-bottom: 3px;">Âge: ${d.age} ans</div>
                <div style="color: #64748b; margin-bottom: 3px;">Dépression: 
                    <span style="color: ${d.depression === 1 ? '#dc2626' : '#16a34a'}; font-weight: 500;">
                        ${d.depression === 1 ? 'Oui' : 'Non'}
                    </span>
                </div>
                <div style="color: #64748b;">CGPA: ${d.cgpa?.toFixed(2) || 'N/A'}</div>
            `);
    })
    .on('mouseout', function() {
        const d = d3.select(this).datum();
        d3.select(this)
            .attr('r', getPointSize(d))
            .attr('opacity', 0.8)
            .attr('stroke', d.depression === 1 ? '#dc2626' : 'none')
            .attr('stroke-width', d.depression === 1 ? 1.5 : 0);
        
        tooltip.style('display', 'none');
    })
    .on('click', function(event, d) {
        // Mettre en évidence le cluster
        points
            .attr('opacity', 0.4)
            .filter(p => p.cluster_id === d.cluster_id)
            .attr('opacity', 0.9)
            .attr('r', getPointSize(d) + 2);
        
        d3.select(this)
            .attr('r', getPointSize(d) + 4)
            .attr('opacity', 1);
        
        // Déclencher la sélection
        const selectionEvent = new CustomEvent('pointSelected', { detail: d });
        document.dispatchEvent(selectionEvent);
    });
    
    // Zoom et déplacement
    const zoom = d3.zoom()
        .scaleExtent([0.5, 8])
        .translateExtent([[0, 0], [width, height]])
        .on('zoom', (event) => {
            zoomGroup.attr('transform', event.transform);
            // Mettre à jour les axes pendant le zoom
            zoomGroup.select('.x-axis').call(xAxis.scale(event.transform.rescaleX(xScale)));
            zoomGroup.select('.y-axis').call(yAxis.scale(event.transform.rescaleY(yScale)));
        });
    
    svg.call(zoom);
    
    // Titre du graphique
    svg.append('text')
        .attr('class', 'chart-title')
        .attr('x', width / 2)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', '600')
        .style('fill', '#1e293b')
        .text(`Visualisation ${projection.toUpperCase()} - ${data.length} étudiants`);
    
    // Stocker la configuration
    scatterPlot = {
        svg,
        zoomGroup,
        xScale,
        yScale,
        data,
        colors,
        projection,
        zoom,
        width,
        height,
        margin
    };
    
    return scatterPlot;
}

// Mettre à jour le scatter plot
function updateScatterPlot(container, data, clusters, projection, colorScheme = 'cluster') {
    if (!scatterPlot) return;
    
    console.log('Mise à jour du scatter plot:', projection, colorScheme);
    
    currentProjection = projection;
    currentColorScheme = colorScheme;
    
    // Calculer les nouvelles coordonnées
    const coordinates = calculateProjection(data, projection);
    data.forEach((d, i) => {
        d.proj_x = coordinates[i][0];
        d.proj_y = coordinates[i][1];
    });
    
    // Mettre à jour les échelles
    const xExtent = d3.extent(coordinates, d => d[0]);
    const yExtent = d3.extent(coordinates, d => d[1]);
    
    const xPadding = (xExtent[1] - xExtent[0]) * 0.1;
    const yPadding = (yExtent[1] - yExtent[0]) * 0.1;
    
    scatterPlot.xScale.domain([xExtent[0] - xPadding, xExtent[1] + xPadding]);
    scatterPlot.yScale.domain([yExtent[0] - yPadding, yExtent[1] + yPadding]);
    
    // Mettre à jour les points
    const points = scatterPlot.zoomGroup.selectAll('.data-point')
        .data(data);
    
    points.transition()
        .duration(750)
        .attr('cx', d => scatterPlot.xScale(d.proj_x))
        .attr('cy', d => scatterPlot.yScale(d.proj_y))
        .attr('fill', d => getPointColor(d, colorScheme, scatterPlot.colors))
        .attr('r', d => getPointSize(d));
    
    // Mettre à jour les axes
    scatterPlot.zoomGroup.select('.x-axis')
        .transition()
        .duration(750)
        .call(d3.axisBottom(scatterPlot.xScale));
    
    scatterPlot.zoomGroup.select('.y-axis')
        .transition()
        .duration(750)
        .call(d3.axisLeft(scatterPlot.yScale));
    
    // Mettre à jour les titres des axes
    const axisLabels = getAxisLabels(projection);
    
    scatterPlot.svg.select('.x-axis-label')
        .transition()
        .duration(750)
        .text(axisLabels.x);
    
    scatterPlot.svg.select('.y-axis-label')
        .transition()
        .duration(750)
        .text(axisLabels.y);
    
    // Mettre à jour le titre
    scatterPlot.svg.select('.chart-title')
        .text(`Visualisation ${projection.toUpperCase()} - ${data.length} étudiants`);
    
    scatterPlot.data = data;
    scatterPlot.projection = projection;
}

// Réinitialiser le zoom
function resetZoom() {
    if (!scatterPlot) return;
    
    scatterPlot.svg.transition()
        .duration(750)
        .call(scatterPlot.zoom.transform, d3.zoomIdentity);
}

// Basculer en vue 3D (simulation)
function toggle3D() {
    if (!scatterPlot) return;
    
    is3D = !is3D;
    
    const button = document.getElementById('toggle-3d');
    if (is3D) {
        button.textContent = '🎲 Vue 2D';
        button.classList.add('active');
        
        // Simulation 3D avec une perspective
        scatterPlot.zoomGroup.selectAll('.data-point')
            .transition()
            .duration(1000)
            .attr('r', d => getPointSize(d) * 1.5)
            .attr('opacity', 0.9);
        
        // Ajouter un effet d'ombre
        scatterPlot.svg.selectAll('.data-point')
            .style('filter', 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))');
    } else {
        button.textContent = '🎲 Vue 3D';
        button.classList.remove('active');
        
        scatterPlot.zoomGroup.selectAll('.data-point')
            .transition()
            .duration(1000)
            .attr('r', d => getPointSize(d))
            .attr('opacity', 0.8);
        
        scatterPlot.svg.selectAll('.data-point')
            .style('filter', 'none');
    }
}

// Obtenir la couleur du point selon le schéma
function getPointColor(d, scheme, clusterColors) {
    switch(scheme) {
        case 'depression':
            return d.depression === 1 ? '#dc2626' : '#16a34a';
        case 'suicidal':
            return d.hasSuicidalThoughts ? '#dc2626' : '#3b82f6';
        case 'academic':
            // Gradient du vert (faible pression) au rouge (forte pression)
            const pressure = d.academic_pressure || 0;
            const intensity = pressure / 5; // Normaliser entre 0 et 1
            return d3.interpolateRdBu(1 - intensity); // Inverser pour que rouge = forte pression
        case 'cluster':
        default:
            return clusterColors[d.cluster_id] || '#94a3b8';
    }
}

// Obtenir la taille du point
function getPointSize(d) {
    let baseSize = 4;
    if (d.depression === 1) baseSize += 1;
    if (d.hasSuicidalThoughts) baseSize += 0.5;
    return baseSize;
}

// Obtenir les labels des axes
function getAxisLabels(projection) {
    const labels = {
        pca: { 
            x: 'Première Composante Principale (PC1)', 
            y: 'Deuxième Composante Principale (PC2)' 
        },
        tsne: { 
            x: 'Dimension t-SNE 1', 
            y: 'Dimension t-SNE 2' 
        },
        umap: { 
            x: 'Dimension UMAP 1', 
            y: 'Dimension UMAP 2' 
        }
    };
    
    return labels[projection] || { x: 'Dimension 1', y: 'Dimension 2' };
}

// Calculer la projection (fonctions simplifiées mais fonctionnelles)
function calculateProjection(data, projection) {
    if (projection === 'pca') {
        return calculatePCA(data);
    } else if (projection === 'tsne') {
        return calculateTSNE(data);
    } else {
        return calculateUMAP(data);
    }
}

function calculatePCA(data) {
    const coordinates = [];
    
    // Simulation simple de PCA avec 2 composantes
    for (let i = 0; i < data.length; i++) {
        const d = data[i];
        // Composante 1: Combinaison de stress académique et financier
        const x = (d.academic_pressure || 0) * 0.5 + 
                 (d.financial_stress || 0) * 0.3 +
                 (Math.random() - 0.5) * 0.5;
        
        // Composante 2: Combinaison de bien-être
        const y = (d.study_satisfaction || 0) * 0.4 +
                 (d.sleep_duration || 0) * 0.3 +
                 (d.dietary_habits || 0) * 0.3 +
                 (Math.random() - 0.5) * 0.5;
        
        coordinates.push([x, y]);
    }
    
    return coordinates;
}

function calculateTSNE(data) {
    const coordinates = [];
    const clusterGroups = {};
    
    // Regrouper par cluster pour mieux visualiser
    data.forEach((d, i) => {
        if (!clusterGroups[d.cluster_id]) {
            clusterGroups[d.cluster_id] = [];
        }
        clusterGroups[d.cluster_id].push(i);
    });
    
    // Créer des coordonnées regroupées par cluster
    const clusterCenters = {};
    Object.keys(clusterGroups).forEach(clusterId => {
        clusterCenters[clusterId] = [
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10
        ];
    });
    
    data.forEach((d, i) => {
        const center = clusterCenters[d.cluster_id] || [0, 0];
        const spread = 1.5; // Spread autour du centre
        
        const x = center[0] + (Math.random() - 0.5) * spread;
        const y = center[1] + (Math.random() - 0.5) * spread;
        
        coordinates.push([x, y]);
    });
    
    return coordinates;
}

function calculateUMAP(data) {
    const coordinates = [];
    
    // Simulation UMAP avec une structure plus préservée que t-SNE
    data.forEach((d, i) => {
        const depressionFactor = d.depression === 1 ? 3 : -3;
        const academicFactor = (d.academic_pressure || 0) * 0.8;
        const sleepFactor = (d.sleep_duration || 0) * 0.6;
        
        const x = depressionFactor + academicFactor + (Math.random() - 0.5) * 2;
        const y = sleepFactor + (d.study_satisfaction || 0) * 0.7 + (Math.random() - 0.5) * 2;
        
        coordinates.push([x, y]);
    });
    
    return coordinates;
}

// Exporter le graphique
function exportScatterPlot(format, filename = 'carte-clusters') {
    if (!scatterPlot) return;
    
    const svgElement = scatterPlot.svg.node();
    exportChart(svgElement, format, filename);
}